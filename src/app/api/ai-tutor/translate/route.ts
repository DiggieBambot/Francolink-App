// src/app/api/ai-tutor/translate/route.ts
//
// Tap-to-translate for tutor replies: a single word (with its sentence, so
// "avocat" comes back as lawyer or avocado correctly) or a whole message.
//
// Does not count against the monthly message pool — a student checking what a
// word means is the tutor working, not a new turn — but it is gated to the same
// students and capped in size.

import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAIClient, getAIConfig } from "@/lib/ai/client";
import { getTutorAccess } from "@/lib/ai/tutor-access";
import { costOf } from "@/lib/ai/pricing";
import { logAiUsage } from "@/lib/ai/usage-log";

const MAX_TEXT = 700;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await getTutorAccess(supabase, user.id);
    // Same gate as the chat route: paid students while the tutor is on, and
    // admins/testers always (so it can be checked while switched off).
    if (!access?.hasAccess || (!access.tutorEnabled && !access.isPrivileged)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const body = await request.json();
    const text = String(body.text ?? "").trim().slice(0, MAX_TEXT);
    const context = String(body.context ?? "").trim().slice(0, MAX_TEXT);
    const mode = body.mode === "word" ? "word" : "message";
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const config = await getAIConfig();
    const openai = await getOpenAIClient();

    const system =
      mode === "word"
        ? `You are a bilingual dictionary for a language learner. Given a word from a sentence, return JSON: {"translation": "English meaning in this sentence (1-4 words)", "lemma": "dictionary form, with article for nouns (e.g. 'la maison'), infinitive for verbs", "note": "optional: one short grammar note, e.g. 'past participle of faire' — or empty string"}.`
        : `Translate the learner's tutor message into natural English. Return JSON: {"translation": "..."}.`;

    const user_ =
      mode === "word" ? `Word: ${text}\nSentence: ${context || text}` : text;

    const completion = await openai.chat.completions.create({
      model: config.openai.tutorModel,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user_ },
      ],
      temperature: 0.2,
      max_tokens: mode === "word" ? 80 : 300,
    });

    const model = config.openai.tutorModel;
    const tokensIn = completion.usage?.prompt_tokens ?? 0;
    const tokensOut = completion.usage?.completion_tokens ?? 0;
    after(() =>
      logAiUsage({
        userId: user.id,
        feature: "translate",
        model,
        costUsd: costOf(model, tokensIn, tokensOut),
        tokensIn,
        tokensOut,
      })
    );

    let parsed: { translation?: string; lemma?: string; note?: string } = {};
    try {
      parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    } catch {
      parsed = {};
    }

    return NextResponse.json({
      translation: String(parsed.translation ?? "").trim(),
      lemma: parsed.lemma ? String(parsed.lemma).trim() : undefined,
      note: parsed.note ? String(parsed.note).trim() : undefined,
    });
  } catch (error) {
    console.error("Tutor translate error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
