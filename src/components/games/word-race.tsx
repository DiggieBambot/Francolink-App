"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Rocket, Bot, Flag, RotateCcw } from "lucide-react";
import { GameShell, FeedbackRibbon, useTransientFeedback } from "./game-shell";
import { useSoundEngine } from "@/hooks/use-sound-engine";
import Link from "next/link";

type PoolItem = { term: string; translation: string; image: string };

interface Props {
  language: string;
  theme: string;
}

const OPTIONS = 4;
const TIME_PER_Q = 6;
const FINISH = 100;       // player must reach this
const PLAYER_STEP = 14;   // advance on correct
const ROBOT_STEP_SLOW = 6;  // robot creeps on correct
const ROBOT_STEP_FAST = 16; // robot sprints on wrong/timeout
const HEAD_START = 22;      // player starts ahead of the robot

/** Chase game: answer correctly & quickly to sprint your rocket forward and
 *  stay ahead of the robot. Reach the flag to win; get caught and it's over. */
export default function WordRace({ language, theme }: Props) {
  const [pool, setPool] = useState<PoolItem[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [player, setPlayer] = useState(HEAD_START);
  const [robot, setRobot] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [result, setResult] = useState<null | "win" | "caught">(null);
  const { feedback, setFeedback } = useTransientFeedback();
  const { play } = useSoundEngine();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/games/pool?lang=${language}&theme=${theme}&count=30`);
      if (!res.ok) return;
      const { pool: data } = (await res.json()) as { pool: PoolItem[] };
      if (!cancelled) setPool(data);
    })();
    return () => { cancelled = true; };
  }, [language, theme]);

  const current = pool && pool.length ? pool[idx % pool.length] : null;

  useEffect(() => {
    if (!pool || result || picked || !current) return;
    setTimeLeft(TIME_PER_Q);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); onWrong(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, pool, result]);

  function stopTimer() { if (timerRef.current) clearInterval(timerRef.current); }

  function advance() {
    setTimeout(() => { setIdx((i) => i + 1); setPicked(null); }, 850);
  }

  function checkEnd(nextPlayer: number, nextRobot: number) {
    if (nextRobot >= nextPlayer) { setResult("caught"); play("incorrect"); return true; }
    if (nextPlayer >= FINISH) { setResult("win"); play("complete"); return true; }
    return false;
  }

  function onCorrect() {
    stopTimer();
    setPicked(current!.term);
    play("correct");
    setFeedback("correct");
    const np = Math.min(FINISH, player + PLAYER_STEP);
    const nr = robot + ROBOT_STEP_SLOW;
    setPlayer(np);
    setRobot(nr);
    if (!checkEnd(np, nr)) advance();
  }

  function onWrong(timeout = false) {
    if (picked) return;
    stopTimer();
    setPicked(timeout ? "__timeout__" : "__wrong__");
    play("incorrect");
    setFeedback("wrong");
    const nr = robot + ROBOT_STEP_FAST;
    setRobot(nr);
    if (!checkEnd(player, nr)) advance();
  }

  function pick(term: string) {
    if (picked || !current) return;
    if (term === current.term) onCorrect();
    else {
      setPicked(term);
      onWrong(false);
    }
  }

  function restart() {
    setIdx(0); setPlayer(HEAD_START); setRobot(0); setPicked(null); setResult(null);
    setPool(null);
    void (async () => {
      const res = await fetch(`/api/games/pool?lang=${language}&theme=${theme}&count=30`);
      const { pool: data } = (await res.json()) as { pool: PoolItem[] };
      setPool(data);
    })();
  }

  if (!pool || !current) {
    return (
      <GameShell language={language} theme={theme} title="Word Race" currentRound={0} totalRounds={1} score={0} finished={false} onRestart={() => {}}>
        <div className="mx-auto max-w-md py-12 text-center text-gray-500">Loading race…</div>
      </GameShell>
    );
  }
  if (pool.length < OPTIONS) {
    return (
      <GameShell language={language} theme={theme} title="Word Race" currentRound={0} totalRounds={1} score={0} finished={false} onRestart={() => {}}>
        <div className="mx-auto max-w-md py-12 text-center text-gray-600">Not enough words with pictures for this theme yet.</div>
      </GameShell>
    );
  }

  const options = (() => {
    const others: PoolItem[] = [];
    const src = pool.filter((p) => p.term !== current.term);
    while (others.length < OPTIONS - 1 && src.length > 0) {
      const j = (idx * 5 + others.length * 13) % src.length;
      const c = src.splice(j, 1)[0];
      if (c && !others.some((o) => o.term === c.term)) others.push(c);
    }
    const all = [...others, current];
    for (let i = all.length - 1; i > 0; i--) {
      const j = (idx * 11 + i * 7) % (i + 1);
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  })();

  const gap = Math.max(0, player - robot);

  return (
    <GameShell
      language={language}
      theme={theme}
      title="Word Race"
      currentRound={Math.round(player)}
      totalRounds={FINISH}
      score={Math.round(player)}
      finished={false}
      onRestart={restart}
    >
      <FeedbackRibbon kind={feedback} />
      <div className="mx-auto max-w-2xl">
        {/* Race track */}
        <div className="relative mb-6 h-16 w-full rounded-2xl bg-gradient-to-r from-slate-100 to-slate-50 px-2">
          <Flag className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 text-emerald-500" />
          {/* robot */}
          <div
            className="absolute top-1 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow transition-all duration-500"
            style={{ left: `calc(${Math.min(robot, FINISH)}% )` }}
          >
            <Bot className="h-4 w-4" />
          </div>
          {/* player */}
          <div
            className="absolute bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow transition-all duration-500"
            style={{ left: `calc(${Math.min(player, FINISH)}% )` }}
          >
            <Rocket className="h-4 w-4" />
          </div>
        </div>

        {result ? (
          <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mb-3 text-5xl">{result === "win" ? "🏁" : "🤖"}</div>
            <h2 className="font-heading text-2xl font-bold text-primary">
              {result === "win" ? "You made it!" : "The robot caught you!"}
            </h2>
            <p className="mt-2 text-gray-600">
              {result === "win" ? "You outran the robot to the finish line." : "Answer faster next time to stay ahead."}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={restart} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 font-semibold text-white hover:bg-rose-600">
                <RotateCcw className="h-4 w-4" /> Race again
              </button>
              <Link href={`/learn/${language}/games/${theme}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50">
                More games →
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Timer */}
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${timeLeft <= 2 ? "bg-rose-500" : "bg-primary"}`} style={{ width: `${(timeLeft / TIME_PER_Q) * 100}%` }} />
            </div>

            <div className="relative mx-auto mb-5 aspect-video w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-md">
              {current.image ? <Image src={current.image} alt="" fill sizes="(max-width:640px) 100vw, 600px" className="object-cover" priority unoptimized /> : null}
            </div>
            <p className="mb-4 text-center text-sm font-medium text-gray-500">Lead: {Math.round(gap)}% · answer fast to extend it!</p>

            <div className="mx-auto grid max-w-xl gap-3 sm:grid-cols-2">
              {options.map((opt) => {
                const isPicked = picked === opt.term;
                const isCorrect = current.term === opt.term;
                const cls = !picked
                  ? "border-gray-200 bg-white hover:border-rose-300 hover:bg-rose-50"
                  : isCorrect
                  ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                  : isPicked
                  ? "border-rose-300 bg-rose-50 text-rose-900"
                  : "border-gray-100 bg-gray-50 text-gray-400";
                return (
                  <button key={opt.term} type="button" onClick={() => pick(opt.term)} disabled={!!picked} className={`rounded-2xl border-2 px-4 py-4 text-center text-lg font-semibold transition-colors disabled:cursor-default ${cls}`}>
                    {opt.term}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </GameShell>
  );
}
