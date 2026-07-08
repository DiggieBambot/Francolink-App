"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, Volume2, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useInworldTTS } from "@/hooks/use-inworld-tts";
import { useSoundEngine } from "@/hooks/use-sound-engine";
import { FeedbackRibbon, useTransientFeedback } from "./game-shell";

type PoolItem = { term: string; translation: string; image: string };
interface Props { language: string; theme: string; }

const LOCALE_FOR: Record<string, string> = { french: "fr-FR", spanish: "es-ES", german: "de-DE", english: "en-GB" };

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

const TARGET_CORRECT = 8;
const START_LIVES = 3;
const STEP_MS = 150;
const SCARE_MS = 5000;

type Dir = "up" | "down" | "left" | "right" | "none";
const DELTA: Record<Dir, [number, number]> = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1], none: [0, 0] };
const DIR_DEG: Record<Dir, number> = { right: 0, down: 90, left: 180, up: 270, none: 0 };

const key = (r: number, c: number) => `${r},${c}`;
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

function bfs(sr: number, sc: number) {
  const dist = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  dist[sr][sc] = 0;
  const q: [number, number][] = [[sr, sc]];
  while (q.length) {
    const [r, c] = q.shift()!;
    for (const [dr, dc] of [DELTA.up, DELTA.down, DELTA.left, DELTA.right]) {
      const nr = r + dr, nc = c + dc;
      if (!isWall(nr, nc) && dist[nr][nc] === -1) { dist[nr][nc] = dist[r][c] + 1; q.push([nr, nc]); }
    }
  }
  return dist;
}
const PLAYER_DIST = bfs(PLAYER_START[0], PLAYER_START[1]);
const OPEN_CELLS: [number, number][] = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!isWall(r, c)) OPEN_CELLS.push([r, c]);

function pickAnswerCells(count: number): [number, number][] {
  const cand = OPEN_CELLS.filter(([r, c]) => PLAYER_DIST[r][c] >= 4 && Math.abs(r - ENEMY_START[0]) + Math.abs(c - ENEMY_START[1]) >= 2);
  if (cand.length <= count) return cand;
  cand.sort((a, b) => PLAYER_DIST[b[0]][b[1]] - PLAYER_DIST[a[0]][a[1]]);
  const picked: [number, number][] = [cand[0]];
  while (picked.length < count) {
    let best: [number, number] | null = null, bestScore = -1;
    for (const c of cand) {
      if (picked.some((p) => p[0] === c[0] && p[1] === c[1])) continue;
      const minD = Math.min(...picked.map((p) => Math.abs(p[0] - c[0]) + Math.abs(p[1] - c[1])));
      if (minD > bestScore) { bestScore = minD; best = c; }
    }
    if (!best) break;
    picked.push(best);
  }
  return picked;
}

interface AnswerTile { item: PoolItem; r: number; c: number; correct: boolean; gone?: boolean; }

export default function MazeChase({ language, theme }: Props) {
  const [pool, setPool] = useState<PoolItem[] | null>(null);
  const [player, setPlayer] = useState({ r: PLAYER_START[0], c: PLAYER_START[1] });
  const [enemies, setEnemies] = useState<{ r: number; c: number }[]>([]);
  const [answers, setAnswers] = useState<AnswerTile[]>([]);
  const [current, setCurrent] = useState<PoolItem | null>(null);
  const [mode, setMode] = useState<"pic2word" | "word2pic">("pic2word");
  const [dots, setDots] = useState<Set<string>>(new Set());
  const [bonus, setBonus] = useState<{ r: number; c: number } | null>(null);
  const [lives, setLives] = useState(START_LIVES);
  const [solved, setSolved] = useState(0);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<"loading" | "playing" | "won" | "lost">("loading");
  const [cell, setCell] = useState(38);
  const { feedback, setFeedback } = useTransientFeedback();
  const { play } = useSoundEngine();
  const locale = LOCALE_FOR[language.toLowerCase()] || "fr-FR";
  const { speak } = useInworldTTS({ language: locale });

  const dirRef = useRef<Dir>("none");
  const [facing, setFacing] = useState<Dir>("right");
  const desiredRef = useRef<Dir>("none");
  const tickRef = useRef(0);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const invulnRef = useRef(0);
  const scaredUntilRef = useRef(0);
  const [scared, setScared] = useState(false);

  const loadPool = useCallback(async () => {
    const res = await fetch(`/api/games/pool?lang=${language}&theme=${theme}&count=30`);
    const { pool: data } = (await res.json()) as { pool: PoolItem[] };
    return data;
  }, [language, theme]);

  // preload a batch of images so tiles aren't blank on reveal
  function preload(items: PoolItem[]) {
    if (typeof window === "undefined") return;
    items.forEach((it) => { if (it.image) { const im = new window.Image(); im.src = it.image; } });
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const data = await loadPool();
      if (cancelled) return;
      preload(data);
      setPool(data);
      if (data.length >= 4) { startRound(data, 0, new Set()); setStatus("playing"); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPool]);

  useEffect(() => {
    function resize() {
      const w = boardRef.current?.parentElement?.clientWidth || 560;
      setCell(Math.floor(Math.min(w, 620) / COLS));
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function startRound(data: PoolItem[], roundIdx: number, _carry: Set<string>) {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const correct = shuffled[0];
    const items = [correct, ...shuffled.slice(1, 4)];
    const cells = pickAnswerCells(4);
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const tiles: AnswerTile[] = order.map((itemIdx, i) => ({ item: items[itemIdx], r: cells[i][0], c: cells[i][1], correct: itemIdx === 0 }));
    preload(items);

    // fresh dots on every open cell that isn't the player start or an answer/enemy cell
    const answerSet = new Set(tiles.map((t) => key(t.r, t.c)));
    const nd = new Set<string>();
    for (const [r, c] of OPEN_CELLS) {
      const k = key(r, c);
      if (k === key(PLAYER_START[0], PLAYER_START[1])) continue;
      if (k === key(ENEMY_START[0], ENEMY_START[1])) continue;
      if (answerSet.has(k)) continue;
      nd.add(k);
    }

    setCurrent(correct);
    setMode(roundIdx % 2 === 0 ? "pic2word" : "word2pic");
    setAnswers(tiles);
    setDots(nd);
    // bonus star at a far-ish random open cell
    const far = OPEN_CELLS.filter(([r, c]) => PLAYER_DIST[r][c] >= 6 && !answerSet.has(key(r, c)));
    setBonus(far.length ? { r: far[Math.floor(Math.random() * far.length)][0], c: far[Math.floor(Math.random() * far.length)][1] } : null);
    setPlayer({ r: PLAYER_START[0], c: PLAYER_START[1] });
    setEnemies([{ r: ENEMY_START[0], c: ENEMY_START[1] }, { r: ENEMY_START[0], c: ENEMY_START[1] }]);
    dirRef.current = "none"; desiredRef.current = "none";
    invulnRef.current = 6;
  }

  // enemy cadence gets faster with progress; scared mode slows them
  function enemyEvery() {
    const base = Math.max(2, 3 - Math.floor(solved / 3));
    return scaredUntilRef.current > Date.now() ? base + 2 : base;
  }

  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => {
      tickRef.current++;
      if (invulnRef.current > 0) invulnRef.current--;
      if (scaredUntilRef.current && scaredUntilRef.current <= Date.now()) { scaredUntilRef.current = 0; setScared(false); }

      setPlayer((p) => {
        const [ddr, ddc] = DELTA[desiredRef.current];
        if (desiredRef.current !== "none" && !isWall(p.r + ddr, p.c + ddc)) { dirRef.current = desiredRef.current; setFacing(desiredRef.current); }
        const [dr, dc] = DELTA[dirRef.current];
        const nr = p.r + dr, nc = p.c + dc;
        if (dirRef.current === "none" || isWall(nr, nc)) return p;
        return { r: nr, c: nc };
      });

      if (tickRef.current % enemyEvery() === 0) {
        setEnemies((es) => es.map((e, idx) => {
          const opts: { r: number; c: number; d: number }[] = [];
          for (const [dr, dc] of [DELTA.up, DELTA.down, DELTA.left, DELTA.right]) {
            const nr = e.r + dr, nc = e.c + dc;
            if (isWall(nr, nc)) continue;
            opts.push({ r: nr, c: nc, d: Math.abs(nr - player.r) + Math.abs(nc - player.c) });
          }
          if (!opts.length) return e;
          const scaredNow = scaredUntilRef.current > Date.now();
          if (scaredNow) { opts.sort((a, b) => b.d - a.d); return { r: opts[0].r, c: opts[0].c }; } // flee
          if (Math.random() < 0.22) return opts[Math.floor(Math.random() * opts.length)];
          opts.sort((a, b) => a.d - b.d);
          return { r: opts[0].r, c: opts[0].c };
        }));
      }
    }, STEP_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, player.r, player.c, solved]);

  // collisions, dots, bonus, answers
  useEffect(() => {
    if (status !== "playing") return;
    const k = key(player.r, player.c);

    // eat dot
    if (dots.has(k)) { setDots((d) => { const n = new Set(d); n.delete(k); return n; }); setScore((s) => s + 5); play("tap"); }
    // eat bonus
    if (bonus && bonus.r === player.r && bonus.c === player.c) {
      setBonus(null); setScore((s) => s + 50); play("xp");
      scaredUntilRef.current = Date.now() + SCARE_MS; setScared(true);
    }

    // caught?
    const scaredNow = scaredUntilRef.current > Date.now();
    const hit = enemies.some((e) => e.r === player.r && e.c === player.c);
    if (hit && !scaredNow && invulnRef.current === 0) {
      play("incorrect"); setFeedback("wrong");
      setLives((l) => { const nl = l - 1; if (nl <= 0) setStatus("lost"); return nl; });
      setPlayer({ r: PLAYER_START[0], c: PLAYER_START[1] });
      setEnemies((es) => es.map(() => ({ r: ENEMY_START[0], c: ENEMY_START[1] })));
      dirRef.current = "none"; desiredRef.current = "none"; invulnRef.current = 8;
      return;
    }
    if (hit && scaredNow) { // eat the enemy → send it home
      setScore((s) => s + 100); play("correct");
      setEnemies((es) => es.map((e) => (e.r === player.r && e.c === player.c ? { r: ENEMY_START[0], c: ENEMY_START[1] } : e)));
    }

    // answer tile
    const tile = answers.find((a) => !a.gone && a.r === player.r && a.c === player.c);
    if (tile && pool && current) {
      if (tile.correct) {
        play("correct"); setFeedback("correct"); setScore((s) => s + 100);
        const next = solved + 1; setSolved(next);
        if (next >= TARGET_CORRECT) { setStatus("won"); play("complete"); }
        else startRound(pool, next, new Set());
      } else {
        play("incorrect"); setFeedback("wrong");
        setAnswers((as) => as.map((a) => (a === tile ? { ...a, gone: true } : a)));
        setLives((l) => { const nl = l - 1; if (nl <= 0) setStatus("lost"); return nl; });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.r, player.c, enemies]);

  useEffect(() => {
    if (status === "playing" && mode === "word2pic" && current) speak(current.term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, mode, status]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const m: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };
      if (m[e.key]) { e.preventDefault(); desiredRef.current = m[e.key]; }
    }
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const el = boardRef.current; if (!el) return;
    let sx = 0, sy = 0;
    const ts = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const te = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      desiredRef.current = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    };
    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchend", te, { passive: true });
    return () => { el.removeEventListener("touchstart", ts); el.removeEventListener("touchend", te); };
  }, []);

  function restart() {
    setLives(START_LIVES); setSolved(0); setScore(0); setScared(false); scaredUntilRef.current = 0; setStatus("loading");
    void (async () => {
      const data = await loadPool(); preload(data); setPool(data);
      if (data.length >= 4) { startRound(data, 0, new Set()); setStatus("playing"); }
    })();
  }

  const boardW = cell * COLS, boardH = cell * ROWS;
  const px = (n: number) => n * cell;
  const dotSize = Math.max(3, Math.round(cell * 0.14));

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <header className="flex items-center gap-3 border-b border-white/10 bg-[#1a1035] px-4 py-3 text-white sm:px-6">
        <Link href={`/learn/${language}/games/${theme}`} className="rounded-full p-2 text-white/70 hover:bg-white/10" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="text-sm font-semibold">Maze Chase</div>
          <div className="text-[11px] text-white/50">Stage {Math.min(solved + 1, TARGET_CORRECT)} of {TARGET_CORRECT} · {score.toLocaleString()} pts</div>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: START_LIVES }).map((_, i) => (
            <Heart key={i} className={`h-5 w-5 ${i < lives ? "fill-rose-500 text-rose-500" : "text-white/20"}`} />
          ))}
        </div>
      </header>

      <FeedbackRibbon kind={feedback} />

      <div className="flex flex-1 flex-col items-center bg-gradient-to-b from-[#241452] to-[#120a2a] px-3 py-4">
        {current && status === "playing" && (
          <div className="mb-3 flex min-h-[3.5rem] w-full max-w-[620px] items-center justify-center gap-3 rounded-2xl bg-white/10 px-4 py-2 text-white backdrop-blur">
            {mode === "pic2word" ? (
              <>
                <span className="text-sm font-medium text-white/70">Eat the word for:</span>
                <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white/10">
                  {current.image ? <Image src={current.image} alt="" fill sizes="48px" className="object-cover" /> : null}
                </div>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-white/70">Eat the picture for:</span>
                <button onClick={() => speak(current.term)} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-lg font-bold hover:bg-white/25">
                  {current.term} <Volume2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )}

        <div ref={boardRef} className="relative touch-none select-none overflow-hidden rounded-2xl shadow-2xl" style={{ width: boardW, height: boardH, background: "#160c33" }}>
          {/* walls */}
          {MAZE.map((row, r) => row.split("").map((ch, c) => ch === "#" ? (
            <div key={`${r}-${c}`} className="absolute rounded-[3px]" style={{ left: px(c), top: px(r), width: cell, height: cell, background: "linear-gradient(135deg,#3b2a7a,#2a1c5c)", boxShadow: "inset 0 0 0 1px rgba(124,92,255,0.35)" }} />
          ) : null))}

          {/* dots */}
          {Array.from(dots).map((k) => {
            const [r, c] = k.split(",").map(Number);
            return <div key={k} className="absolute rounded-full bg-amber-200/80" style={{ left: px(c) + cell / 2 - dotSize / 2, top: px(r) + cell / 2 - dotSize / 2, width: dotSize, height: dotSize }} />;
          })}

          {/* bonus star */}
          {bonus && (
            <div className="absolute z-[6] flex items-center justify-center text-amber-300" style={{ left: px(bonus.c), top: px(bonus.r), width: cell, height: cell }}>
              <Star className="animate-pulse" style={{ width: cell * 0.6, height: cell * 0.6 }} fill="currentColor" />
            </div>
          )}

          {/* answer tiles */}
          {answers.map((a, i) => a.gone ? null : (
            <div key={i} className="absolute z-[7] flex items-center justify-center" style={{ left: px(a.c), top: px(a.r), width: cell, height: cell }}>
              {mode === "pic2word" ? (
                <span className="max-w-[3.6rem] truncate rounded-md bg-amber-400 px-1 font-bold leading-tight text-[#160c33] shadow-md" style={{ fontSize: Math.max(9, cell * 0.26), transform: "scale(1.3)" }} title={a.item.term}>{a.item.term}</span>
              ) : (
                <div className="relative overflow-hidden rounded-md bg-white shadow-md ring-2 ring-amber-300" style={{ height: cell * 1.15, width: cell * 1.15 }}>
                  {a.item.image ? <Image src={a.item.image} alt="" fill sizes="64px" className="object-cover" /> : null}
                </div>
              )}
            </div>
          ))}

          {/* player — Pac-Man */}
          <div className="absolute z-10" style={{ left: 0, top: 0, width: cell * 0.82, height: cell * 0.82, margin: cell * 0.09, transform: `translate(${px(player.c)}px, ${px(player.r)}px) rotate(${DIR_DEG[facing]}deg)`, transition: `transform ${STEP_MS}ms linear` }}>
            <div className="pac h-full w-full" />
          </div>

          {/* enemies — ghosts with eyes + mouth */}
          {enemies.map((e, i) => (
            <div key={i} className="absolute z-10" style={{ left: 0, top: 0, width: cell * 0.8, height: cell * 0.8, margin: cell * 0.1, transform: `translate(${px(e.c)}px, ${px(e.r)}px)`, transition: `transform ${STEP_MS * 2}ms linear` }}>
              <Ghost color={scared ? "#3b82f6" : i === 0 ? "#e11d48" : "#a855f7"} scared={scared} />
            </div>
          ))}

          {(status === "won" || status === "lost") && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#120a2a]/90 px-6 text-center backdrop-blur-sm">
              <div className="mb-2 text-5xl">{status === "won" ? "🏆" : "👾"}</div>
              <h2 className="font-heading text-2xl font-bold text-white">{status === "won" ? "You cleared it!" : "Caught!"}</h2>
              <p className="mt-1 text-sm text-white/70">{score.toLocaleString()} points · {solved} answers</p>
              <div className="mt-6 flex gap-3">
                <button onClick={restart} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 font-semibold text-[#160c33] hover:bg-amber-300"><RotateCcw className="h-4 w-4" /> Play again</button>
                <Link href={`/learn/${language}/games/${theme}`} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 font-semibold text-white hover:bg-white/10">More games</Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden" style={{ width: 168 }}>
          <span />
          <DPad dir="up" onPress={(d) => (desiredRef.current = d)}><ChevronUp className="h-6 w-6" /></DPad>
          <span />
          <DPad dir="left" onPress={(d) => (desiredRef.current = d)}><ChevronLeft className="h-6 w-6" /></DPad>
          <DPad dir="down" onPress={(d) => (desiredRef.current = d)}><ChevronDown className="h-6 w-6" /></DPad>
          <DPad dir="right" onPress={(d) => (desiredRef.current = d)}><ChevronRight className="h-6 w-6" /></DPad>
        </div>
        <p className="mt-3 hidden text-xs text-white/50 sm:block">Arrow keys / WASD to move · eat dots and the ⭐ turns the tables · swipe on touch</p>
      </div>

      <style jsx>{`
        .pac {
          background: #fbbf24;
          border-radius: 50%;
          animation: chomp 0.32s linear infinite;
        }
        @keyframes chomp {
          0%, 100% { clip-path: polygon(100% 0, 46% 50%, 100% 100%, 50% 50%, 0 100%, 0 0); }
          50% { clip-path: polygon(100% 38%, 50% 50%, 100% 62%, 50% 50%, 0 100%, 0 0); }
        }
      `}</style>
    </div>
  );
}

function Ghost({ color, scared }: { color: string; scared: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_0_8px_rgba(0,0,0,0.4)]">
      <path d="M10 52 a40 40 0 0 1 80 0 V92 l-13 -11 l-13 11 l-14 -11 l-13 11 l-14 -11 Z" fill={color} />
      {/* eyes */}
      <circle cx="37" cy="46" r="12" fill="#fff" />
      <circle cx="63" cy="46" r="12" fill="#fff" />
      <circle cx="40" cy="48" r="6" fill="#160c33" />
      <circle cx="66" cy="48" r="6" fill="#160c33" />
      {/* mouth — jagged when hunting, small 'o' when scared */}
      {scared ? (
        <circle cx="50" cy="72" r="5" fill="#160c33" />
      ) : (
        <path d="M32 70 l7 -7 l7 7 l7 -7 l7 7 l7 -7 l7 7" fill="none" stroke="#160c33" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      )}
    </svg>
  );
}

function DPad({ dir, onPress, children }: { dir: Dir; onPress: (d: Dir) => void; children: React.ReactNode }) {
  return (
    <button type="button" onTouchStart={(e) => { e.preventDefault(); onPress(dir); }} onMouseDown={() => onPress(dir)} className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white active:bg-white/25">
      {children}
    </button>
  );
}
