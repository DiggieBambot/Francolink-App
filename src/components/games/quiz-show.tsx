"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Zap, Flame } from "lucide-react";
import { GameShell, FeedbackRibbon, useTransientFeedback } from "./game-shell";
import { useSoundEngine } from "@/hooks/use-sound-engine";

type PoolItem = { term: string; translation: string; image: string };

interface Props {
  language: string;
  theme: string;
}

const ROUND_COUNT = 10;
const OPTIONS = 4;
const TIME_PER_Q = 8; // seconds

/** Game-show style: a picture + 4 word options under a countdown. Answer fast
 *  to earn more points, and keep a streak going for a multiplier. */
export default function QuizShow({ language, theme }: Props) {
  const [pool, setPool] = useState<PoolItem[] | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const { feedback, setFeedback } = useTransientFeedback();
  const { play } = useSoundEngine();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/games/pool?lang=${language}&theme=${theme}&count=${ROUND_COUNT * OPTIONS}`);
      if (!res.ok) return;
      const { pool: data } = (await res.json()) as { pool: PoolItem[] };
      if (!cancelled) setPool(data);
    })();
    return () => { cancelled = true; };
  }, [language, theme]);

  const items = pool ? pool.slice(0, ROUND_COUNT) : [];
  const distractors = pool ? pool.slice(ROUND_COUNT) : [];
  const finished = pool != null && round >= items.length;
  const current = items[Math.min(round, Math.max(0, items.length - 1))];

  // Countdown for the current question.
  useEffect(() => {
    if (!pool || finished || picked) return;
    setTimeLeft(TIME_PER_Q);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, pool, finished]);

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function next() {
    setTimeout(() => {
      setRound((r) => r + 1);
      setPicked(null);
    }, 1100);
  }

  function handleTimeout() {
    if (picked) return;
    setPicked("__timeout__");
    setStreak(0);
    play("incorrect");
    setFeedback("wrong");
    next();
  }

  function pick(term: string) {
    if (picked) return;
    stopTimer();
    setPicked(term);
    const correct = term === current.term;
    if (correct) {
      const speedBonus = timeLeft * 10; // faster = more
      const streakMult = 1 + streak * 0.25;
      const gained = Math.round((50 + speedBonus) * streakMult);
      setScore((s) => s + gained);
      setCorrectCount((c) => c + 1);
      setStreak((s) => s + 1);
      play("correct");
      setFeedback("correct");
    } else {
      setStreak(0);
      play("incorrect");
      setFeedback("wrong");
    }
    next();
  }

  if (!pool) {
    return (
      <GameShell language={language} theme={theme} title="Quiz Show" currentRound={0} totalRounds={ROUND_COUNT} score={0} finished={false} onRestart={() => {}}>
        <div className="mx-auto max-w-md py-12 text-center text-gray-500">Loading questions…</div>
      </GameShell>
    );
  }
  if (pool.length < OPTIONS) {
    return (
      <GameShell language={language} theme={theme} title="Quiz Show" currentRound={0} totalRounds={ROUND_COUNT} score={0} finished={false} onRestart={() => {}}>
        <div className="mx-auto max-w-md py-12 text-center text-gray-600">Not enough words with pictures for this theme yet.</div>
      </GameShell>
    );
  }

  // Options for this round.
  const options = (() => {
    const others: PoolItem[] = [];
    const src = [...distractors, ...items.filter((_, i) => i !== round)];
    while (others.length < OPTIONS - 1 && src.length > 0) {
      const idx = (round * 7 + others.length * 13) % src.length;
      const c = src.splice(idx, 1)[0];
      if (c && c.term !== current.term && !others.some((o) => o.term === c.term)) others.push(c);
    }
    const all = [...others, current];
    for (let i = all.length - 1; i > 0; i--) {
      const j = (round * 11 + i * 7) % (i + 1);
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  })();

  const timePct = (timeLeft / TIME_PER_Q) * 100;

  return (
    <GameShell
      language={language}
      theme={theme}
      title="Quiz Show"
      currentRound={round + 1}
      totalRounds={items.length}
      score={correctCount}
      finished={finished}
      onRestart={() => { setRound(0); setScore(0); setCorrectCount(0); setStreak(0); setPicked(null); setPool(null); void refetch(); }}
    >
      <FeedbackRibbon kind={feedback} />
      <div className="mx-auto max-w-2xl">
        {/* Points + streak bar */}
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-50 px-3 py-1 text-sm font-bold text-fuchsia-700">
            <Zap className="h-4 w-4" /> {score.toLocaleString()} pts
          </div>
          {streak >= 2 && (
            <div className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-600">
              <Flame className="h-4 w-4" /> {streak} streak ×{(1 + streak * 0.25).toFixed(2)}
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${timeLeft <= 2 ? "bg-rose-500" : "bg-fuchsia-500"}`}
            style={{ width: `${timePct}%` }}
          />
        </div>

        {/* Picture */}
        <div className="relative mx-auto mb-6 aspect-video w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-md">
          {current.image ? <Image src={current.image} alt="" fill sizes="(max-width:640px) 100vw, 600px" className="object-cover" priority unoptimized /> : null}
        </div>
        <h2 className="mb-4 text-center text-lg font-bold text-gray-700">Which word matches the picture?</h2>

        <div className="mx-auto grid max-w-xl gap-3 sm:grid-cols-2">
          {options.map((opt) => {
            const isPicked = picked === opt.term;
            const isCorrect = current.term === opt.term;
            const cls = !picked
              ? "border-gray-200 bg-white hover:border-fuchsia-300 hover:bg-fuchsia-50"
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
                className={`rounded-2xl border-2 px-4 py-4 text-center text-lg font-semibold transition-colors disabled:cursor-default ${cls}`}
              >
                {opt.term}
              </button>
            );
          })}
        </div>
      </div>
    </GameShell>
  );

  async function refetch() {
    const res = await fetch(`/api/games/pool?lang=${language}&theme=${theme}&count=${ROUND_COUNT * OPTIONS}`);
    const { pool: data } = (await res.json()) as { pool: PoolItem[] };
    setPool(data);
  }
}
