"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { GameShell, FeedbackRibbon, useTransientFeedback } from "./game-shell";
import { useSoundEngine } from "@/hooks/use-sound-engine";

type PoolItem = { term: string; translation: string; image: string };
type Card = { id: number; pairKey: string; kind: "term" | "image"; term: string; image: string };

interface Props {
  language: string;
  theme: string;
}

const PAIR_COUNT = 6; // 12 cards on the board (6 pairs)

/** 12 cards face-down. Flip two at a time. Match the word-card with the
 *  picture-card of the same vocab item. */
export default function MemoryMatch({ language, theme }: Props) {
  const [pool, setPool] = useState<PoolItem[] | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [finished, setFinished] = useState(false);
  const { feedback, setFeedback } = useTransientFeedback();
  const { play } = useSoundEngine();

  // Fetch pool on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/games/pool?lang=${language}&theme=${theme}&count=${PAIR_COUNT * 2}`);
      if (!res.ok) return;
      const { pool: data } = (await res.json()) as { pool: PoolItem[] };
      if (cancelled) return;
      setPool(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [language, theme]);

  // Build the card array once we have the pool.
  useEffect(() => {
    if (!pool) return;
    const picks = pool.slice(0, PAIR_COUNT);
    const arr: Card[] = [];
    picks.forEach((p, idx) => {
      arr.push({ id: idx * 2, pairKey: p.term, kind: "term", term: p.term, image: p.image });
      arr.push({ id: idx * 2 + 1, pairKey: p.term, kind: "image", term: p.term, image: p.image });
    });
    // Shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setCards(arr);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setFinished(false);
  }, [pool]);

  const allMatched = useMemo(() => cards.length > 0 && matched.size === cards.length, [cards.length, matched.size]);
  useEffect(() => {
    if (allMatched && !finished) setFinished(true);
  }, [allMatched, finished]);

  function onFlip(id: number) {
    if (flipped.length >= 2) return;
    if (flipped.includes(id) || matched.has(id)) return;
    const next = [...flipped, id];
    setFlipped(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      const ca = cards.find((c) => c.id === a);
      const cb = cards.find((c) => c.id === b);
      if (ca && cb && ca.pairKey === cb.pairKey && ca.kind !== cb.kind) {
        play("correct");
        setFeedback("correct");
        setTimeout(() => {
          setMatched((m) => new Set([...m, a, b]));
          setFlipped([]);
        }, 600);
      } else {
        play("incorrect");
        setFeedback("wrong");
        setTimeout(() => setFlipped([]), 900);
      }
    }
  }

  function restart() {
    setPool(null);
    void (async () => {
      const res = await fetch(`/api/games/pool?lang=${language}&theme=${theme}&count=${PAIR_COUNT * 2}`);
      const { pool: data } = (await res.json()) as { pool: PoolItem[] };
      setPool(data);
    })();
  }

  const pairsFound = matched.size / 2;
  const totalPairs = PAIR_COUNT;

  if (!pool || cards.length === 0) {
    return (
      <GameShell language={language} theme={theme} title="Memory Match" currentRound={0} totalRounds={totalPairs} score={0} finished={false} onRestart={restart}>
        <div className="mx-auto max-w-md py-12 text-center text-gray-500">Loading words…</div>
      </GameShell>
    );
  }

  return (
    <GameShell
      language={language}
      theme={theme}
      title="Memory Match"
      currentRound={pairsFound + 1}
      totalRounds={totalPairs}
      score={pairsFound}
      finished={finished}
      onRestart={restart}
    >
      <FeedbackRibbon kind={feedback} />
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 text-center text-sm text-gray-500">Moves: {moves}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
          {cards.map((c) => {
            const isFlipped = flipped.includes(c.id) || matched.has(c.id);
            const isMatched = matched.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onFlip(c.id)}
                disabled={isFlipped || flipped.length >= 2}
                className={`relative aspect-square overflow-hidden rounded-2xl transition-all ${
                  isMatched
                    ? "ring-4 ring-emerald-400"
                    : isFlipped
                    ? "ring-2 ring-amber-400 shadow-md"
                    : "bg-gradient-to-br from-amber-400 to-orange-500 shadow hover:-translate-y-0.5 hover:shadow-lg"
                } ${isFlipped ? "bg-white" : ""}`}
                aria-label={isFlipped ? c.term : "Face-down card"}
              >
                {isFlipped ? (
                  c.kind === "image" ? (
                    c.image ? (
                      <Image src={c.image} alt="" fill sizes="(max-width:640px) 33vw, 220px" className="object-cover" />
                    ) : null
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center font-bold text-slate-900">{c.term}</div>
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl font-extrabold text-white/90">?</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );
}
