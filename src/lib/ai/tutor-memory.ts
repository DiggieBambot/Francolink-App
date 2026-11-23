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
  stats: { studentMessages: number; minutes: number };
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

  const [memRes, tagRes] = await Promise.all([
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
  ]);

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

  if (!notes && topTags.length === 0) return "";

  const lines = ["What you remember about this student from earlier sessions:"];
  if (notes) lines.push(notes);
  if (topTags.length) {
    lines.push(
      `Mistakes they keep making this month: ${topTags.join(", ")}. Weave in natural chances to practise these, without lecturing.`
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

  const [{ data: messages }, { data: corrections }, { data: mem }] = await Promise.all([
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
  ]);

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
  "wins": ["up to 3 short specific things the student did well, in English"],
  "vocab": [{"term": "target-language word or short phrase worth keeping", "translation": "English"}],
  "focus": "one concrete thing to practise next time, in English, one sentence",
  "memory": "the updated memory note"
}

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
    },
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
