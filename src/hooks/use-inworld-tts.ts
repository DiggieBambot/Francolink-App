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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    fallbackUtteranceRef.current = null;
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      stop();
      const trimmed = text.trim();
      if (!trimmed) return;

      const language = options.language || "fr-FR";
      setIsLoading(true);

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: trimmed,
            language,
            voice: options.voice,
            speed: options.speed || 1.0,
          }),
        });

        if (!response.ok) {
          setIsLoading(false);
          await playFallback(trimmed, language, fallbackUtteranceRef, setIsSpeaking);
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
          audioEl.onerror = finish;
          audioEl.onpause = () => {
            // Treat manual stop as end; play() resolution may not have fired yet.
            if (audioEl.currentTime === 0) finish();
          };
          audioEl.play().catch(finish);
        });
      } catch {
        setIsLoading(false);
        await playFallback(trimmed, language, fallbackUtteranceRef, setIsSpeaking);
      }
    },
    [options.language, options.voice, options.speed, stop]
  );

  return { speak, stop, isSpeaking, isLoading };
}

function playFallback(
  text: string,
  lang: string,
  utteranceRef: { current: SpeechSynthesisUtterance | null },
  setIsSpeaking: (v: boolean) => void
): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve();
  return new Promise<void>((resolve) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
    if (voice) utterance.voice = voice;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setIsSpeaking(false);
      utteranceRef.current = null;
      resolve();
    };
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = finish;
    utterance.onerror = finish;
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  });
}
