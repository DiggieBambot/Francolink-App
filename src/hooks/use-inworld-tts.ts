"use client";

import { useCallback, useRef, useState } from "react";

interface UseInworldTTSOptions {
  language?: string;
  voice?: string;
  speed?: number;
}

export function useInworldTTS(options: UseInworldTTSOptions = {}) {
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
    async (text: string, overrides?: { voice?: string }): Promise<void> => {
      stop();
      const trimmed = text.trim();
      if (!trimmed) return;

      const language = options.language || "fr-FR";
      setIsLoading(true);
      setError(false);

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: trimmed,
            language,
            voice: overrides?.voice ?? options.voice,
            speed: options.speed || 1.0,
          }),
        });

        // No browser speechSynthesis fallback: we only ever want the real
        // Inworld voice, not the robotic OS voice standing in silently.
        if (!response.ok) {
          setIsLoading(false);
          setError(true);
          return;
        }

        const { audio, format } = await response.json();
        const binaryStr = atob(audio);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: format === "wav" ? "audio/wav" : "audio/mp3" });
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
          audioEl.onpause = () => {
            // Treat manual stop as end; play() resolution may not have fired yet.
            if (audioEl.currentTime === 0) finish();
          };
          audioEl.play().catch(() => {
            setError(true);
            finish();
          });
        });
      } catch {
        setIsLoading(false);
        setError(true);
      }
    },
    [options.language, options.voice, options.speed, stop]
  );

  return { speak, stop, isSpeaking, isLoading, error };
}
