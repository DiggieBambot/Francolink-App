"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, Volume2, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useInworldTTS } from "@/hooks/use-inworld-tts";
import { useSoundEngine } from "@/hooks/use-sound-engine";
import { FeedbackRibbon, useTransientFeedback } from "./game-shell";

type PoolItem = { term: string; translation: string; image: string };
interface Props { language: string; theme: string; }

const LOCALE_FOR: Record<string, string> = { french: "fr-FR", spanish: "es-ES", german: "de-DE", english: "en-GB" };

// Symmetric Pac-Man-ish maze. '#' wall, '.' path, 'P' player start, 'E' enemy pen.
const MAZE = [
  "###############",
  "#......#......#",
  "#.####.#.####.#",
  "#.#.........#.#",
  "#.#.#.###.#.#.#",
  "#...#..E..#...#",
  "###.#.#.#.#.###",
  "#...#.....#...#",
  "#.#.#.###.#.#.#",
  "#.#.........#.#",
  "#.####.#.####.#",
  "#......P......#",
  "###############",
];
const ROWS = MAZE.length;
const COLS = MAZE[0].length;

const TARGET_CORRECT = 8;   // win after this many correct answers
const START_LIVES = 3;
const STEP_MS = 150;        // player move cadence
const ENEMY_EVERY = 2;      // enemies move every Nth tick (slower than player)

type Dir = "up" | "down" | "left" | "right" | "none";
const DELTA: Record<Dir, [number, number]> = {
  up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1], none: [0, 0],
};

function isWall(r: number, c: number) {
  if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return true;
  return MAZE[r][c] === "#";
}
function findChar(ch: string): [number, number] {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (MAZE[r][c] === ch) return [r, c];
  return [1, 1];
}
const PLAYER_START = findChar("P");
const ENEMY_START = findChar("E");

// BFS distances from a cell over open paths.
function bfs(sr: number, sc: number) {
  const dist = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  dist[sr][sc] = 0;
  const q: [number, number][] = [[sr, sc]];
  while (q.length) {
    const [r, c] = q.shift()!;
    for (const [dr, dc] of Object.values(DELTA)) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (!isWall(nr, nc) && dist[nr][nc] === -1) { dist[nr][nc] = dist[r][c] + 1; q.push([nr, nc]); }
    }
  }
  return dist;
}
const PLAYER_DIST = bfs(PLAYER_START[0], PLAYER_START[1]);

// Reachable open cells that are a reasonable distance from the player start —
// used as answer-tile slots. Farthest-point sampling picks 4 spread cells.
function pickAnswerCells(count: number): [number, number][] {
  const candidates: [number, number][] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (isWall(r, c)) continue;
    if (PLAYER_DIST[r][c] < 4) continue;                       // not on top of the player
    if (Math.abs(r - ENEMY_START[0]) + Math.abs(c - ENEMY_START[1]) < 2) continue; // not in the pen
    candidates.push([r, c]);
  }
  if (candidates.length <= count) return candidates;
  const picked: [number, number][] = [];
  // seed with the farthest cell from the player
  candidates.sort((a, b) => PLAYER_DIST[b[0]][b[1]] - PLAYER_DIST[a[0]][a[1]]);
  picked.push(candidates[0]);
  while (picked.length < count) {
    let best: [number, number] | null = null;
    let bestScore = -1;
    for (const cand of candidates) {
      if (picked.some((p) => p[0] === cand[0] && p[1] === cand[1])) continue;
      const minD = Math.min(...picked.map((p) => Math.abs(p[0] - cand[0]) + Math.abs(p[1] - cand[1])));
      if (minD > bestScore) { bestScore = minD; best = cand; }
    }
    if (!best) break;
    picked.push(best);
  }
  return picked;
}

interface AnswerTile { item: PoolItem; r: number; c: number; correct: boolean; gone?: boolean; }

export default function MazeChase({ language, theme }: Props) {
  const [pool, setPool] = useState<PoolItem[] | null>(null);
  const [player, setPlayer] = useState<{ r: number; c: number }>({ r: PLAYER_START[0], c: PLAYER_START[1] });
  const [enemies, setEnemies] = useState<{ r: number; c: number }[]>([]);
  const [answers, setAnswers] = useState<AnswerTile[]>([]);
  const [current, setCurrent] = useState<PoolItem | null>(null);
  const [mode, setMode] = useState<"pic2word" | "word2pic">("pic2word");
  const [lives, setLives] = useState(START_LIVES);
  const [solved, setSolved] = useState(0);
  const [status, setStatus] = useState<"loading" | "playing" | "won" | "lost">("loading");
  const [cell, setCell] = useState(38);
  const { feedback, setFeedback } = useTransientFeedback();
  const { play } = useSoundEngine();
  const locale = LOCALE_FOR[language.toLowerCase()] || "fr-FR";
  const { speak } = useInworldTTS({ language: locale });

  const dirRef = useRef<Dir>("none");
  const desiredRef = useRef<Dir>("none");
  const tickRef = useRef(0);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const invulnRef = useRef(0);

  // ── Load pool ──────────────────────────────────────────────────────────
  const loadPool = useCallback(async () => {
    const res = await fetch(`/api/games/pool?lang=${language}&theme=${theme}&count=30`);
    const { pool: data } = (await res.json()) as { pool: PoolItem[] };
    return data;
  }, [language, theme]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const data = await loadPool();
      if (cancelled) return;
      setPool(data);
      if (data.length >= 4) startRound(data, 0);
      setStatus(data.length >= 4 ? "playing" : "loading");
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPool]);

  // ── Responsive cell size ───────────────────────────────────────────────
  useEffect(() => {
    function resize() {
      const w = boardRef.current?.parentElement?.clientWidth || 560;
      const maxW = Math.min(w, 620);
      setCell(Math.floor(maxW / COLS));
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── Build a new round from the pool ────────────────────────────────────
  function startRound(data: PoolItem[], roundIdx: number) {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const correct = shuffled[0];
    const decoys = shuffled.slice(1, 4);
    const cells = pickAnswerCells(4);
    const items = [correct, ...decoys];
    // shuffle item→cell assignment
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const tiles: AnswerTile[] = order.map((itemIdx, i) => ({
      item: items[itemIdx],
      r: cells[i][0],
      c: cells[i][1],
      correct: itemIdx === 0,
    }));
    setCurrent(correct);
    setMode(roundIdx % 2 === 0 ? "pic2word" : "word2pic");
    setAnswers(tiles);
    // reset positions
    setPlayer({ r: PLAYER_START[0], c: PLAYER_START[1] });
    setEnemies([
      { r: ENEMY_START[0], c: ENEMY_START[1] },
      { r: ENEMY_START[0], c: ENEMY_START[1] },
    ]);
    dirRef.current = "none";
    desiredRef.current = "none";
    invulnRef.current = 6; // brief grace after reset
  }

  // ── Game loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => {
      tickRef.current++;
      if (invulnRef.current > 0) invulnRef.current--;

      // Player movement (continuous, Pac-Man style)
      setPlayer((p) => {
        // adopt desired direction if the turn is legal
        const [ddr, ddc] = DELTA[desiredRef.current];
        if (desiredRef.current !== "none" && !isWall(p.r + ddr, p.c + ddc)) {
          dirRef.current = desiredRef.current;
        }
        const [dr, dc] = DELTA[dirRef.current];
        const nr = p.r + dr, nc = p.c + dc;
        if (dirRef.current === "none" || isWall(nr, nc)) return p;
        return { r: nr, c: nc };
      });

      // Enemy movement (slower)
      if (tickRef.current % ENEMY_EVERY === 0) {
        setEnemies((es) =>
          es.map((e, idx) => {
            const opts: { r: number; c: number; d: number }[] = [];
            for (const [dr, dc] of [DELTA.up, DELTA.down, DELTA.left, DELTA.right]) {
              const nr = e.r + dr, nc = e.c + dc;
              if (isWall(nr, nc)) continue;
              opts.push({ r: nr, c: nc, d: Math.abs(nr - player.r) + Math.abs(nc - player.c) });
            }
            if (opts.length === 0) return e;
            // 25% random wander so they're beatable, else greedy chase
            if (Math.random() < 0.25 * (idx + 1) / 2) {
              return opts[Math.floor(Math.random() * opts.length)];
            }
            opts.sort((a, b) => a.d - b.d);
            return { r: opts[0].r, c: opts[0].c };
          })
        );
      }
    }, STEP_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, player.r, player.c]);

  // ── Collisions & answer pickup ─────────────────────────────────────────
  useEffect(() => {
    if (status !== "playing") return;

    // enemy caught the player?
    if (invulnRef.current === 0 && enemies.some((e) => e.r === player.r && e.c === player.c)) {
      play("incorrect");
      setFeedback("wrong");
      setLives((l) => {
        const nl = l - 1;
        if (nl <= 0) { setStatus("lost"); play("incorrect"); }
        return nl;
      });
      // reset positions, keep the current question
      setPlayer({ r: PLAYER_START[0], c: PLAYER_START[1] });
      setEnemies((es) => es.map(() => ({ r: ENEMY_START[0], c: ENEMY_START[1] })));
      dirRef.current = "none"; desiredRef.current = "none";
      invulnRef.current = 8;
      return;
    }

    // reached an answer tile?
    const tile = answers.find((a) => !a.gone && a.r === player.r && a.c === player.c);
    if (tile && pool && current) {
      if (tile.correct) {
        play("correct");
        setFeedback("correct");
        const nextSolved = solved + 1;
        setSolved(nextSolved);
        if (nextSolved >= TARGET_CORRECT) { setStatus("won"); play("complete"); }
        else startRound(pool, nextSolved);
      } else {
        play("incorrect");
        setFeedback("wrong");
        setAnswers((as) => as.map((a) => (a === tile ? { ...a, gone: true } : a)));
        setLives((l) => {
          const nl = l - 1;
          if (nl <= 0) setStatus("lost");
          return nl;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.r, player.c, enemies]);

  // ── Speak the prompt when a word2pic round starts ──────────────────────
  useEffect(() => {
    if (status === "playing" && mode === "word2pic" && current) speak(current.term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, mode, status]);

  // ── Input: keyboard ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Record<string, Dir> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right",
      };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); desiredRef.current = dir; }
    }
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Input: swipe ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    let sx = 0, sy = 0;
    function ts(e: TouchEvent) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
    function te(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      desiredRef.current = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    }
    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchend", te, { passive: true });
    return () => { el.removeEventListener("touchstart", ts); el.removeEventListener("touchend", te); };
  }, []);

  function restart() {
    setLives(START_LIVES); setSolved(0); setStatus("loading");
    void (async () => {
      const data = await loadPool();
      setPool(data);
      if (data.length >= 4) { startRound(data, 0); setStatus("playing"); }
    })();
  }

  const boardW = cell * COLS;
  const boardH = cell * ROWS;
  const px = (n: number) => n * cell;

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-white/10 bg-[#1a1035] px-4 py-3 text-white sm:px-6">
        <Link href={`/learn/${language}/games/${theme}`} className="rounded-full p-2 text-white/70 hover:bg-white/10" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 text-sm font-semibold">Maze Chase</div>
        <div className="flex items-center gap-1">
          {Array.from({ length: START_LIVES }).map((_, i) => (
            <Heart key={i} className={`h-5 w-5 ${i < lives ? "fill-rose-500 text-rose-500" : "text-white/20"}`} />
          ))}
        </div>
        <div className="ml-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold">{solved} / {TARGET_CORRECT}</div>
      </header>

      <FeedbackRibbon kind={feedback} />

      {/* Playfield */}
      <div className="flex flex-1 flex-col items-center bg-gradient-to-b from-[#241452] to-[#120a2a] px-3 py-4">
        {/* Prompt banner */}
        {current && status === "playing" && (
          <div className="mb-3 flex min-h-[3.5rem] w-full max-w-[620px] items-center justify-center gap-3 rounded-2xl bg-white/10 px-4 py-2 text-white backdrop-blur">
            {mode === "pic2word" ? (
              <>
                <span className="text-sm font-medium text-white/70">Grab the word for:</span>
                <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white/10">
                  {current.image ? <Image src={current.image} alt="" fill sizes="48px" className="object-cover" unoptimized /> : null}
                </div>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-white/70">Grab the picture for:</span>
                <button onClick={() => speak(current.term)} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-lg font-bold hover:bg-white/25">
                  {current.term} <Volume2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Maze board */}
        <div
          ref={boardRef}
          className="relative touch-none select-none overflow-hidden rounded-2xl shadow-2xl"
          style={{ width: boardW, height: boardH, background: "#160c33" }}
        >
          {/* walls */}
          {MAZE.map((row, r) =>
            row.split("").map((ch, c) =>
              ch === "#" ? (
                <div
                  key={`${r}-${c}`}
                  className="absolute rounded-[3px]"
                  style={{
                    left: px(c), top: px(r), width: cell, height: cell,
                    background: "linear-gradient(135deg,#3b2a7a,#2a1c5c)",
                    boxShadow: "inset 0 0 0 1px rgba(124,92,255,0.35)",
                  }}
                />
              ) : null
            )
          )}

          {/* answer tiles */}
          {answers.map((a, i) =>
            a.gone ? null : (
              <div
                key={i}
                className="absolute flex items-center justify-center rounded-lg text-center transition-transform"
                style={{
                  left: px(a.c), top: px(a.r), width: cell, height: cell,
                  transform: "scale(1.35)", zIndex: 5,
                }}
              >
                {mode === "pic2word" ? (
                  <span
                    className="max-w-[3.4rem] truncate rounded-md bg-amber-400 px-1 text-[10px] font-bold leading-tight text-[#160c33] shadow-md"
                    style={{ fontSize: Math.max(8, cell * 0.24) }}
                    title={a.item.term}
                  >
                    {a.item.term}
                  </span>
                ) : (
                  <div className="relative h-[85%] w-[85%] overflow-hidden rounded-md bg-white shadow-md ring-2 ring-amber-300">
                    {a.item.image ? <Image src={a.item.image} alt="" fill sizes="48px" className="object-cover" unoptimized /> : null}
                  </div>
                )}
              </div>
            )
          )}

          {/* player */}
          <div
            className="absolute z-10 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-[0_0_16px_rgba(251,191,36,0.7)]"
            style={{ left: 0, top: 0, width: cell * 0.82, height: cell * 0.82, margin: cell * 0.09, transform: `translate(${px(player.c)}px, ${px(player.r)}px)`, transition: `transform ${STEP_MS}ms linear` }}
          >
            <span className="flex gap-[2px]">
              <span className="block h-1.5 w-1.5 rounded-full bg-[#160c33]" />
              <span className="block h-1.5 w-1.5 rounded-full bg-[#160c33]" />
            </span>
          </div>

          {/* enemies */}
          {enemies.map((e, i) => (
            <div
              key={i}
              className="absolute z-10 rounded-full"
              style={{
                left: 0, top: 0, width: cell * 0.78, height: cell * 0.78, margin: cell * 0.11,
                transform: `translate(${px(e.c)}px, ${px(e.r)}px)`, transition: `transform ${STEP_MS * ENEMY_EVERY}ms linear`,
                background: i === 0 ? "radial-gradient(circle at 40% 35%,#ff7a9c,#e11d48)" : "radial-gradient(circle at 40% 35%,#a78bfa,#7c3aed)",
                boxShadow: "0 0 12px rgba(225,29,72,0.5)",
              }}
            />
          ))}

          {/* Win / lose overlay */}
          {(status === "won" || status === "lost") && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#120a2a]/90 px-6 text-center backdrop-blur-sm">
              <div className="mb-2 text-5xl">{status === "won" ? "🏆" : "👾"}</div>
              <h2 className="font-heading text-2xl font-bold text-white">
                {status === "won" ? "You escaped!" : "Caught!"}
              </h2>
              <p className="mt-1 text-sm text-white/70">
                {status === "won" ? `You grabbed ${solved} correct answers.` : `You solved ${solved} before the chasers got you.`}
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={restart} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 font-semibold text-[#160c33] hover:bg-amber-300">
                  <RotateCcw className="h-4 w-4" /> Play again
                </button>
                <Link href={`/learn/${language}/games/${theme}`} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 font-semibold text-white hover:bg-white/10">
                  More games
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* On-screen dpad (mobile) */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden" style={{ width: 168 }}>
          <span />
          <DPad dir="up" onPress={(d) => (desiredRef.current = d)}><ChevronUp className="h-6 w-6" /></DPad>
          <span />
          <DPad dir="left" onPress={(d) => (desiredRef.current = d)}><ChevronLeft className="h-6 w-6" /></DPad>
          <DPad dir="down" onPress={(d) => (desiredRef.current = d)}><ChevronDown className="h-6 w-6" /></DPad>
          <DPad dir="right" onPress={(d) => (desiredRef.current = d)}><ChevronRight className="h-6 w-6" /></DPad>
        </div>
        <p className="mt-3 hidden text-xs text-white/50 sm:block">Use arrow keys or WASD to move · swipe on touch</p>
      </div>
    </div>
  );
}

function DPad({ dir, onPress, children }: { dir: Dir; onPress: (d: Dir) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onTouchStart={(e) => { e.preventDefault(); onPress(dir); }}
      onMouseDown={() => onPress(dir)}
      className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white active:bg-white/25"
    >
      {children}
    </button>
  );
}
