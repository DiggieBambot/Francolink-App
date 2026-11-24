// src/app/api/tts/tutor/route.ts
//
// Speech for AI tutor replies, deliberately separate from /api/tts.
//
// /api/tts exists to serve *lesson* audio, and its Supabase Storage cache is
// why it is worth the round-trip: many students hear the same vocabulary item,
// so the second listener onwards is free. Tutor replies are unique by
// construction — the cache would miss every single time, pay for the lookup,
// and then fill the bucket with one-hit objects that are never read again.
//
// So: no cache, one upstream call, streamed straight back to the browser.

import { NextRequest, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOpenAIClient, getAIConfig } from "@/lib/ai/client";
import { ttsCost } from "@/lib/ai/pricing";
import { logAiUsage } from "@/lib/ai/usage-log";

/** Voice per learning language. Kept close to the Inworld defaults in tone. */
const LANGUAGE_VOICES: Record<string, string> = {
  fr: "shimmer",
  en: "nova",
  es: "nova",
  de: "shimmer",
};

/**
 * Speaking rate by CEFR level. A beginner needs the tutor to slow down; a C1
 * student being read to at 0.8x is being patronised.
 */
const LEVEL_SPEED: Record<string, number> = {
  A1: 0.8,
  A2: 0.85,
  B1: 0.95,
  B2: 1.0,
  C1: 1.05,
  C2: 1.05,
};

/**
 * Every sentence is a separate request, and gpt-4o-mini-tts is expressive
 * enough that each one can come back at a different volume ("Mm-hm…" nearly
 * whispered, the next sentence projected). Asking for one steady delivery
 * keeps the clips close; the browser normalises what difference is left.
 * Costs a few input tokens per call, i.e. nothing.
 */
const DELIVERY =
  "A warm, clear teacher speaking to one student. Keep the same steady, even volume and the same distance from the microphone from start to finish: no whispering, no shouting, no fading out. Start speaking right away.";

/** Hard cap so a runaway reply cannot run up an unbounded synthesis bill. */
const MAX_CHARS = 1000;

export async function POST(request: NextRequest) {
  try {
    // Tutor speech is a paid feature; require a session even though the quota
    // itself is enforced on the chat route.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const text = String(body.text ?? "").trim().slice(0, MAX_CHARS);
    const language = String(body.language ?? "fr").split("-")[0].toLowerCase();
    const level = String(body.level ?? "A1").toUpperCase();
    // "Slow replay": the student asked to hear it again, slower.
    const slow = body.slow === true;

    if (!text) {
      return Response.json({ error: "text is required" }, { status: 400 });
    }

    const config = await getAIConfig();
    const openai = await getOpenAIClient();

    const speed = (LEVEL_SPEED[level] ?? 1.0) * (slow ? 0.72 : 1);
    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: (LANGUAGE_VOICES[language] || config.openai.ttsVoice) as
        | "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text,
      instructions: DELIVERY,
      speed,
      response_format: "mp3",
    });

    // The speech API reports no usage, so the cost is estimated from the text.
    const { costUsd, seconds } = ttsCost(text.length, speed);
    after(() =>
      logAiUsage({
        userId: user.id,
        feature: "tts",
        model: "gpt-4o-mini-tts",
        costUsd,
        tokensIn: Math.ceil(text.length / 4),
        audioSeconds: seconds,
      })
    );

    // Hand the upstream stream straight to the browser rather than buffering it
    // here — the server should not be the thing that adds latency.
    return new Response(speech.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Tutor TTS error:", error);
    return Response.json({ error: "Speech generation failed" }, { status: 500 });
  }
}
