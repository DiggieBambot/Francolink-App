// src/app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";

const FRENCH_VOICE = "Hélène"; // Female French voice
const FRENCH_VOICE_MALE = "Alain"; // Male French voice

export async function POST(request: NextRequest) {
  try {
    const { text, voice, language = "fr", speed = 1.0 } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

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
        voice_id: voice || FRENCH_VOICE,
        model_id: "inworld-tts-1",
        language: language.split("-")[0], // "fr-FR" -> "fr"
        speed: speed,
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

    return NextResponse.json({ audio: audioBase64, format: "wav" });
  } catch (error) {
    console.error("TTS route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
