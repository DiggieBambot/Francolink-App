"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";

interface GameShellProps {
  language: string;
  /** Slug of the current theme; the header back link + end-screen "More games"
   *  go to the theme picker so the user stays in context. */
  theme?: string;
  title: string;
  /** 1-indexed for display. */
  currentRound: number;
  totalRounds: number;
  score: number;
  finished: boolean;
  onRestart: () => void;
  children: React.ReactNode;
}

/** Frame every game shares: back button, progress bar, score, and the end
 *  screen with "Play again" + "Back to games". Keeps each game file focused
 *  purely on its game logic + round UI. */
export function GameShell({
  language,
  theme,
  title,
  currentRound,
  totalRounds,
  score,
  finished,
  onRestart,
  children,
}: GameShellProps) {
  const backHref = theme ? `/learn/${language}/games/${theme}` : `/learn/${language}/games`;
  const percent = Math.round((Math.min(currentRound, totalRounds) / totalRounds) * 100);

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
        <Link
          href={backHref}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Back to games"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-gray-900">{title}</div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
          {score} / {totalRounds}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 px-4 py-6 sm:px-6">{finished ? <ResultScreen score={score} totalRounds={totalRounds} backHref={backHref} onRestart={onRestart} /> : children}</div>
    </div>
  );
}

function ResultScreen({ score, totalRounds, backHref, onRestart }: { score: number; totalRounds: number; backHref: string; onRestart: () => void }) {
  const pct = Math.round((score / totalRounds) * 100);
  const [emoji, headline, sub] = (() => {
    if (pct === 100) return ["🏆", "Perfect!", "Wow. Every single answer right."];
    if (pct >= 80) return ["🎉", "Great job!", "You're nailing this vocabulary."];
    if (pct >= 60) return ["👍", "Nice work!", "Solid — keep practising and you'll be flying."];
    if (pct >= 40) return ["💪", "Good effort!", "A few tricky ones. Run it again?"];
    return ["🌱", "Just starting!", "Practice makes progress. Give it another go."];
  })();
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-4 text-6xl">{emoji}</div>
      <h2 className="font-heading text-3xl font-bold text-primary">{headline}</h2>
      <p className="mt-2 text-gray-600">{sub}</p>
      <div className="mt-6 flex items-center justify-center gap-2 text-2xl font-bold text-amber-600">
        <Trophy className="h-6 w-6" />
        {score} / {totalRounds}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white shadow-sm hover:bg-amber-600"
        >
          <RotateCcw className="h-4 w-4" /> Play again
        </button>
        <Link
          href={backHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
        >
          More games →
        </Link>
      </div>
    </div>
  );
}

/** Briefly flash a feedback ribbon at the top of the body for ~700 ms. */
export function useTransientFeedback() {
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 700);
    return () => clearTimeout(t);
  }, [feedback]);
  return { feedback, setFeedback };
}

export function FeedbackRibbon({ kind }: { kind: "correct" | "wrong" | null }) {
  if (!kind) return null;
  return (
    <div
      className={`pointer-events-none fixed left-1/2 top-24 -translate-x-1/2 rounded-full px-5 py-2 text-base font-bold shadow-lg ${
        kind === "correct" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
      }`}
      role="status"
    >
      {kind === "correct" ? "✓ Correct" : "✗ Not quite"}
    </div>
  );
}

/** Shared "exit confirm" hook the page can mount via the header X (unused for
 *  the MVP since the header already has a back arrow; exported for future use). */
export function ExitButton({ href }: { href: string }) {
  return (
    <Link href={href} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
      <X className="h-5 w-5" />
    </Link>
  );
}
