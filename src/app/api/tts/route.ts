// src/app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FRENCH_VOICE = "Hélène";
const BUCKET = "tts-cache";

function textToFilename(text: string, voice: string, speed: number): string {
  const clean = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${clean}_${voice}_${speed}.wav`;
}

export async function POST(request: NextRequest) {
  try {
    const { text, voice = FRENCH_VOICE, language = "fr", speed = 1.0 } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const filename = textToFilename(text, voice, speed);
    const storagePath = `french/${filename}`;

    // 1. Check cache first
    const { data: cached } = await supabase.storage
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

    // 3. Save to cache in background (don't await — return fast)
    const audioBuffer = Buffer.from(audioBase64, "base64");
    supabase.storage
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
