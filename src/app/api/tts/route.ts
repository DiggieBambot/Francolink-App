// src/app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client for cache writes (user session can't write to storage)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "tts-cache";

// OpenAI voices, chosen by listening to all eight read the French sounds that
// expose an anglophone accent — the uvular r, the /y/ in "rue", the eu/oeu
// vowels, and three liaisons in a row. fable, nova and shimmer were the three
// that held up; the rest carried too much English.
const LANGUAGE_VOICES: Record<string, string> = {
  fr: "fable",
  en: "nova",
  es: "shimmer",
  de: "shimmer",
};

// A caller may ask for a specific voice (a dialogue giving its two speakers
// different ones, say). Allowlisted because the value lands in a storage path
// and in a paid API call.
const ALLOWED_VOICES = new Set([
  "alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer",
]);

// Map language codes to cache folder names
const LANGUAGE_FOLDERS: Record<string, string> = {
  fr: "french",
  en: "english",
  es: "spanish",
  de: "german",
};

function getDefaultVoice(language: string): string {
  const langCode = language.split("-")[0].toLowerCase();
  return LANGUAGE_VOICES[langCode] || LANGUAGE_VOICES.fr;
}

function getCacheFolder(language: string): string {
  const langCode = language.split("-")[0].toLowerCase();
  return LANGUAGE_FOLDERS[langCode] || langCode;
}

function asciiSlug(s: string, maxLen: number): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen);
}

function textToFilename(text: string, voice: string, speed: number): string {
  // "v2" marks the OpenAI generation. The previous provider's clips live under
  // unsuffixed keys and are a different voice entirely, so they must not be
  // served for these requests — and they cannot be regenerated either, since
  // that account is out of credits.
  return `${asciiSlug(text, 60)}_${asciiSlug(voice, 20)}_${speed}-v2.mp3`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const language = body.language || "fr";
    const text = body.text;
    const requested = typeof body.voice === "string" ? body.voice.toLowerCase() : "";
    const voice = ALLOWED_VOICES.has(requested) ? requested : getDefaultVoice(language);
    // OpenAI accepts 0.25–4.0 and actually honours it, unlike the provider this
    // replaced — see the note that used to live below about speakingRate.
    const speed = Math.min(Math.max(Number(body.speed) || 1.0, 0.25), 4.0);

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const filename = textToFilename(text, voice, speed);
    const cacheFolder = getCacheFolder(language);
    const storagePath = `${cacheFolder}/${filename}`;

    // 1. Check cache first (public bucket — admin client works fine)
    const { data: cached } = await adminSupabase.storage
      .from(BUCKET)
      .download(storagePath);

    if (cached) {
      const arrayBuffer = await cached.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return NextResponse.json({ audio: base64, format: "mp3", cached: true });
    }

    // 2. Generate via OpenAI TTS.
    //
    // Everything above this line is free: a cache hit serves an already-paid-for
    // clip, so anonymous learners keep working exactly as before. Past this
    // point every call costs money at the provider, which is why the gate sits
    // here and not at the top of the route — unauthenticated, this was a bill
    // anyone on the internet could run up in a loop.
    const { data: { user } } = await (await createUserClient()).auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to generate audio" },
        { status: 401 }
      );
    }

    // Cap the input too: cache keys are derived from the text, so unbounded
    // length means unbounded distinct (paid) generations from one account.
    if (typeof text !== "string" || text.length > 1000) {
      return NextResponse.json({ error: "text must be a string under 1000 characters" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice,
        input: text,
        speed,
        response_format: "mp3",
        // These voices are English-first and will drift towards an anglophone
        // reading without being told not to. The learner imitates this audio,
        // so the accent is the product, not a preference.
        instructions:
          "Read the text exactly as written, as a native speaker of the target language, with natural pronunciation, liaison and rhythm. Do not add or omit anything.",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI TTS error:", error);
      return NextResponse.json({ error: "TTS generation failed" }, { status: response.status });
    }

    // OpenAI returns the audio bytes directly rather than base64 in JSON.
    const audioBuffer = Buffer.from(await response.arrayBuffer());
    if (!audioBuffer.length) {
      return NextResponse.json({ error: "No audio returned" }, { status: 500 });
    }
    const audioBase64 = audioBuffer.toString("base64");

    // 3. Save to cache in background with service-role client (user session can't write to storage)
    adminSupabase.storage
      .from(BUCKET)
      .upload(storagePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: false,
      })
      .then(({ error }) => {
        if (error && error.message !== "The resource already exists") {
          console.error("TTS cache save error:", error.message);
        }
      });

    return NextResponse.json({ audio: audioBase64, format: "mp3", cached: false });
  } catch (error) {
    console.error("TTS route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
