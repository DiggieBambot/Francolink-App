"use client";

import { Square, Volume2, Loader2, AlertCircle } from "lucide-react";
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

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (tts.isSpeaking) {
      tts.stop();
    } else {
      tts.speak(text);
      room?.broadcastSpeak(text);
    }
  }

  const Icon = tts.isLoading ? Loader2 : tts.isSpeaking ? Square : tts.error ? AlertCircle : Volume2;
  const iconClass = tts.isLoading ? "animate-spin" : tts.isSpeaking ? "text-blue-600" : tts.error ? "text-red-500" : "";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={tts.isSpeaking ? `Stop: ${text}` : tts.error ? "Audio unavailable, try again" : `Play: ${text}`}
      title={tts.isSpeaking ? "Stop" : tts.error ? "Audio unavailable — try again" : "Play"}
      className={
        variant === "inline"
          ? `inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 ${className}`
          : `inline-flex items-center justify-center rounded-full ${pad} text-blue-700 hover:bg-blue-100 transition-colors ${className}`
      }
    >
      <Icon size={dim} className={iconClass} />
      {variant === "inline" ? <span>{tts.isSpeaking ? "Stop" : "Play"}</span> : null}
    </button>
  );
}
