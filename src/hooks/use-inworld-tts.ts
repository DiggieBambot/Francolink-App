"use client";

import { useState, useRef, useCallback } from "react";

interface UseInworldTTSOptions {
  language?: string;
  voice?: string;
  speed?: number;
}

export function useInworldTTS(options: UseInworldTTSOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const speak = useCallback(async (text: string) => {
    stop();
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language: options.language || "fr-FR",
          voice: options.voice,
          speed: options.speed || 1.0,
        }),
      });

      if (!response.ok) {
        fallbackTTS(text, options.language || "fr-FR");
        setIsLoading(false);
        return;
      }

      const { audio, format } = await response.json();
      const binaryStr = atob(audio);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: format === "wav" ? "audio/wav" : "audio/mp3" });
      const url = URL.createObjectURL(blob);
      const audioEl = new Audio(url);
      audioRef.current = audioEl;
      audioEl.onplay = () => { setIsLoading(false); setIsSpeaking(true); };
      audioEl.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audioEl.onerror = () => { setIsSpeaking(false); setIsLoading(false); URL.revokeObjectURL(url); };
      await audioEl.play();
    } catch {
      setIsLoading(false);
      setIsSpeaking(false);
      fallbackTTS(text, options.language || "fr-FR");
    }
  }, [options.language, options.voice, options.speed, stop]);

  return { speak, stop, isSpeaking, isLoading };
}

function fallbackTTS(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith(lang.split("-")[0]));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}
