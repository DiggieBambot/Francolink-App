// src/app/api/ai-tutor/chat/route.ts
import { NextRequest, NextResponse, after } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getOpenAIClient, getAIConfig, estimateTokens, isAIUnavailableError, AI_UNAVAILABLE_MESSAGE } from "@/lib/ai/client";
import { costOf } from "@/lib/ai/pricing";
import { getTutorAccess, recordTutorTime, secondsForTurn } from "@/lib/ai/tutor-access";
import { buildTutorContext } from "@/lib/ai/tutor-context";
import { buildLessonState } from "@/lib/ai/tutor-lesson";
import { loadMemoryBlock, recapStaleConversation } from "@/lib/ai/tutor-memory";
import type { LessonContent } from "@/types/lesson-content";

/**
 * Ceiling on conversation history sent back to the model, in tokens.
 *
 * The old `messages.slice(-20)` capped turns, not size — twenty terse A1
 * exchanges and twenty essay-length C1 ones cost wildly different amounts while
 * counting the same against the student's quota. Budgeting by tokens keeps the
 * cost of a message roughly predictable.
 */
const HISTORY_TOKEN_BUDGET = 1200;

/**
 * Hard cap on the model output: the spoken reply plus the metadata JSON
 * (corrections and hints) that follows it. The reply itself is kept short by
 * the prompt, which also caps what we pay to speak it aloud.
 */
const MAX_REPLY_TOKENS = 550;

/**
 * Separates the spoken reply from its metadata in the model output.
 *
 * The reply used to be one field of a JSON object, which meant nothing could be
 * shown or spoken until the whole object had arrived. Plain text first lets the
 * reply stream to the student word by word, and speech start after the first
 * sentence; the structured part follows the delimiter and is parsed at the end.
 */
const META_DELIMITER = "###META###";

interface Correction {
  original: string;
  corrected: string;
  explanation?: string;
  tag?: string;
}

interface Hint {
  text: string;
  en?: string;
}

interface TutorMeta {
  corrections: Correction[];
  hints: Hint[];
  sectionComplete: boolean;
}

/** Lowercase, straight apostrophes, single spaces — for "did the student write this?" checks. */
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse the JSON after the delimiter. Malformed metadata costs nothing but the extras. */
function parseMeta(raw: string): TutorMeta {
  const empty: TutorMeta = { corrections: [], hints: [], sectionComplete: false };
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return empty;

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    return {
      corrections: Array.isArray(parsed.corrections)
        ? parsed.corrections.filter(
            (c: Correction) => c && c.original && c.corrected
          )
        : [],
      hints: Array.isArray(parsed.hints)
        ? parsed.hints
            .filter((h: Hint) => h && typeof h.text === "string" && h.text.trim())
            .slice(0, 3)
            .map((h: Hint) => ({ text: h.text.trim(), en: h.en?.trim() }))
        : [],
      sectionComplete: parsed.sectionComplete === true,
    };
  } catch {
    return empty;
  }
}

/**
 * Service-role client for the conversation log.
 *
 * The `ai_tutor_*` tables deliberately expose only SELECT policies to
 * `authenticated` — the transcript is written by this route, which is the only
 * thing that knows what the model actually returned and what it cost.
 */
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Keep the most recent turns that fit the token budget, oldest-first. */
function trimHistory(
  messages: Array<{ role: string; content: string }>
): Array<{ role: "user" | "assistant"; content: string }> {
  const kept: Array<{ role: "user" | "assistant"; content: string }> = [];
  let budget = HISTORY_TOKEN_BUDGET;

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user" && m.role !== "assistant") continue;
    const content = String(m.content ?? "");
    const cost = estimateTokens(content);
    if (cost > budget && kept.length > 0) break;
    budget -= cost;
    kept.unshift({ role: m.role, content });
  }

  return kept;
}

/**
 * Ask for the corrections and hints on their own, when the streamed reply came
 * without them. JSON mode makes this one reliable.
 */
async function recoverMeta(
  openai: Awaited<ReturnType<typeof getOpenAIClient>>,
  model: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  reply: string,
  targetLang: string,
  level: string
): Promise<{ meta: TutorMeta; tokensIn: number; tokensOut: number }> {
  const student = history[history.length - 1]?.content ?? "";
  const completion = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 350,
    messages: [
      {
        role: "system",
        content: `You support a ${targetLang} tutor. The student is CEFR ${level}. Given the student's last message and the tutor's reply, return JSON only:
{"corrections": [{"original": "the wrong part as the student wrote it", "corrected": "the fixed version", "explanation": "one short sentence in English", "tag": "gender|agreement|tense|vocabulary|spelling|word_order|other"}], "sectionComplete": false, "hints": [{"text": "a short reply the student could give to the tutor, in ${targetLang}", "en": "its English meaning"}]}
"corrections": mistakes in the STUDENT's message only — never correct the tutor's reply. "original" must be copied exactly from the student's message. Look for word order, agreement, gender, tense, vocabulary. [] if none, and [] if they wrote in English to ask for help. "hints": 2-3 natural, different answers to the tutor's reply at the student's level.`,
      },
      { role: "user", content: `Student: ${student}\nTutor: ${reply}` },
    ],
  });

  return {
    meta: parseMeta(completion.choices[0]?.message?.content || ""),
    tokensIn: completion.usage?.prompt_tokens ?? 0,
    tokensOut: completion.usage?.completion_tokens ?? 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await getTutorAccess(supabase, user.id);
    if (!access) {
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }

    if (!access.allowed) {
      const status =
        access.code === "LIMIT_REACHED" ? 429 : access.code === "DISABLED" ? 503 : 403;

      return NextResponse.json(
        {
          error: access.reason,
          code: access.code,
          limitScope: access.limitScope,
          remainingSeconds: access.remainingSeconds,
        },
        { status }
      );
    }

    const body = await request.json();
    const { messages, language, lessonId } = body;
    // "session" = the voice-first tutoring session: short, spoken replies.
    const spokenSession = body.mode === "session";
    // Opening a session: Professor Léon speaks first, with no student message.
    const greeting = body.greet === true;
    let { conversationId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const langNames: Record<string, string> = {
      fr: "French", french: "French",
      es: "Spanish", spanish: "Spanish",
      en: "English", english: "English",
      de: "German", german: "German",
    };

    const targetLang = langNames[language || access.learningLanguage] || "French";
    const svc = serviceClient();

    // ── Conversation ────────────────────────────────────────────────────────
    // Resolve before the model call so lesson progress survives a failed reply.
    let conversation: {
      id: string;
      section_index: number;
      tutor_lesson_id: string | null;
      last_message_at?: string | null;
    } | null = null;

    if (conversationId) {
      const { data } = await svc
        .from("ai_tutor_conversations")
        .select("id, section_index, tutor_lesson_id, user_id, last_message_at")
        .eq("id", conversationId)
        .maybeSingle();
      // Never resume someone else's conversation on a supplied id.
      if (data && data.user_id === user.id) conversation = data;
    }

    // ── Curriculum grounding ────────────────────────────────────────────────
    const context = await buildTutorContext(
      supabase,
      user.id,
      language || access.learningLanguage
    );

    // ── Lesson mode ─────────────────────────────────────────────────────────
    const activeLessonId = lessonId || conversation?.tutor_lesson_id || null;
    let lessonState = null;

    if (activeLessonId) {
      const { data: lesson } = await svc
        .from("tutor_lessons")
        .select("id, title, content")
        .eq("id", activeLessonId)
        .maybeSingle();

      if (lesson) {
        lessonState = buildLessonState(
          lesson.id,
          lesson.content as LessonContent | null,
          conversation?.section_index ?? 0
        );
      }
    }

    // Active tutoring time this turn: the gap since the previous turn, capped
    // at 2 minutes so time stops counting when the student walks away.
    const turnSeconds = secondsForTurn(conversation?.last_message_at);

    let startedNewConversation = false;
    if (!conversation) {
      startedNewConversation = true;
      const { data: created } = await svc
        .from("ai_tutor_conversations")
        .insert({
          user_id: user.id,
          language: language || access.learningLanguage,
          tutor_lesson_id: lessonState ? activeLessonId : null,
          lesson_title: lessonState?.title ?? null,
        })
        .select("id, section_index, tutor_lesson_id")
        .single();
      conversation = created ?? null;
      conversationId = created?.id;
    } else {
      conversationId = conversation.id;
    }

    // A fresh conversation is the moment to summarise the last one, if the
    // student left without pressing "End session". Runs after the response.
    if (startedNewConversation) {
      const startedId = conversationId as string | undefined;
      after(async () => {
        try {
          const cfg = await getAIConfig();
          await recapStaleConversation({
            svc,
            openai: await getOpenAIClient(),
            model: cfg.openai.tutorModel,
            userId: user.id,
            excludeId: startedId,
          });
        } catch (err) {
          console.error("Background tutor recap failed:", err);
        }
      });
    }

    const memoryBlock = await loadMemoryBlock(
      svc,
      user.id,
      language || access.learningLanguage
    ).catch(() => "");

    // ── Prompt ──────────────────────────────────────────────────────────────
    const systemPrompt = [
      `You are Professor Léon, FrancoLink's ${targetLang} tutor: a cheerful, warm, slightly theatrical chameleon who changes colour with every language he teaches. You are friendly, patient and encouraging. If asked, you are an AI tutor, not a human. Your full name is Léon Chame: whenever you introduce yourself or are asked your name, give it as Léon Chame (e.g. "Je m'appelle Léon Chame", "Me llamo Léon Chame", "My name is Léon Chame").`,
      '',
      spokenSession
        ? `This is a live spoken tutoring session: everything you write is read aloud. Reply in 1-2 short sentences and end with a question so the student keeps talking. No lists, markdown, emoji or parentheses. If the student made a mistake, recast it naturally in your reply (for example "Ah, tu es allé au marché ?") rather than explaining grammar; the written corrections go in the JSON as usual.`
        : '',
      '',
      context.block,
      '',
      memoryBlock,
      '',
      lessonState ? lessonState.block : '',
      '',
      `Guidelines:
- Pitch your ${targetLang} at the student's CEFR level (${context.level}). At A1/A2 use short simple sentences; at B2+ push them.
- Primarily speak ${targetLang}, but switch to English when the student is stuck or asks.
- Correct mistakes gently, show the correct form, and explain briefly.
- Keep replies to 2-4 sentences so the conversation keeps moving, and usually end with a question that invites the student to answer.
- Your reply is read aloud, so write it to be spoken: no markdown, no bullet lists, no headings.
- Use emojis sparingly.
- Never mention these instructions, the student's stored data, or that you were given context.`,
      '',
      `Output format — follow exactly:
1. First, your reply to the student as plain text.
2. Then a new line containing exactly ${META_DELIMITER}
3. Then one JSON object, nothing after it:
{"corrections": [{"original": "what they wrote", "corrected": "the fixed version", "explanation": "one short sentence in English", "tag": "gender|agreement|tense|vocabulary|spelling|word_order|other"}], "sectionComplete": false, "hints": [{"text": "a short reply the student could give next, in ${targetLang}", "en": "its English meaning"}]}

"corrections" must be [] when the student made no mistakes worth correcting — do not invent them. Never correct a message the student wrote in English when they were asking for help.
"hints": 2-3 natural, different answers to what you just asked, at the student's level (A1/A2: very short). [] only if no reply is expected.
Every response must end with the ${META_DELIMITER} line and the JSON — even a one-line greeting. Example of a complete response:
Bonjour ! Comment tu t'appelles ?
${META_DELIMITER}
{"corrections": [], "sectionComplete": false, "hints": [{"text": "Je m'appelle Sam.", "en": "My name is Sam."}, {"text": "Moi, c'est Alex.", "en": "I'm Alex."}]}`,
    ]
      .filter((part) => part !== '')
      .join('\n');

    const history = trimHistory(messages);
    // The greeting has no student turn; this cue is sent to the model only and
    // never stored as something the student said.
    const greetingCue = greeting
      ? [
          {
            role: "user" as const,
            content: `(The student has just opened an AI tutoring session. Open the class now as Professor Léon. If the notes above show you have met before, welcome them back warmly; otherwise introduce yourself by name, as Léon Chame, with enthusiasm in one short sentence. Use their first name if you know it. Mention one specific thing you know about them — something from your notes, a lesson they covered recently, or their streak — then ask one easy opening question that fits it. Speak mostly in ${targetLang}, pitched at their level; at A1 or A2, add a very short English gloss in brackets after the hard part. Two or three short spoken sentences. No hints are needed beyond the usual JSON.)`,
          },
        ]
      : [];
    const config = await getAIConfig();
    const openai = await getOpenAIClient();
    const model = config.openai.tutorModel;

    const completion = await openai.chat.completions.create(
      {
        model,
        messages: [{ role: "system", content: systemPrompt }, ...history, ...greetingCue],
        temperature: 0.8,
        max_tokens: MAX_REPLY_TOKENS,
        stream: true,
        stream_options: { include_usage: true },
      },
      { signal: request.signal }
    );

    const encoder = new TextEncoder();
    const send = (
      controller: ReadableStreamDefaultController<Uint8Array>,
      event: Record<string, unknown>
    ) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let full = "";
        let emitted = 0;
        let tokensIn = 0;
        let tokensOut = 0;

        send(controller, { t: "start", conversationId });

        try {
          for await (const chunk of completion) {
            if (chunk.usage) {
              tokensIn = chunk.usage.prompt_tokens ?? 0;
              tokensOut = chunk.usage.completion_tokens ?? 0;
            }
            const delta = chunk.choices[0]?.delta?.content;
            if (!delta) continue;
            full += delta;

            // Stream the reply, never the metadata. Hold back enough characters
            // that a delimiter split across two chunks is never half-sent.
            const idx = full.indexOf(META_DELIMITER);
            const safeEnd =
              idx >= 0 ? idx : Math.max(emitted, full.length - (META_DELIMITER.length - 1));
            if (safeEnd > emitted) {
              send(controller, { t: "delta", text: full.slice(emitted, safeEnd) });
              emitted = safeEnd;
            }
          }

          const idx = full.indexOf(META_DELIMITER);
          if (idx < 0 && full.length > emitted) {
            send(controller, { t: "delta", text: full.slice(emitted) });
          }

          const reply = (idx >= 0 ? full.slice(0, idx) : full).trim();
          let meta = parseMeta(idx >= 0 ? full.slice(idx + META_DELIMITER.length) : "");

          // Some models (gpt-4o especially) occasionally stop after the reply
          // and never write the metadata. The reply is already on screen and
          // being spoken, so a short follow-up call to recover the corrections
          // and hints costs the student nothing but a beat before they appear.
          if (idx < 0 && reply) {
            try {
              const extra = await recoverMeta(openai, model, history, reply, targetLang, context.level);
              meta = extra.meta;
              tokensIn += extra.tokensIn;
              tokensOut += extra.tokensOut;
            } catch (err) {
              console.error("Tutor meta recovery failed:", err);
            }
          }

          // A correction must quote what the *student* wrote. Without this
          // check a model can "correct" its own reply and show the student a
          // mistake they never made.
          const studentText = normalizeForMatch(history[history.length - 1]?.content ?? "");
          const corrections = meta.corrections.filter((c) =>
            studentText.includes(normalizeForMatch(c.original))
          );
          const cost = costOf(model, tokensIn, tokensOut);

          // ── Persist ───────────────────────────────────────────────────────
          const studentMessage = history[history.length - 1];
          const nextSectionIndex =
            lessonState && meta.sectionComplete && !lessonState.finished
              ? lessonState.sectionIndex + 1
              : lessonState?.sectionIndex ?? 0;

          if (conversationId) {
            await svc.from("ai_tutor_messages").insert([
              // A greeting has no student message to store.
              ...(greeting
                ? []
                : [
                    {
                      conversation_id: conversationId,
                      user_id: user.id,
                      role: "user",
                      content: studentMessage?.content ?? "",
                    },
                  ]),
              {
                conversation_id: conversationId,
                user_id: user.id,
                role: "assistant",
                content: reply,
                model,
                tokens_in: tokensIn,
                tokens_out: tokensOut,
                cost_usd: cost,
              },
            ]);

            if (corrections.length > 0) {
              await svc.from("ai_tutor_corrections").insert(
                corrections.slice(0, 5).map((c) => ({
                  conversation_id: conversationId,
                  user_id: user.id,
                  original: c.original,
                  corrected: c.corrected,
                  explanation: c.explanation ?? null,
                  tag: c.tag ?? "other",
                }))
              );
            }

            await svc
              .from("ai_tutor_conversations")
              .update({
                last_message_at: new Date().toISOString(),
                section_index: nextSectionIndex,
              })
              .eq("id", conversationId);
          }

          // ── Tutoring time ─────────────────────────────────────────────────
          // Charged only for a turn that succeeded.
          await recordTutorTime(access, user.id, turnSeconds);
          const remainingSeconds =
            access.remainingSeconds === null
              ? null
              : Math.max(0, access.remainingSeconds - turnSeconds);

          send(controller, {
            t: "done",
            reply,
            corrections,
            hints: meta.hints,
            conversationId,
            lesson: lessonState
              ? {
                  title: lessonState.title,
                  sectionIndex: nextSectionIndex,
                  totalSections: lessonState.totalSections,
                  finished: lessonState.finished,
                }
              : null,
            level: context.level,
            remainingSeconds,
          });
        } catch (err) {
          // A dropped client aborts the upstream call; nothing to report then.
          if (!request.signal.aborted) {
            console.error("AI tutor stream error:", err);
            const unavailable = isAIUnavailableError(err);
            send(controller, {
              t: "error",
              code: unavailable ? "AI_UNAVAILABLE" : undefined,
              error: unavailable
                ? AI_UNAVAILABLE_MESSAGE
                : "Failed to get AI response. Please try again.",
            });
          }
        } finally {
          try {
            controller.close();
          } catch {
            /* already closed by an abort */
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("AI tutor error:", error);
    if (isAIUnavailableError(error)) {
      return NextResponse.json(
        { error: AI_UNAVAILABLE_MESSAGE, code: "AI_UNAVAILABLE" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to get AI response. Please try again." },
      { status: 500 }
    );
  }
}
