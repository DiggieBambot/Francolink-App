"use client";

import { Volume2, Loader2 } from "lucide-react";
import { useInworldTTS } from "@/hooks/use-inworld-tts";
import { useLessonRoom } from "./lesson-room-context";
import { useLessonTTSLocale } from "./lesson-language-context";

interface SpeakButtonProps {
  text: string;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "inline";
  className?: string;
  voice?: string;
}

export function SpeakButton({ text, size = "md", variant = "icon", className = "", voice }: SpeakButtonProps) {
  const ttsLocale = useLessonTTSLocale();
  const tts = useInworldTTS({ language: ttsLocale, voice });
  const room = useLessonRoom();

  const dim = size === "sm" ? 14 : size === "lg" ? 20 : 16;
  const pad = size === "sm" ? "p-1" : size === "lg" ? "p-2" : "p-1.5";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        tts.speak(text);
        room?.broadcastSpeak(text);
      }}
      aria-label={`Play: ${text}`}
      className={
        variant === "inline"
          ? `inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 ${className}`
          : `inline-flex items-center justify-center rounded-full ${pad} text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 ${className}`
      }
      disabled={tts.isLoading}
    >
      {tts.isLoading ? (
        <Loader2 size={dim} className="animate-spin" />
      ) : (
        <Volume2 size={dim} className={tts.isSpeaking ? "text-blue-600" : ""} />
      )}
      {variant === "inline" ? <span>Play</span> : null}
    </button>
  );
}
