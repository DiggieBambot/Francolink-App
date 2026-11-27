"use client";

// Tutor reply text where every word can be tapped for its meaning in context.
//
// Lookups go to /api/ai-tutor/translate with the whole sentence, so the answer
// is the meaning *here* ("avocat" → lawyer, not avocado). Results are cached
// for the page's lifetime: students tap the same words again and again.

import { useEffect, useRef, useState } from "react";
import { Loader2, Volume2 } from "lucide-react";

interface WordInfo {
  translation: string;
  lemma?: string;
  note?: string;
}

const cache = new Map<string, WordInfo>();

/** Strip surrounding punctuation but keep elisions like "l'homme" whole. */
function cleanWord(token: string): string {
  return token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

interface Props {
  text: string;
  /** Speak a word or phrase aloud (the tutor voice). */
  onSpeak?: (text: string) => void;
}

export function TappableText({ text, onSpeak }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const [info, setInfo] = useState<WordInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (open === null) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const tokens = text.split(/(\s+)/);

  const lookup = async (index: number, word: string) => {
    if (open === index) {
      setOpen(null);
      return;
    }
    setOpen(index);
    const key = `${word.toLowerCase()}|${text}`;
    const hit = cache.get(key);
    if (hit) {
      setInfo(hit);
      return;
    }
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-tutor/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: word, context: text, mode: "word" }),
      });
      const data = await res.json();
      if (res.ok && data.translation) {
        cache.set(key, data);
        setInfo(data);
      } else {
        setInfo({ translation: "—" });
      }
    } catch {
      setInfo({ translation: "—" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <span ref={rootRef}>
      {tokens.map((tok, i) => {
        const word = cleanWord(tok);
        if (!word || /^\s+$/.test(tok)) return <span key={i}>{tok}</span>;
        const isOpen = open === i;
        return (
          <span key={i} className="relative inline-block">
            <button
              type="button"
              onClick={() => lookup(i, word)}
              className={`rounded px-[1px] -mx-[1px] transition-colors decoration-dotted underline-offset-4 hover:bg-primary/10 hover:underline ${
                isOpen ? "bg-primary/15 underline" : ""
              }`}
            >
              {tok}
            </button>
            {isOpen && (
              <span
                role="tooltip"
                className="absolute left-0 bottom-full mb-2 z-20 w-max max-w-[16rem] rounded-xl bg-gray-900 text-white text-xs px-3 py-2 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Loader2 className="w-3 h-3 animate-spin" /> Looking up…
                  </span>
                ) : info ? (
                  <span className="flex items-start gap-2">
                    <span className="flex flex-col">
                      <span className="font-semibold">{info.translation}</span>
                      {info.lemma && info.lemma.toLowerCase() !== word.toLowerCase() && (
                        <span className="text-gray-300">{info.lemma}</span>
                      )}
                      {info.note && <span className="text-gray-400 mt-0.5">{info.note}</span>}
                    </span>
                    {onSpeak && (
                      <button
                        type="button"
                        onClick={() => onSpeak(info.lemma || word)}
                        className="p-0.5 text-gray-300 hover:text-white"
                        aria-label={`Hear ${word}`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </span>
                ) : null}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
