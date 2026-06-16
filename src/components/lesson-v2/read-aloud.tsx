"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, Square, Loader2 } from "lucide-react";

interface ReadAloudProps {
  /** The full text to be read aloud, word by word. */
  text: string;
  lang?: string;
}

/**
 * Renders a passage of text with word-by-word highlighting while it is read
 * aloud. Primary path uses the reliable backend TTS (`/api/tts`, the same
 * engine SpeakButton uses) and animates the highlight from audio playback
 * time. Falls back to the browser Web Speech API (with onboundary highlight)
 * only when the backend request fails.
 */
export function ReadAloud({ text, lang = "fr-FR" }: ReadAloudProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Split into tokens preserving whitespace; record each word's char offset.
  const tokens = text.split(/(\s+)/);
  const wordBoundaries: number[] = [];
  {
    let charPos = 0;
    for (const tok of tokens) {
      if (!/^\s+$/.test(tok)) wordBoundaries.push(charPos);
      charPos += tok.length;
    }
  }

  const wordAtChar = useCallback(
    (charIndex: number) => {
      let idx = -1;
      for (let i = 0; i < wordBoundaries.length; i++) {
        if (wordBoundaries[i] <= charIndex) idx = i;
        else break;
      }
      return idx;
    },
    [wordBoundaries]
  );

  const cleanup = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setActiveIdx(null);
    setSpeaking(false);
    setLoading(false);
  }, [cleanup]);

  // Clean up on unmount.
  useEffect(() => () => cleanup(), [cleanup]);

  // Web Speech fallback — used only if the backend TTS call fails.
  const speakFallback = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setLoading(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang.split("-")[0];
    const voice =
      voices.find((v) => v.lang === lang) || voices.find((v) => v.lang.startsWith(langPrefix));
    if (voice) utter.voice = voice;
    utter.onstart = () => {
      setLoading(false);
      setSpeaking(true);
    };
    utter.onboundary = (e) => {
      if (e.name && e.name !== "word") return;
      setActiveIdx(wordAtChar(e.charIndex));
    };
    utter.onend = () => stop();
    utter.onerror = () => stop();
    window.speechSynthesis.speak(utter);
  }, [text, lang, wordAtChar, stop]);

  const speak = useCallback(async () => {
    stop();
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, language: lang, speed: 0.95 }),
      });
      if (!res.ok) {
        speakFallback();
        return;
      }
      const { audio, format } = await res.json();
      const binaryStr = atob(audio);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: format === "wav" ? "audio/wav" : "audio/mp3" });
      const url = URL.createObjectURL(blob);
      const audioEl = new Audio(url);
      audioRef.current = audioEl;

      // Drive the word highlight from playback progress: map elapsed fraction
      // to a character offset, then to the word at that offset.
      const tick = () => {
        const a = audioRef.current;
        if (!a || !a.duration || Number.isNaN(a.duration)) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        const frac = Math.min(1, a.currentTime / a.duration);
        setActiveIdx(wordAtChar(Math.floor(frac * trimmed.length)));
        rafRef.current = requestAnimationFrame(tick);
      };

      audioEl.onplay = () => {
        setLoading(false);
        setSpeaking(true);
        rafRef.current = requestAnimationFrame(tick);
      };
      const finish = () => {
        URL.revokeObjectURL(url);
        stop();
      };
      audioEl.onended = finish;
      audioEl.onerror = finish;
      audioEl.play().catch(() => {
        URL.revokeObjectURL(url);
        speakFallback();
      });
    } catch {
      speakFallback();
    }
  }, [text, lang, wordAtChar, stop, speakFallback]);

  // Map token index back to word index for coloring.
  let wordIdx = -1;
  const renderedTokens = tokens.map((tok, ti) => {
    const isWord = !/^\s+$/.test(tok);
    if (isWord) wordIdx++;
    const isActive = isWord && wordIdx === activeIdx;
    return (
      <span
        key={ti}
        className={
          isActive ? "rounded bg-yellow-300 px-0.5 text-slate-900 transition-colors" : undefined
        }
      >
        {tok}
      </span>
    );
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={speaking || loading ? stop : speak}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : speaking ? (
            <Square className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          {loading ? "Loading…" : speaking ? "Stop" : "Read aloud"}
        </button>
        {speaking && <span className="animate-pulse text-xs text-slate-400">Reading…</span>}
      </div>
      <p className="text-base leading-relaxed text-slate-800">{renderedTokens}</p>
    </div>
  );
}
