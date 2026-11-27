// src/lib/ai/tutor-memory.ts
//
// Long-term memory and end-of-session recaps for the AI tutor.
//
// The premium apps feel like a tutor rather than a chatbot mostly because they
// remember: your name, your job, what you talked about last time, the mistake
// you keep making. We get that cheaply with one short note per student that is
// *rewritten* by every recap (so it never grows), plus the student's most
// frequent correction tags, which are already being logged per message.
//
// Everything here is best-effort. If the phase-1 migration has not been run the
// queries fail and the tutor simply carries on without memory.

import type OpenAI from "openai";
import { costOf } from "@/lib/ai/pricing";
import { logAiUsage } from "@/lib/ai/usage-log";
import { classXp, looksEnglish } from "@/lib/ai/tutor-coach";
import { recordActivity } from "@/lib/streak/record-activity";

/** Hard cap on the stored note. It rides along on every tutor call. */
const MAX_MEMORY_CHARS = 700;
/** Conversations shorter than this are not worth summarising. */
export const MIN_MESSAGES_FOR_RECAP = 4;
/** Transcript sent to the recap model, newest kept, in characters. */
const MAX_TRANSCRIPT_CHARS = 9000;

export interface RecapVocab {
  term: string;
  translation: string;
}

export interface RecapCorrection {
  original: string;
  corrected: string;
  explanation: string | null;
  tag: string | null;
}

export interface TutorRecap {
  summary: string;
  wins: string[];
  vocab: RecapVocab[];
  focus: string;
  corrections: RecapCorrection[];
  stats: {
    studentMessages: number;
    minutes: number;
    /** Words the student said or typed in the language this class. */
    words?: number;
    /** The same numbers from their previous class, for comparison. */
    previous?: { words: number; corrections: number; minutes: number } | null;
  };
  /** Their most frequent kinds of mistake over the last 30 days. */
  patterns?: { tag: string; count: number }[];
  /** XP earned for this class (once). */
  xp?: number;
  model?: string;
  costUsd?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Svc = any;

/**
 * Prompt block with what the tutor should remember about this student.
 * Returns '' when there is nothing yet.
 */
export async function loadMemoryBlock(
  svc: Svc,
  userId: string,
  language: string
): Promise<string> {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [memRes, tagRes, lastRes] = await Promise.all([
    svc
      .from("ai_tutor_memory")
      .select("notes")
      .eq("user_id", userId)
      .eq("language", language)
      .maybeSingle(),
    svc
      .from("ai_tutor_corrections")
      .select("tag")
      .eq("user_id", userId)
      .gte("created_at", since)
      .limit(200),
    // The latest few corrections, for a warm-up at the start of the next class.
    svc
      .from("ai_tutor_corrections")
      .select("original, corrected, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);
  const recent = ((lastRes?.data ?? []) as Array<{ original: string; corrected: string }>).filter(
    (c) => c.original && c.corrected
  );

  const notes: string = memRes?.data?.notes?.trim() ?? "";

  const counts = new Map<string, number>();
  for (const row of (tagRes?.data ?? []) as Array<{ tag: string | null }>) {
    const tag = row.tag || "other";
    if (tag === "other") continue;
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  const topTags = [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, n]) => `${tag.replace(/_/g, " ")} (${n}×)`);

  if (!notes && topTags.length === 0 && recent.length === 0) return "";

  const lines = ["What you remember about this student from earlier sessions:"];
  if (notes) lines.push(notes);
  if (topTags.length) {
    lines.push(
      `Mistakes they keep making this month: ${topTags.join(", ")}. Weave in natural chances to practise these, without lecturing.`
    );
  }
  if (recent.length) {
    lines.push(
      `Mistakes from their last class (good for a quick warm-up question): ${recent
        .map((c) => `"${c.original}" → "${c.corrected}"`)
        .join("; ")}.`
    );
  }
  lines.push(
    "Use this the way a human tutor would: refer back to it naturally when relevant (e.g. ask how the thing they mentioned went). Never recite it."
  );
  return lines.join("\n");
}

function clean(s: unknown, max = 300): string {
  return String(s ?? "").trim().slice(0, max);
}

/**
 * Summarise a finished conversation, store the recap on it, and rewrite the
 * student's memory note. Idempotent: an already-recapped conversation returns
 * its stored recap without another model call.
 */
export async function recapConversation(opts: {
  svc: Svc;
  openai: OpenAI;
  model: string;
  conversationId: string;
  userId: string;
}): Promise<TutorRecap | null> {
  const { svc, openai, model, conversationId, userId } = opts;

  const { data: conv } = await svc
    .from("ai_tutor_conversations")
    .select("id, user_id, language, recap, ended_at, started_at, last_message_at")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conv || conv.user_id !== userId) return null;
  if (conv.ended_at && conv.recap) return conv.recap as TutorRecap;

  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const [{ data: messages }, { data: corrections }, { data: mem }, { data: prevConv }, { data: tagRows }] = await Promise.all([
    svc
      .from("ai_tutor_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
    svc
      .from("ai_tutor_corrections")
      .select("original, corrected, explanation, tag")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
    svc
      .from("ai_tutor_memory")
      .select("notes")
      .eq("user_id", userId)
      .eq("language", conv.language)
      .maybeSingle(),
    svc
      .from("ai_tutor_conversations")
      .select("recap")
      .eq("user_id", userId)
      .eq("language", conv.language)
      .neq("id", conversationId)
      .not("recap", "is", null)
      .order("ended_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    svc
      .from("ai_tutor_corrections")
      .select("tag")
      .eq("user_id", userId)
      .gte("created_at", since)
      .limit(300),
  ]);
  const english = conv.language === "en";

  const rows = (messages ?? []) as Array<{ role: string; content: string; created_at: string }>;
  if (rows.length < MIN_MESSAGES_FOR_RECAP) return null;

  // Keep the newest part of a long session.
  let transcript = rows
    .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n");
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    transcript = "…" + transcript.slice(-MAX_TRANSCRIPT_CHARS);
  }

  const correctionList: RecapCorrection[] = (
    (corrections ?? []) as Array<RecapCorrection>
  )
    // Older classes logged English requests for help as "mistakes".
    .filter((c) => english || !looksEnglish(c.original))
    // The same slip corrected twice should appear once.
    .filter(
      (c, i, all) => all.findIndex((d) => d.corrected === c.corrected) === i
    )
    .slice(0, 12);

  const previousNotes: string = mem?.notes ?? "";

  const system = `You write the end-of-session recap for a language-learning app's AI tutor, and maintain the tutor's private memory note about the student.

Return JSON only:
{
  "summary": "1-2 warm sentences in English, addressed to the student as 'you', on what you practised together",
  "wins": ["up to 3 short specific things the student did well, in English, each pointing at something they actually said"],
  "vocab": [{"term": "target-language word or short phrase worth keeping", "translation": "English"}],
  "focus": "one concrete thing to practise next time, in English, one sentence",
  "memory": "the updated memory note"
}

Be honest. Only describe what the transcript shows the STUDENT doing. Never praise something they did not do (if the tutor explained something and the student never used it, it is not a win), and never claim they mastered or "learned how to use something correctly" after one exchange; say they practised or started on it. Requests in English for help are not wins and not mistakes. If there is little to praise, give fewer wins.

Rules for "vocab": up to 8 items, only words/phrases that actually appeared in the conversation and are useful at the student's level; prefer ones the student struggled with or the tutor introduced. Base form for verbs and nouns with article (e.g. "la boulangerie").

Rules for "memory": rewrite the previous note merged with anything new and durable — name, job, where they live, why they are learning, interests, upcoming events (with dates if given), what they find hard, preferred pace. Third person, plain sentences, under 600 characters. Drop anything trivial or one-off. Never include anything sensitive (health, finances, passwords, etc.).`;

  const user = `Previous memory note:\n${previousNotes || "(none)"}\n\nCorrections made this session:\n${
    correctionList.map((c) => `- ${c.original} → ${c.corrected}`).join("\n") || "(none)"
  }\n\nTranscript:\n${transcript}`;

  const completion = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
    max_tokens: 700,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsed: any = {};
  try {
    parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
  } catch {
    parsed = {};
  }

  const started = new Date(conv.started_at).getTime();
  const last = new Date(rows[rows.length - 1].created_at).getTime();

  const recap: TutorRecap = {
    summary: clean(parsed.summary, 400),
    wins: (Array.isArray(parsed.wins) ? parsed.wins : [])
      .map((w: unknown) => clean(w, 160))
      .filter(Boolean)
      .slice(0, 3),
    vocab: (Array.isArray(parsed.vocab) ? parsed.vocab : [])
      .map((v: { term?: unknown; translation?: unknown }) => ({
        term: clean(v?.term, 80),
        translation: clean(v?.translation, 120),
      }))
      .filter((v: RecapVocab) => v.term && v.translation)
      .slice(0, 8),
    focus: clean(parsed.focus, 240),
    corrections: correctionList,
    stats: {
      studentMessages: rows.filter((m) => m.role === "user").length,
      minutes: Math.max(1, Math.round((last - started) / 60000)),
      words: rows
        .filter((m) => m.role === "user" && (english || !looksEnglish(m.content)))
        .reduce((n, m) => n + m.content.split(/\s+/).filter(Boolean).length, 0),
      previous: (() => {
        const p = (prevConv?.recap ?? null) as TutorRecap | null;
        if (!p?.stats) return null;
        return {
          words: p.stats.words ?? 0,
          corrections: p.corrections?.length ?? 0,
          minutes: p.stats.minutes ?? 0,
        };
      })(),
    },
    patterns: (() => {
      const counts = new Map<string, number>();
      for (const r of (tagRows ?? []) as Array<{ tag: string | null }>) {
        const t = r.tag || "other";
        if (t !== "other") counts.set(t, (counts.get(t) ?? 0) + 1);
      }
      return [...counts.entries()]
        .filter(([, n]) => n >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag, count]) => ({ tag, count }));
    })(),
    model,
    costUsd: costOf(
      model,
      completion.usage?.prompt_tokens ?? 0,
      completion.usage?.completion_tokens ?? 0
    ),
  };

  await logAiUsage({
    userId,
    feature: "recap",
    model,
    costUsd: recap.costUsd ?? 0,
    tokensIn: completion.usage?.prompt_tokens ?? 0,
    tokensOut: completion.usage?.completion_tokens ?? 0,
  });

  const memory = clean(parsed.memory, MAX_MEMORY_CHARS);

  // XP and a day of streak for the class, once (a recapped class is never
  // recapped again). Best-effort: a failure here never loses the recap.
  recap.xp = classXp(recap.stats.studentMessages);
  if (recap.xp > 0) {
    try {
      const { error } = await svc.rpc("increment_user_xp", { p_user_id: userId, p_xp_amount: recap.xp });
      if (error) {
        const { data: u } = await svc.from("users").select("total_xp").eq("id", userId).maybeSingle();
        if (u) await svc.from("users").update({ total_xp: (u.total_xp || 0) + recap.xp }).eq("id", userId);
      }
    } catch (err) {
      console.error("Tutor class XP failed:", err);
    }
  }
  await recordActivity(userId, { kind: "ai_tutor" }).catch(() => undefined);

  await Promise.all([
    svc
      .from("ai_tutor_conversations")
      .update({ recap, ended_at: new Date().toISOString() })
      .eq("id", conversationId),
    memory
      ? svc.from("ai_tutor_memory").upsert(
          {
            user_id: userId,
            language: conv.language,
            notes: memory,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,language" }
        )
      : Promise.resolve(),
  ]);

  return recap;
}

/**
 * Recap the student's most recent unfinished conversation, if it is long
 * enough to be worth it. Called in the background when a new conversation
 * starts, so memory still updates for students who never press "End session".
 */
export async function recapStaleConversation(opts: {
  svc: Svc;
  openai: OpenAI;
  model: string;
  userId: string;
  excludeId?: string;
}): Promise<void> {
  const { svc, userId, excludeId } = opts;
  let query = svc
    .from("ai_tutor_conversations")
    .select("id")
    .eq("user_id", userId)
    .is("ended_at", null)
    .order("last_message_at", { ascending: false })
    .limit(1);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error || !data?.[0]) return;

  await recapConversation({ ...opts, conversationId: data[0].id });
}
