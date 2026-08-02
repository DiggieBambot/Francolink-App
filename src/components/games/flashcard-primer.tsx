// src/components/games/flashcard-primer.tsx
"use client";
//
// The warm-up before play. After picking a theme, a child flips through that
// theme's words as flashcards (with pronunciation), then taps "Play games" or
// "Skip" to reach the game picker. Reuses the lesson <Flashcard> so the look
// and the Inworld voice are identical to a real lesson — no new card or TTS
// infrastructure.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Gamepad2, Volume2, Sparkles } from "lucide-react";
import Flashcard from "@/components/learning/flashcard";
import { themeBySlug } from "@/lib/games/themes";
import { useInworldTTS } from "@/hooks/use-inworld-tts";
import { useSoundEngine } from "@/hooks/use-sound-engine";
import { useConfettiBurst } from "@/components/games/use-confetti";

type PoolItem = { term: string; translation: string; image: string };

// language route slug → BCP-47 locale for TTS. Duplicated from listen-find.tsx
// / lesson-flow.tsx; not worth a shared util for three lines.
const LOCALE: Record<string, string> = {
  french: "fr-FR",
  spanish: "es-ES",
  german: "de-DE",
  english: "en-GB",
};

interface Props {
  language: string;
  theme: string;
}

const COUNT = 12;

export default function FlashcardPrimer({ language, theme: themeSlug }: Props) {
  const theme = themeBySlug(themeSlug);
  const router = useRouter();
  const locale = LOCALE[language] || "fr-FR";
  const { speak } = useInworldTTS({ language: locale });
  const { play } = useSoundEngine();
  const { fire: fireConfetti, overlay } = useConfettiBurst();

  const [pool, setPool] = useState<PoolItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const spokenFor = useRef<Set<number>>(new Set());
  const celebrated = useRef(false);

  // Fetch the theme's vocab on mount (same pattern as the other games).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/games/pool?lang=${language}&theme=${themeSlug}&count=${COUNT}`);
        const { pool: data } = (await res.json()) as { pool: PoolItem[] };
        if (!cancelled) setPool(data || []);
      } catch {
        if (!cancelled) setPool([]);
      }
    })();
    return () => { cancelled = true; };
  }, [language, themeSlug]);

  const items = pool || [];
  const total = items.length;
  const current = items[index];

  // Auto-pronounce each new card once (kid can tap Listen again to repeat).
  useEffect(() => {
    if (!current || spokenFor.current.has(index)) return;
    spokenFor.current.add(index);
    const t = setTimeout(() => speak(current.term), 250);
    return () => clearTimeout(t);
  }, [current, index, speak]);

  // Celebrate reaching the last card exactly once.
  useEffect(() => {
    if (!current || total === 0) return;
    if (index !== total - 1) return;
    if (celebrated.current) return;
    celebrated.current = true;
    play("complete");
    fireConfetti();
  }, [index, total, current, play, fireConfetti]);

  const goPrev = () => {
    if (index > 0) { play("tap"); setIndex(index - 1); }
  };
  const goNext = () => {
    if (index < total - 1) { play("tap"); setIndex(index + 1); }
  };
  const gamesHref = `/learn/${language}/games/${themeSlug}`;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (pool === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-bounce-slow text-5xl">{theme?.emoji ?? "✨"}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-10">
      {overlay}

      {/* Back to themes */}
      <Link
        href={`/learn/${language}/games`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> All themes
      </Link>

      {/* Friendly theme header (carries the theme's gradient + emoji) */}
      <header className={`mt-3 overflow-hidden rounded-3xl bg-gradient-to-br ${theme?.gradient ?? "from-amber-400 to-orange-500"} p-6 text-center text-white shadow-lg`}>
        <div className="text-5xl">{theme?.emoji ?? "✨"}</div>
        <h1 className="mt-2 font-heading text-2xl font-extrabold">Let&apos;s learn {theme?.label ?? "words"}!</h1>
        <p className="mt-1 text-sm text-white/90">
          Tap <Volume2 className="inline h-4 w-4" /> to hear it. Tap the card to flip.
        </p>
      </header>

      {/* Empty pool — fail soft, kid can still reach the games */}
      {total === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <div className="text-4xl">🧩</div>
          <p className="mt-2 font-semibold text-gray-700">No words are ready for this theme yet.</p>
          <Link
            href={gamesHref}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-amber-600"
          >
            <Gamepad2 className="h-5 w-5" /> Go to games
          </Link>
        </div>
      ) : (
        <>
          {/* Progress dots */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to word ${i + 1}`}
                onClick={() => { play("tap"); setIndex(i); }}
                className={`h-2.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-amber-500" : i < index ? "w-2.5 bg-amber-300" : "w-2.5 bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* The card */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <ChevronButton dir="prev" disabled={index === 0} onClick={goPrev} />
            <div className="w-full max-w-xs">
              {current && (
                <div key={index} className="animate-scale-in">
                  <Flashcard
                    term={current.term}
                    translation={current.translation}
                    image={current.image}
                    language={locale}
                    level="A1"
                  />
                </div>
              )}
            </div>
            <ChevronButton dir="next" disabled={index === total - 1} onClick={goNext} />
          </div>

          <div className="mt-3 text-center text-sm font-medium text-gray-500">
            Card {index + 1} of {total}
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link
              href={gamesHref}
              onClick={() => play("tap")}
              className={`group inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 font-heading text-lg font-bold text-white shadow-lg transition hover:shadow-xl hover:brightness-105 ${
                index === total - 1 ? "animate-bounce-light" : ""
              }`}
            >
              <Gamepad2 className="h-6 w-6 transition-transform group-hover:scale-110" />
              Play games
            </Link>
            <button
              type="button"
              onClick={() => { play("tap"); router.push(gamesHref); }}
              className="text-sm font-semibold text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
            >
              Skip to games
            </button>
          </div>

          {/* Final-card nudge */}
          {index === total - 1 && (
            <div className="mt-5 flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-600">
              <Sparkles className="h-4 w-4" /> You&apos;ve seen them all — go play!
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ChevronButton({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous word" : "Next word"}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-amber-600 shadow-md ring-1 ring-gray-100 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Icon className="h-7 w-7" />
    </button>
  );
}
