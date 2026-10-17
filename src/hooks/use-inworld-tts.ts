"use client";

import { useCallback, useRef, useState } from "react";

interface UseInworldTTSOptions {
  language?: string;
  voice?: string;
  speed?: number;
}

// One sample of silence. Played on the element inside the tap so the browser
// treats it as user-started; see `speak`.
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQIAAAAAAA==";

export function useInworldTTS(options: UseInworldTTSOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  // One element per hook, reused across plays so it stays unlocked.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Bumped by every speak/stop, so a fetch that finishes after the learner has
  // moved on (or tapped again) doesn't start playing over the top.
  const requestRef = useRef(0);

  const stop = useCallback(() => {
    requestRef.current++;
    const el = audioRef.current;
    if (el) {
      el.onplay = el.onended = el.onerror = el.onpause = null;
      el.pause();
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  /** Resolves true once the clip has played through, false if it couldn't be
   *  fetched or played (or was stopped). */
  const speak = useCallback(
    async (text: string, overrides?: { voice?: string }): Promise<boolean> => {
      stop();
      const trimmed = text.trim();
      if (!trimmed) return false;
      const requestId = requestRef.current;

      // Safari (and Chrome without prior interaction) only lets play() start
      // sound inside the user's tap. The real clip arrives after a network
      // round trip, outside that tap, so it was being blocked silently. Starting
      // playback on this element now, synchronously, unlocks it for the clip.
      if (!audioRef.current && typeof Audio !== "undefined") audioRef.current = new Audio();
      const audioEl = audioRef.current;
      if (audioEl) {
        audioEl.src = SILENT_WAV;
        audioEl.play().catch(() => {});
      }

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
          console.error("TTS request failed:", response.status, await response.text().catch(() => ""));
          if (requestRef.current === requestId) {
            setIsLoading(false);
            setError(true);
          }
          return false;
        }

        const { audio, format } = await response.json();
        if (requestRef.current !== requestId || !audioEl) return false;

        const binaryStr = atob(audio);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: format === "wav" ? "audio/wav" : "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        audioEl.pause();
        audioEl.src = url;

        return await new Promise<boolean>((resolve) => {
          let finished = false;
          const finish = (ok: boolean) => {
            if (finished) return;
            finished = true;
            audioEl.onplay = audioEl.onended = audioEl.onerror = audioEl.onpause = null;
            URL.revokeObjectURL(url);
            if (requestRef.current === requestId) {
              setIsSpeaking(false);
              setIsLoading(false);
              if (!ok) setError(true);
            }
            resolve(ok);
          };
          audioEl.onplay = () => {
            setIsLoading(false);
            setIsSpeaking(true);
          };
          audioEl.onended = () => finish(true);
          audioEl.onerror = () => finish(false);
          // A pause before the end is a stop (stop() also clears these handlers).
          audioEl.onpause = () => {
            if (!audioEl.ended) finish(false);
          };
          audioEl.play().catch((e) => {
            console.error("TTS playback blocked:", e);
            finish(false);
          });
        });
      } catch (e) {
        console.error("TTS error:", e);
        if (requestRef.current === requestId) {
          setIsLoading(false);
          setError(true);
        }
        return false;
      }
    },
    [options.language, options.voice, options.speed, stop]
  );

  return { speak, stop, isSpeaking, isLoading, error };
}
