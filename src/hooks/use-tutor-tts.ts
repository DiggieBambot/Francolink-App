"use client";

// Speech playback for AI tutor replies.
//
// Mirrors the shape of use-inworld-tts so the chat page can swap between them,
// but talks to /api/tts/tutor: no Supabase cache lookup (tutor replies are
// unique, so it can only ever miss) and the voice is picked from the student's
// learning language while the rate follows their CEFR level.

import { useCallback, useRef, useState } from "react";

interface UseTutorTTSOptions {
  /** Learning language code, e.g. "fr". */
  language?: string;
  /** CEFR level, used to pick the speaking rate. */
  level?: string;
}

export function useTutorTTS(options: UseTutorTTSOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      stop();
      const trimmed = text.trim();
      if (!trimmed) return;

      setIsLoading(true);
      setError(false);

      try {
        const response = await fetch("/api/tts/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: trimmed,
            language: options.language || "fr",
            level: options.level || "A1",
          }),
        });

        // Stay silent rather than falling back to the OS voice — a robotic
        // English reader mangling French is worse than no audio.
        if (!response.ok) {
          setIsLoading(false);
          setError(true);
          return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audioEl = new Audio(url);
        audioRef.current = audioEl;

        await new Promise<void>((resolve) => {
          let finished = false;
          const finish = () => {
            if (finished) return;
            finished = true;
            URL.revokeObjectURL(url);
            if (audioRef.current === audioEl) audioRef.current = null;
            setIsSpeaking(false);
            resolve();
          };
          audioEl.onplay = () => {
            setIsLoading(false);
            setIsSpeaking(true);
          };
          audioEl.onended = finish;
          audioEl.onerror = () => {
            setError(true);
            finish();
          };
          audioEl.play().catch(() => {
            // Autoplay refused (typically before the first user gesture).
            setError(true);
            finish();
          });
        });
      } catch {
        setIsLoading(false);
        setError(true);
      }
    },
    [options.language, options.level, stop]
  );

  return { speak, stop, isSpeaking, isLoading, error };
}
