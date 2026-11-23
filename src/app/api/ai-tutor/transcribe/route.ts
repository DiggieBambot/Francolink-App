// src/app/api/ai-tutor/transcribe/route.ts
//
// Server-side speech-to-text for the AI tutor microphone.
//
// The tutor used the browser's Web Speech API, which does not exist in Firefox,
// is unreliable in Safari, and is poor with learner accents — exactly the
// speakers this feature is for. The page now records with MediaRecorder and
// posts the clip here.
//
// Deliberately no `language` hint: students switch to English when stuck, and
// forcing French makes the model "translate" those turns instead of
// transcribing them. The prompt tells it to expect both.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAIClient } from "@/lib/ai/client";
import { getTutorAccess } from "@/lib/ai/tutor-access";

/** ~90 s of compressed speech. The page stops recording at 60 s. */
const MAX_BYTES = 3 * 1024 * 1024;

const LANGUAGE_NAMES: Record<string, string> = {
  fr: "French",
  es: "Spanish",
  de: "German",
  en: "English",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Same gate as the chat route: no point transcribing a message the student
    // is not allowed to send.
    const access = await getTutorAccess(supabase, user.id);
    if (!access?.allowed) {
      return NextResponse.json(
        { error: access?.reason ?? "Not allowed", code: access?.code },
        { status: access?.code === "LIMIT_REACHED" ? 429 : 403 }
      );
    }

    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ error: "No audio received" }, { status: 400 });
    }
    if (audio.size > MAX_BYTES) {
      return NextResponse.json({ error: "Recording is too long" }, { status: 413 });
    }

    const lang = String(form.get("language") ?? access.learningLanguage)
      .split("-")[0]
      .toLowerCase();
    const langName = LANGUAGE_NAMES[lang] ?? "French";

    const openai = await getOpenAIClient();
    const result = await openai.audio.transcriptions.create({
      model: "gpt-4o-transcribe",
      file: audio,
      prompt: `A student learning ${langName} talking to their tutor. They speak mostly ${langName}, sometimes English. Transcribe exactly what they say, including their mistakes; do not correct grammar.`,
    });

    return NextResponse.json({ text: (result.text ?? "").trim() });
  } catch (error) {
    console.error("Tutor transcription error:", error);
    return NextResponse.json(
      { error: "Couldn't hear that. Please try again." },
      { status: 500 }
    );
  }
}
