"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Volume2 } from "lucide-react";
import { GameShell, FeedbackRibbon, useTransientFeedback } from "./game-shell";
import { useInworldTTS } from "@/hooks/use-inworld-tts";
import { useSoundEngine } from "@/hooks/use-sound-engine";

type PoolItem = { term: string; translation: string; image: string };

interface Props {
  language: string;
  theme: string;
}

const ROUND_COUNT = 10;
const OPTIONS_PER_ROUND = 4;

const LOCALE_FOR: Record<string, string> = {
  french: "fr-FR",
  spanish: "es-ES",
  german: "de-DE",
  english: "en-GB",
};

/** TTS plays the target word; learner taps the matching picture. */
export default function ListenAndFind({ language, theme }: Props) {
  const [pool, setPool] = useState<PoolItem[] | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const { feedback, setFeedback } = useTransientFeedback();
  const { play } = useSoundEngine();
  const locale = LOCALE_FOR[language.toLowerCase()] || "fr-FR";
  const { speak } = useInworldTTS({ language: locale });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
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
      <GameShell language={language} theme={theme} title="Listen & Find" currentRound={0} totalRounds={ROUND_COUNT} score={0} finished={false} onRestart={() => {}}>
        <div className="mx-auto max-w-md py-12 text-center text-gray-500">Loading words…</div>
      </GameShell>
    );
  }
  if (pool.length < OPTIONS_PER_ROUND) {
    return (
      <GameShell language={language} theme={theme} title="Listen & Find" currentRound={0} totalRounds={ROUND_COUNT} score={0} finished={false} onRestart={() => {}}>
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

  // 4 image options including the correct one, deterministically picked from
  // pool so the layout stays stable mid-round.
  const options = (() => {
    const others: PoolItem[] = [];
    const pool2 = [...distractors, ...items.filter((_, i) => i !== round)];
    while (others.length < OPTIONS_PER_ROUND - 1 && pool2.length > 0) {
      const idx = (round * 9 + others.length * 17) % pool2.length;
      const chosen = pool2.splice(idx, 1)[0];
      if (chosen && chosen.term !== current.term && !others.some((o) => o.term === chosen.term)) {
        others.push(chosen);
      }
    }
    const all = [...others, current];
    for (let i = all.length - 1; i > 0; i--) {
      const j = (round * 5 + i * 11) % (i + 1);
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
    setTimeout(() => {
      setRound((r) => r + 1);
      setPicked(null);
    }, 900);
  }

  function restart() {
    setRound(0);
    setScore(0);
    setPicked(null);
    setPool(null);
  }

  return (
    <GameShell
      language={language}
      theme={theme}
      title="Listen & Find"
      currentRound={round + 1}
      totalRounds={items.length}
      score={score}
      finished={finished}
      onRestart={restart}
    >
      <FeedbackRibbon kind={feedback} />
      <div className="mx-auto max-w-2xl">
        {/* Big speaker button — playing replays the term */}
        <div className="mb-6 flex justify-center">
          <button
            type="button"
            onClick={() => speak(current.term)}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label="Play the word"
          >
            <Volume2 className="h-12 w-12" />
          </button>
        </div>
        <h2 className="mb-6 text-center text-xl font-bold text-gray-700">Listen and tap the matching picture.</h2>

        {/* 2x2 grid of image options */}
        <div className="mx-auto grid max-w-xl gap-3 sm:grid-cols-2">
          {options.map((opt) => {
            const isPicked = picked === opt.term;
            const isCorrect = current.term === opt.term;
            const ring = !picked
              ? "ring-2 ring-transparent hover:ring-amber-300"
              : isCorrect
              ? "ring-4 ring-emerald-400"
              : isPicked
              ? "ring-4 ring-rose-300"
              : "opacity-50";
            return (
              <button
                key={opt.term}
                type="button"
                onClick={() => pick(opt.term)}
                disabled={!!picked}
                className={`relative aspect-square overflow-hidden rounded-2xl bg-gray-100 transition-all disabled:cursor-default ${ring}`}
              >
                {opt.image ? (
                  <Image src={opt.image} alt="" fill sizes="(max-width:640px) 50vw, 280px" className="object-cover" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
