"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { GameShell, FeedbackRibbon, useTransientFeedback } from "./game-shell";
import { useSoundEngine } from "@/hooks/use-sound-engine";

type PoolItem = { term: string; translation: string; image: string };

interface Props {
  language: string;
  theme: string;
}

const ROUND_COUNT = 10;
const OPTIONS_PER_ROUND = 4;

/** Picture → 4 word options. Tap the right word. */
export default function PictureQuiz({ language, theme }: Props) {
  const [pool, setPool] = useState<PoolItem[] | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const { feedback, setFeedback } = useTransientFeedback();
  const { play } = useSoundEngine();

  // Fetch pool on mount / restart.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Ask for 4× round count so we always have enough distractors.
      const res = await fetch(`/api/games/pool?lang=${language}&theme=${theme}&count=${ROUND_COUNT * OPTIONS_PER_ROUND}`);
      if (!res.ok) return;
      const { pool: data } = (await res.json()) as { pool: PoolItem[] };
      if (cancelled) return;
      setPool(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [language, theme]);

  if (!pool) {
    return (
      <GameShell language={language} theme={theme} title="Picture Quiz" currentRound={0} totalRounds={ROUND_COUNT} score={0} finished={false} onRestart={() => {}}>
        <div className="mx-auto max-w-md py-12 text-center text-gray-500">Loading words…</div>
      </GameShell>
    );
  }

  if (pool.length < OPTIONS_PER_ROUND) {
    return (
      <GameShell language={language} theme={theme} title="Picture Quiz" currentRound={0} totalRounds={ROUND_COUNT} score={0} finished={false} onRestart={() => {}}>
        <div className="mx-auto max-w-md py-12 text-center text-gray-600">
          Not enough words with pictures for this language yet. Try again soon!
        </div>
      </GameShell>
    );
  }

  const items = pool.slice(0, ROUND_COUNT);
  const distractors = pool.slice(ROUND_COUNT);
  const finished = round >= items.length;
  const current = items[Math.min(round, items.length - 1)];

  // Build per-round options once when the round changes by deriving from `round`.
  const options = (() => {
    const others: PoolItem[] = [];
    const pool2 = [...distractors, ...items.filter((_, i) => i !== round)];
    while (others.length < OPTIONS_PER_ROUND - 1 && pool2.length > 0) {
      const idx = (round * 7 + others.length * 13) % pool2.length;
      const chosen = pool2.splice(idx, 1)[0];
      if (chosen && chosen.term !== current.term && !others.some((o) => o.term === chosen.term)) {
        others.push(chosen);
      }
    }
    const all = [...others, current];
    // Deterministic shuffle based on round so it stays stable across renders.
    for (let i = all.length - 1; i > 0; i--) {
      const j = (round * 11 + i * 7) % (i + 1);
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  })();

  function pick(term: string) {
    if (picked) return;
    setPicked(term);
    const correct = term === current.term;
    if (correct) {
      setScore((s) => s + 1);
      play("correct");
      setFeedback("correct");
    } else {
      play("incorrect");
      setFeedback("wrong");
    }
    // Advance after the feedback ribbon disappears.
    setTimeout(() => {
      setRound((r) => r + 1);
      setPicked(null);
    }, 900);
  }

  function restart() {
    setRound(0);
    setScore(0);
    setPicked(null);
    setPool(null); // triggers re-fetch via useEffect dep on `language` — bump via key in parent if needed
  }

  return (
    <GameShell
      language={language}
      theme={theme}
      title="Picture Quiz"
      currentRound={round + 1}
      totalRounds={items.length}
      score={score}
      finished={finished}
      onRestart={restart}
    >
      <FeedbackRibbon kind={feedback} />
      <div className="mx-auto max-w-2xl">
        {/* The picture */}
        <div className="relative mx-auto mb-6 aspect-video w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-md">
          {current.image ? (
            <Image src={current.image} alt="" fill sizes="(max-width:640px) 100vw, 600px" className="object-cover" priority />
          ) : null}
        </div>
        <h2 className="mb-4 text-center text-xl font-bold text-gray-700">
          What is this in {language.charAt(0).toUpperCase() + language.slice(1)}?
        </h2>

        {/* Options */}
        <div className="mx-auto grid max-w-xl gap-3 sm:grid-cols-2">
          {options.map((opt) => {
            const isPicked = picked === opt.term;
            const isCorrect = current.term === opt.term;
            const color = !picked
              ? "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50"
              : isCorrect
              ? "border-emerald-400 bg-emerald-50 text-emerald-900"
              : isPicked
              ? "border-rose-300 bg-rose-50 text-rose-900"
              : "border-gray-100 bg-gray-50 text-gray-400";
            return (
              <button
                key={opt.term}
                type="button"
                onClick={() => pick(opt.term)}
                disabled={!!picked}
                className={`rounded-2xl border-2 px-4 py-4 text-center text-lg font-semibold transition-colors disabled:cursor-default ${color}`}
              >
                {opt.term}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
