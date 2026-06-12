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

// Map language codes to appropriate native TTS voices (Inworld TTS)
const LANGUAGE_VOICES: Record<string, string> = {
  fr: "Hélène",
  en: "Olivia",
  es: "Sofia",
  de: "Julia",
};

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
  return `${asciiSlug(text, 60)}_${asciiSlug(voice, 20)}_${speed}.wav`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const language = body.language || "fr";
    const text = body.text;
    const voice = body.voice || getDefaultVoice(language);
    const speed = body.speed || 1.0;

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
      return NextResponse.json({ audio: base64, format: "wav", cached: true });
    }

    // 2. Generate via Inworld TTS
    const apiKey = process.env.INWORLD_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
    }

    const response = await fetch("https://api.inworld.ai/tts/v1/voice", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice_id: voice,
        model_id: "inworld-tts-1",
        language: language.split("-")[0],
        speed,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Inworld TTS error:", error);
      return NextResponse.json({ error: "TTS generation failed" }, { status: response.status });
    }

    const data = await response.json();
    const audioBase64 = data.audioContent;

    if (!audioBase64) {
      return NextResponse.json({ error: "No audio returned" }, { status: 500 });
    }

    // 3. Save to cache in background with service-role client (user session can't write to storage)
    const audioBuffer = Buffer.from(audioBase64, "base64");
    adminSupabase.storage
      .from(BUCKET)
      .upload(storagePath, audioBuffer, {
        contentType: "audio/wav",
        upsert: false,
      })
      .then(({ error }) => {
        if (error && error.message !== "The resource already exists") {
          console.error("TTS cache save error:", error.message);
        }
      });

    return NextResponse.json({ audio: audioBase64, format: "wav", cached: false });
  } catch (error) {
    console.error("TTS route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
