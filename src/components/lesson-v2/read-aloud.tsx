"use client";

import { useState, useRef, useCallback } from "react";
import { Volume2, Square, Loader2 } from "lucide-react";

interface ReadAloudProps {
  /** The full text to be read aloud, word by word. */
  text: string;
  lang?: string;
}

/**
 * Renders a passage of text with word-by-word highlighting as the browser
 * reads it aloud via the Web Speech API (SpeechSynthesis). Falls back to
 * plain text when speech synthesis is unavailable.
 *
 * Used by reading_comprehension sections where passage length makes the
 * plain SpeakButton insufficient.
 */
export function ReadAloud({ text, lang = "fr-FR" }: ReadAloudProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Split into tokens preserving punctuation attached to words
  const tokens = text.split(/(\s+)/);
  // Word tokens only (odd indices are spaces)
  const wordBoundaries: number[] = [];
  let charPos = 0;
  for (const tok of tokens) {
    if (!/^\s+$/.test(tok)) wordBoundaries.push(charPos);
    charPos += tok.length;
  }

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    utterRef.current = null;
    setActiveIdx(null);
    setSpeaking(false);
    setLoading(false);
  }, []);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    stop();
    setLoading(true);

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.85;

    // Pick the best matching voice
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang.split("-")[0];
    const voice =
      voices.find((v) => v.lang === lang) ||
      voices.find((v) => v.lang.startsWith(langPrefix));
    if (voice) utter.voice = voice;

    utter.onstart = () => {
      setLoading(false);
      setSpeaking(true);
    };

    utter.onboundary = (e) => {
      if (e.name !== "word") return;
      // Find which word token index this charIndex corresponds to
      const idx = wordBoundaries.findLastIndex((pos) => pos <= e.charIndex);
      setActiveIdx(idx >= 0 ? idx : null);
    };

    utter.onend = () => {
      setActiveIdx(null);
      setSpeaking(false);
      utterRef.current = null;
    };
    utter.onerror = () => {
      setActiveIdx(null);
      setSpeaking(false);
      setLoading(false);
      utterRef.current = null;
    };

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [text, lang, stop, wordBoundaries]);

  if (typeof window !== "undefined" && !("speechSynthesis" in window)) {
    return <p className="text-slate-800 leading-relaxed">{text}</p>;
  }

  // Map token index back to word index for coloring
  let wordIdx = -1;
  const renderedTokens = tokens.map((tok, ti) => {
    const isWord = !/^\s+$/.test(tok);
    if (isWord) wordIdx++;
    const wi = wordIdx;
    const isActive = isWord && wi === activeIdx;
    return (
      <span
        key={ti}
        className={isActive ? "bg-yellow-300 text-slate-900 rounded px-0.5 transition-colors" : undefined}
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
          onClick={speaking ? stop : speak}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : speaking ? (
            <Square className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          {speaking ? "Stop" : "Read aloud"}
        </button>
        {speaking && (
          <span className="text-xs text-slate-400 animate-pulse">Reading…</span>
        )}
      </div>
      <p className="text-slate-800 leading-relaxed text-base">{renderedTokens}</p>
    </div>
  );
}
