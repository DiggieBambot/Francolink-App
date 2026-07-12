"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, Volume2, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Star, Snowflake, Trophy } from "lucide-react";
import { useInworldTTS } from "@/hooks/use-inworld-tts";
import { useSoundEngine } from "@/hooks/use-sound-engine";
import { FeedbackRibbon, useTransientFeedback } from "./game-shell";

type PoolItem = { term: string; translation: string; image: string };
type LbRow = { user_id: string; name: string; avatar_url: string | null; best_score: number; plays: number };
interface Props { language: string; theme: string; }

const LOCALE_FOR: Record<string, string> = { french: "fr-FR", spanish: "es-ES", german: "de-DE", english: "en-GB" };

// ─── Mazes ──────────────────────────────────────────────────────────────────
// Four clean, hand-designed, horizontally-symmetric Pac-Man boards — one per
// level, so the maze changes as you climb. All share the same open bottom lane
// (player starts bottom-center on an open cell) and the same 3-wide villain
// "pen" on the middle row, so villains fan out instead of stacking.
const MAZES: string[][] = [
  [ // 1 — classic
    "###############", "#.............#", "#.####.#.####.#", "#.#.........#.#",
    "#.#.#.###.#.#.#", "#...#.....#...#", "###.#.#.#.#.###", "#...#.....#...#",
    "#.#.#.###.#.#.#", "#.#.........#.#", "#.####.#.####.#", "#.............#", "###############",
  ],
  [ // 2 — nested rings
    "###############", "#.............#", "#.###.#.#.###.#", "#.#...#.#...#.#",
    "#...#.#.#.#...#", "#...#.....#...#", "#.#...#.#...#.#", "#.###.#.#.###.#",
    "#...#.#.#.#...#", "#.#...#.#...#.#", "#.###.#.#.###.#", "#.............#", "###############",
  ],
  [ // 3 — chambers
    "###############", "#.............#", "#.###.#.#.###.#", "#...#.#.#.#...#",
    "#.#.#.....#.#.#", "#...#.....#...#", "#.#.#.....#.#.#", "#...#.#.#.#...#",
    "#.###.#.#.###.#", "#...#.#.#.#...#", "#.###.#.#.###.#", "#.............#", "###############",
  ],
  [ // 4 — brick shelves
    "###############", "#.............#", "#.##.##.##.##.#", "#.............#",
    "#.##.##.##.##.#", "#...#.....#...#", "#.##.##.##.##.#", "#.............#",
    "#.##.##.##.##.#", "#.............#", "#.##.##.##.##.#", "#.............#", "###############",
  ],
];
const ROWS = MAZES[0].length;      // 13
const COLS = MAZES[0][0].length;   // 15
const PLAYER_START: [number, number] = [11, 7];
// villain home cells on the open middle row (spread so they don't overlap)
const ENEMY_HOME: [number, number][] = [[5, 7], [5, 6], [5, 8]];

type Dir = "up" | "down" | "left" | "right" | "none";
const DELTA: Record<Dir, [number, number]> = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1], none: [0, 0] };
const DIR_DEG: Record<Dir, number> = { right: 0, down: 90, left: 180, up: 270, none: 0 };
const key = (r: number, c: number) => `${r},${c}`;

function isWall(grid: string[], r: number, c: number) {
  if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return true;
  return grid[r][c] === "#";
}

interface MazeInfo { grid: string[]; open: [number, number][]; dist: number[][]; }
function buildInfo(grid: string[]): MazeInfo {
  const open: [number, number][] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!isWall(grid, r, c)) open.push([r, c]);
  const dist = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  dist[PLAYER_START[0]][PLAYER_START[1]] = 0;
  const q: [number, number][] = [PLAYER_START];
  while (q.length) {
    const [r, c] = q.shift()!;
    for (const [dr, dc] of [DELTA.up, DELTA.down, DELTA.left, DELTA.right]) {
      const nr = r + dr, nc = c + dc;
      if (!isWall(grid, nr, nc) && dist[nr][nc] === -1) { dist[nr][nc] = dist[r][c] + 1; q.push([nr, nc]); }
    }
  }
  return { grid, open, dist };
}
const MAZE_INFOS: MazeInfo[] = MAZES.map(buildInfo);

// Answer tiles: far from the player start and clear of every villain home.
function pickAnswerCells(info: MazeInfo, count: number): [number, number][] {
  const cand = info.open.filter(([r, c]) =>
    info.dist[r][c] >= 4 && ENEMY_HOME.every(([er, ec]) => Math.abs(r - er) + Math.abs(c - ec) >= 3));
  if (cand.length <= count) return cand;
  cand.sort((a, b) => info.dist[b[0]][b[1]] - info.dist[a[0]][a[1]]);
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

// Distinct far-ish open cells for power-ups, avoiding taken cells.
function pickFarCells(info: MazeInfo, n: number, taken: Set<string>, minDist = 6): [number, number][] {
  const cand = info.open.filter(([r, c]) => info.dist[r][c] >= minDist && !taken.has(key(r, c)));
  for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
  return cand.slice(0, n);
}

type EnemyType = "chaser" | "ambusher" | "roamer";
interface LevelConfig { answers: number; enemyBase: number; enemies: EnemyType[]; }
// Toddler-friendly ramp: level 1 is one slow wanderer and only 4 finds to clear;
// villains, speed and count grow gently so a small child can still win.
const LEVELS: LevelConfig[] = [
  { answers: 4, enemyBase: 5, enemies: ["roamer"] },
  { answers: 4, enemyBase: 5, enemies: ["chaser", "roamer"] },
  { answers: 5, enemyBase: 4, enemies: ["chaser", "roamer"] },
  { answers: 5, enemyBase: 4, enemies: ["chaser", "ambusher", "roamer"] },
];

const START_LIVES = 3;
const MAX_LIVES = 5;
const STEP_MS = 200;      // player move cadence (higher = calmer)
const MIN_ENEMY_EVERY = 3; // never faster than this (keeps it fair for kids)
const SCARE_MS = 5000;    // ⭐ turns villains edible
const FREEZE_MS = 4500;   // ❄ freezes villains in place

const ENEMY_COLOR: Record<EnemyType, string> = { chaser: "#e11d48", ambusher: "#a855f7", roamer: "#f97316" };

type PowerKind = "star" | "freeze" | "heart";
interface Powerup { r: number; c: number; kind: PowerKind; }
interface AnswerTile { item: PoolItem; r: number; c: number; correct: boolean; gone?: boolean; }
interface Enemy { r: number; c: number; type: EnemyType; home: [number, number]; }

export default function MazeChase({ language, theme }: Props) {
  const [pool, setPool] = useState<PoolItem[] | null>(null);
  const [level, setLevel] = useState(1);
  const [player, setPlayer] = useState({ r: PLAYER_START[0], c: PLAYER_START[1] });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [answers, setAnswers] = useState<AnswerTile[]>([]);
  const [current, setCurrent] = useState<PoolItem | null>(null);
  const [dots, setDots] = useState<Set<string>>(new Set());
  const [powerups, setPowerups] = useState<Powerup[]>([]);
  const [lives, setLives] = useState(START_LIVES);
  const [solvedInLevel, setSolvedInLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<"loading" | "playing" | "won" | "lost">("loading");
  const [loadPct, setLoadPct] = useState(0);
  const [cell, setCell] = useState(38);
  const [scared, setScared] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [board, setBoard] = useState<LbRow[] | null>(null);
  const [myRank, setMyRank] = useState(-1);
  const submittedRef = useRef(false);
  const { feedback, setFeedback } = useTransientFeedback();
  const { play } = useSoundEngine();
  const locale = LOCALE_FOR[language.toLowerCase()] || "fr-FR";
  const { speak } = useInworldTTS({ language: locale });

  const [facing, setFacing] = useState<Dir>("up");
  const facingRef = useRef<Dir>("up");
  const desiredRef = useRef<Dir>("none");
  const heldRef = useRef<Dir[]>([]);
  const tickRef = useRef(0);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const invulnRef = useRef(0);
  const scaredUntilRef = useRef(0);
  const freezeUntilRef = useRef(0);
  const solvedInLevelRef = useRef(0);
  const livesRef = useRef(START_LIVES);
  const mazeRef = useRef<MazeInfo>(MAZE_INFOS[0]);

  const maze = MAZE_INFOS[level - 1];
  useEffect(() => { facingRef.current = facing; }, [facing]);
  useEffect(() => { solvedInLevelRef.current = solvedInLevel; }, [solvedInLevel]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { mazeRef.current = maze; }, [maze]);

  // ── press / hold movement ─────────────────────────────────────────────
  const holdDir = useCallback((d: Dir) => {
    if (d === "none") return;
    if (!heldRef.current.includes(d)) heldRef.current.push(d);
    desiredRef.current = d; setFacing(d);
  }, []);
  const releaseDir = useCallback((d: Dir) => {
    heldRef.current = heldRef.current.filter((x) => x !== d);
    const next = heldRef.current[heldRef.current.length - 1] ?? "none";
    desiredRef.current = next; if (next !== "none") setFacing(next);
  }, []);
  const clearHold = useCallback(() => { heldRef.current = []; desiredRef.current = "none"; }, []);

  const loadPool = useCallback(async () => {
    const res = await fetch(`/api/games/pool?lang=${language}&theme=${theme}&count=30`);
    const { pool: data } = (await res.json()) as { pool: PoolItem[] };
    return data;
  }, [language, theme]);

  // Resolve only when every picture is decoded, so tiles never pop in blank.
  const preloadAll = useCallback((items: PoolItem[]) => {
    return new Promise<void>((resolve) => {
      if (typeof window === "undefined") return resolve();
      const imgs = items.filter((i) => i.image);
      if (!imgs.length) { setLoadPct(1); return resolve(); }
      let done = 0;
      const bump = () => { done++; setLoadPct(done / imgs.length); if (done >= imgs.length) resolve(); };
      imgs.forEach((it) => { const im = new window.Image(); im.onload = bump; im.onerror = bump; im.src = it.image; });
    });
  }, []);

  const beginGame = useCallback(async () => {
    setStatus("loading"); setLoadPct(0);
    const data = await loadPool();
    setPool(data);
    await preloadAll(data);
    if (data.length >= 4) { startRound(data, 1); setStatus("playing"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPool, preloadAll]);

  useEffect(() => { void beginGame(); }, [beginGame]);

  useEffect(() => {
    function resize() {
      const w = boardRef.current?.parentElement?.clientWidth || 560;
      const byWidth = Math.floor(Math.min(w, 880) / COLS);
      const byHeight = Math.floor((window.innerHeight * 0.66) / ROWS);
      setCell(Math.max(30, Math.min(byWidth, byHeight)));
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function spawnEnemies(levelIdx: number): Enemy[] {
    return LEVELS[levelIdx - 1].enemies.map((type, i) => {
      const home = ENEMY_HOME[i % ENEMY_HOME.length];
      return { r: home[0], c: home[1], type, home };
    });
  }

  // Lay out a fresh round for the given (1-based) level.
  function startRound(data: PoolItem[], levelIdx: number) {
    const info = MAZE_INFOS[levelIdx - 1];
    mazeRef.current = info;
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const correct = shuffled[0];
    const items = [correct, ...shuffled.slice(1, 4)];
    const cells = pickAnswerCells(info, 4);
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const tiles: AnswerTile[] = order.map((itemIdx, i) => ({ item: items[itemIdx], r: cells[i][0], c: cells[i][1], correct: itemIdx === 0 }));

    const reserved = new Set(tiles.map((t) => key(t.r, t.c)));
    reserved.add(key(PLAYER_START[0], PLAYER_START[1]));
    for (const [r, c] of ENEMY_HOME) reserved.add(key(r, c));

    const nd = new Set<string>();
    for (const [r, c] of info.open) { const k = key(r, c); if (!reserved.has(k)) nd.add(k); }

    // power-ups: always a ⭐; a ❄ most rounds; a ❤ sometimes when hurt
    const taken = new Set(reserved);
    const ups: Powerup[] = [];
    const [starCell] = pickFarCells(info, 1, taken);
    if (starCell) { ups.push({ r: starCell[0], c: starCell[1], kind: "star" }); taken.add(key(starCell[0], starCell[1])); nd.delete(key(starCell[0], starCell[1])); }
    if (Math.random() < 0.7) { const [f] = pickFarCells(info, 1, taken, 5); if (f) { ups.push({ r: f[0], c: f[1], kind: "freeze" }); taken.add(key(f[0], f[1])); nd.delete(key(f[0], f[1])); } }
    if (livesRef.current < MAX_LIVES && Math.random() < 0.3) { const [h] = pickFarCells(info, 1, taken, 5); if (h) { ups.push({ r: h[0], c: h[1], kind: "heart" }); nd.delete(key(h[0], h[1])); } }

    setCurrent(correct);
    setAnswers(tiles);
    setDots(nd);
    setPowerups(ups);
    setPlayer({ r: PLAYER_START[0], c: PLAYER_START[1] });
    setEnemies(spawnEnemies(levelIdx));
    setFacing("up"); clearHold();
    invulnRef.current = 8;
  }

  // Enemy cadence: faster with level & within-level progress; frozen stops,
  // scared slows. Lower number = faster.
  function enemyEvery() {
    const cfg = LEVELS[level - 1];
    const base = Math.max(MIN_ENEMY_EVERY, cfg.enemyBase - Math.floor(solvedInLevelRef.current / 4));
    if (freezeUntilRef.current > Date.now()) return 999;
    return scaredUntilRef.current > Date.now() ? base + 3 : base;
  }

  function nextEnemyMove(e: Enemy, pr: number, pc: number, pf: Dir): Enemy {
    const grid = mazeRef.current.grid;
    const opts: { r: number; c: number; d: number }[] = [];
    for (const [dr, dc] of [DELTA.up, DELTA.down, DELTA.left, DELTA.right]) {
      const nr = e.r + dr, nc = e.c + dc;
      if (isWall(grid, nr, nc)) continue;
      opts.push({ r: nr, c: nc, d: 0 });
    }
    if (!opts.length) return e;
    const scaredNow = scaredUntilRef.current > Date.now();

    let tr = pr, tc = pc;
    if (!scaredNow && e.type === "ambusher") { const [dr, dc] = DELTA[pf === "none" ? "up" : pf]; tr = pr + dr * 3; tc = pc + dc * 3; }
    for (const o of opts) o.d = Math.abs(o.r - tr) + Math.abs(o.c - tc);

    if (scaredNow) { opts.sort((a, b) => (Math.abs(b.r - pr) + Math.abs(b.c - pc)) - (Math.abs(a.r - pr) + Math.abs(a.c - pc))); return { ...e, r: opts[0].r, c: opts[0].c }; }
    const wander = e.type === "roamer" ? 0.6 : 0.18;
    if (Math.random() < wander) { const o = opts[Math.floor(Math.random() * opts.length)]; return { ...e, r: o.r, c: o.c }; }
    opts.sort((a, b) => a.d - b.d);
    return { ...e, r: opts[0].r, c: opts[0].c };
  }

  // ── main tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => {
      tickRef.current++;
      if (invulnRef.current > 0) invulnRef.current--;
      if (scaredUntilRef.current && scaredUntilRef.current <= Date.now()) { scaredUntilRef.current = 0; setScared(false); }
      if (freezeUntilRef.current && freezeUntilRef.current <= Date.now()) { freezeUntilRef.current = 0; setFrozen(false); }

      setPlayer((p) => {
        const dir = desiredRef.current;
        if (dir === "none") return p;
        const [dr, dc] = DELTA[dir];
        const nr = p.r + dr, nc = p.c + dc;
        if (isWall(mazeRef.current.grid, nr, nc)) return p;
        return { r: nr, c: nc };
      });

      if (tickRef.current % enemyEvery() === 0 && freezeUntilRef.current <= Date.now()) {
        setEnemies((es) => es.map((e) => nextEnemyMove(e, player.r, player.c, facingRef.current)));
      }
    }, STEP_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, player.r, player.c, level, solvedInLevel]);

  // ── collisions: dots, power-ups, villains, answers ────────────────────
  useEffect(() => {
    if (status !== "playing") return;
    const k = key(player.r, player.c);

    if (dots.has(k)) { setDots((d) => { const n = new Set(d); n.delete(k); return n; }); setScore((s) => s + 5); play("tap"); }

    const up = powerups.find((u) => u.r === player.r && u.c === player.c);
    if (up) {
      setPowerups((ps) => ps.filter((u) => u !== up));
      if (up.kind === "star") { setScore((s) => s + 50); play("xp"); scaredUntilRef.current = Date.now() + SCARE_MS; setScared(true); }
      else if (up.kind === "freeze") { setScore((s) => s + 40); play("xp"); freezeUntilRef.current = Date.now() + FREEZE_MS; setFrozen(true); }
      else if (up.kind === "heart") { setScore((s) => s + 25); play("correct"); setLives((l) => Math.min(MAX_LIVES, l + 1)); }
    }

    const scaredNow = scaredUntilRef.current > Date.now();
    const frozenNow = freezeUntilRef.current > Date.now();
    const hitEnemy = enemies.find((e) => e.r === player.r && e.c === player.c);
    if (hitEnemy && scaredNow) {
      setScore((s) => s + 100); play("correct");
      setEnemies((es) => es.map((e) => (e === hitEnemy ? { ...e, r: e.home[0], c: e.home[1] } : e)));
    } else if (hitEnemy && !frozenNow && invulnRef.current === 0) {
      play("incorrect"); setFeedback("wrong");
      setLives((l) => { const nl = l - 1; if (nl <= 0) setStatus("lost"); return nl; });
      setPlayer({ r: PLAYER_START[0], c: PLAYER_START[1] });
      setEnemies((es) => es.map((e) => ({ ...e, r: e.home[0], c: e.home[1] })));
      clearHold(); invulnRef.current = 10;
      return;
    }

    const tile = answers.find((a) => !a.gone && a.r === player.r && a.c === player.c);
    if (tile && pool && current) {
      if (tile.correct) {
        play("correct"); setFeedback("correct"); setScore((s) => s + 150);
        const cfg = LEVELS[level - 1];
        const nextSolved = solvedInLevel + 1;
        if (nextSolved >= cfg.answers) {
          if (level >= LEVELS.length) { setStatus("won"); play("complete"); }
          else {
            const nl = level + 1;
            setLevel(nl); setSolvedInLevel(0); solvedInLevelRef.current = 0;
            setLives((l) => Math.min(MAX_LIVES, l + 1));
            play("complete");
            startRound(pool, nl);
          }
        } else {
          setSolvedInLevel(nextSolved);
          startRound(pool, level);
        }
      } else {
        play("incorrect"); setFeedback("wrong");
        setAnswers((as) => as.map((a) => (a === tile ? { ...a, gone: true } : a)));
        setLives((l) => { const nl = l - 1; if (nl <= 0) setStatus("lost"); return nl; });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.r, player.c, enemies]);

  useEffect(() => {
    if (status === "playing" && current) speak(current.term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, status]);

  // On game end: record the score, then load this game+theme's leaderboard.
  useEffect(() => {
    if (status !== "won" && status !== "lost") return;
    if (submittedRef.current) return;
    submittedRef.current = true;
    void (async () => {
      try {
        await fetch("/api/games/score", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ game: "maze-chase", theme, language, score, level, won: status === "won" }),
        });
      } catch { /* ignore — leaderboard is best-effort */ }
      try {
        const res = await fetch(`/api/games/leaderboard?game=maze-chase&theme=${theme}&lang=${language}&limit=10`);
        const j = await res.json();
        setBoard(j.board || []); setMyRank(j.myRank ?? -1);
      } catch { setBoard([]); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const m: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };
    function onDown(e: KeyboardEvent) { if (m[e.key]) { e.preventDefault(); holdDir(m[e.key]); } }
    function onUp(e: KeyboardEvent) { if (m[e.key]) { e.preventDefault(); releaseDir(m[e.key]); } }
    window.addEventListener("keydown", onDown, { passive: false });
    window.addEventListener("keyup", onUp, { passive: false });
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [holdDir, releaseDir]);

  useEffect(() => {
    const el = boardRef.current; if (!el) return;
    let sx = 0, sy = 0;
    const ts = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const te = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      setFacing(dir);
      setPlayer((p) => { const [dr, dc] = DELTA[dir]; const nr = p.r + dr, nc = p.c + dc; return isWall(mazeRef.current.grid, nr, nc) ? p : { r: nr, c: nc }; });
    };
    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchend", te, { passive: true });
    return () => { el.removeEventListener("touchstart", ts); el.removeEventListener("touchend", te); };
  }, []);

  function restart() {
    setLives(START_LIVES); livesRef.current = START_LIVES;
    setLevel(1); setSolvedInLevel(0); solvedInLevelRef.current = 0;
    setScore(0); setScared(false); setFrozen(false);
    scaredUntilRef.current = 0; freezeUntilRef.current = 0;
    setBoard(null); setMyRank(-1); submittedRef.current = false;
    void beginGame();
  }

  const boardW = cell * COLS, boardH = cell * ROWS;
  const px = (n: number) => n * cell;
  const dotSize = Math.max(3, Math.round(cell * 0.14));
  const freezeActive = frozen && freezeUntilRef.current > Date.now();

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <header className="flex items-center gap-3 border-b border-white/10 bg-[#1a1035] px-4 py-3 text-white sm:px-6">
        <Link href={`/learn/${language}/games/${theme}`} className="rounded-full p-2 text-white/70 hover:bg-white/10" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="text-sm font-semibold">Maze Chase</div>
          <div className="text-[11px] text-white/50">Level {level} of {LEVELS.length} · {solvedInLevel}/{LEVELS[level - 1].answers} · {score.toLocaleString()} pts</div>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart key={i} className={`h-5 w-5 ${i < lives ? "fill-rose-500 text-rose-500" : "text-white/15"}`} />
          ))}
        </div>
      </header>

      <FeedbackRibbon kind={feedback} />

      <div className="flex flex-1 flex-col items-center bg-gradient-to-b from-[#241452] to-[#120a2a] px-3 py-4">
        {current && status === "playing" && (
          <div className="mb-3 flex w-full max-w-[620px] flex-col items-center gap-1 rounded-2xl bg-white/10 px-4 py-3 text-white backdrop-blur">
            <span className="text-xs font-medium uppercase tracking-wide text-white/60">Find the picture for</span>
            <button
              onClick={() => speak(current.term)}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-2xl font-extrabold leading-none hover:bg-white/10 sm:text-3xl"
            >
              {current.term}
              <Volume2 className="h-5 w-5 text-white/70" />
            </button>
          </div>
        )}

        <div ref={boardRef} className="relative touch-none select-none overflow-hidden rounded-2xl shadow-2xl" style={{ width: boardW, height: boardH, background: "#160c33" }}>
          {/* walls */}
          {maze.grid.map((row, r) => row.split("").map((ch, c) => ch === "#" ? (
            <div key={`${r}-${c}`} className="absolute rounded-[3px]" style={{ left: px(c), top: px(r), width: cell, height: cell, background: "linear-gradient(135deg,#3b2a7a,#2a1c5c)", boxShadow: "inset 0 0 0 1px rgba(124,92,255,0.35)" }} />
          ) : null))}

          {/* dots */}
          {Array.from(dots).map((k) => {
            const [r, c] = k.split(",").map(Number);
            return <div key={k} className="absolute rounded-full bg-amber-200/80" style={{ left: px(c) + cell / 2 - dotSize / 2, top: px(r) + cell / 2 - dotSize / 2, width: dotSize, height: dotSize }} />;
          })}

          {/* power-ups */}
          {powerups.map((u, i) => (
            <div key={i} className="absolute z-[6] flex items-center justify-center" style={{ left: px(u.c), top: px(u.r), width: cell, height: cell }}>
              {u.kind === "star" && <Star className="animate-pulse text-amber-300" style={{ width: cell * 0.6, height: cell * 0.6 }} fill="currentColor" />}
              {u.kind === "freeze" && <Snowflake className="animate-pulse text-sky-300" style={{ width: cell * 0.6, height: cell * 0.6 }} />}
              {u.kind === "heart" && <Heart className="animate-pulse text-rose-400" style={{ width: cell * 0.58, height: cell * 0.58 }} fill="currentColor" />}
            </div>
          ))}

          {/* answer tiles */}
          {answers.map((a, i) => a.gone ? null : (
            <div key={i} className="absolute z-[8] flex items-center justify-center" style={{ left: px(a.c), top: px(a.r), width: cell, height: cell }}>
              <div className="relative overflow-hidden rounded-xl bg-white ring-[3px] ring-amber-300" style={{ height: cell * 2.3, width: cell * 2.3, boxShadow: "0 6px 18px rgba(0,0,0,0.5)" }}>
                {a.item.image ? <Image src={a.item.image} alt="" fill sizes="160px" className="object-cover" /> : null}
              </div>
            </div>
          ))}

          {/* player */}
          <div className="absolute z-10" style={{ left: 0, top: 0, width: cell * 0.82, height: cell * 0.82, margin: cell * 0.09, transform: `translate(${px(player.c)}px, ${px(player.r)}px) rotate(${DIR_DEG[facing]}deg)`, transition: `transform ${STEP_MS}ms linear` }}>
            <div className="pac h-full w-full" />
          </div>

          {/* enemies */}
          {enemies.map((e, i) => (
            <div key={i} className="absolute z-10" style={{ left: 0, top: 0, width: cell * 0.8, height: cell * 0.8, margin: cell * 0.1, transform: `translate(${px(e.c)}px, ${px(e.r)}px)`, transition: `transform ${STEP_MS * 2}ms linear` }}>
              <Ghost color={freezeActive ? "#7dd3fc" : scared ? "#3b82f6" : ENEMY_COLOR[e.type]} scared={scared} frozen={freezeActive} />
            </div>
          ))}

          {/* freeze shimmer */}
          {freezeActive && <div className="pointer-events-none absolute inset-0 z-[5]" style={{ background: "radial-gradient(circle at 50% 40%, rgba(125,211,252,0.12), transparent 70%)" }} />}

          {status === "loading" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#120a2a]/95 px-6 text-center">
              <div className="mb-3 text-4xl">🐾</div>
              <h2 className="font-heading text-lg font-bold text-white">Loading pictures…</h2>
              <div className="mt-4 h-2 w-56 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-amber-400 transition-[width] duration-200" style={{ width: `${Math.round(loadPct * 100)}%` }} />
              </div>
              <p className="mt-2 text-xs text-white/50">{Math.round(loadPct * 100)}%</p>
            </div>
          )}

          {(status === "won" || status === "lost") && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-y-auto bg-[#120a2a]/92 px-5 py-6 text-center backdrop-blur-sm">
              <div className="mb-1 text-5xl">{status === "won" ? "🏆" : "👾"}</div>
              <h2 className="font-heading text-2xl font-bold text-white">{status === "won" ? "You beat every level!" : "Caught!"}</h2>
              <p className="mt-1 text-sm text-white/70">{score.toLocaleString()} points · reached level {level}</p>

              <div className="mt-4 w-full max-w-[320px] rounded-2xl bg-white/10 p-3 text-left">
                <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
                  <Trophy className="h-4 w-4" /> Top scores · {theme}
                </div>
                {board === null ? (
                  <p className="px-1 py-2 text-xs text-white/50">Loading scores…</p>
                ) : board.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-white/50">Be the first on the board! 🎉</p>
                ) : (
                  <ol className="space-y-1">
                    {board.slice(0, 5).map((row, i) => (
                      <li key={row.user_id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${i === myRank ? "bg-amber-400/20 text-amber-100" : "text-white/80"}`}>
                        <span className={`w-5 text-center text-xs font-bold ${i === 0 ? "text-amber-300" : "text-white/40"}`}>{i + 1}</span>
                        <span className="flex-1 truncate">{i === myRank ? `${row.name} (You)` : row.name}</span>
                        <span className="font-semibold tabular-nums">{row.best_score.toLocaleString()}</span>
                      </li>
                    ))}
                    {myRank >= 5 && board[myRank] && (
                      <li className="mt-1 flex items-center gap-2 rounded-lg bg-amber-400/20 px-2 py-1.5 text-sm text-amber-100">
                        <span className="w-5 text-center text-xs font-bold">{myRank + 1}</span>
                        <span className="flex-1 truncate">{board[myRank].name} (You)</span>
                        <span className="font-semibold tabular-nums">{board[myRank].best_score.toLocaleString()}</span>
                      </li>
                    )}
                  </ol>
                )}
                <Link href={`/learn/${language}/games/${theme}/leaderboard`} className="mt-2 block rounded-lg px-2 py-1.5 text-center text-xs font-semibold text-amber-300 hover:bg-white/5">
                  View full leaderboard →
                </Link>
              </div>

              <div className="mt-5 flex gap-3">
                <button onClick={restart} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 font-semibold text-[#160c33] hover:bg-amber-300"><RotateCcw className="h-4 w-4" /> Play again</button>
                <Link href={`/learn/${language}/games/${theme}`} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 font-semibold text-white hover:bg-white/10">More games</Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden" style={{ width: 168 }}>
          <span />
          <DPad dir="up" onHold={holdDir} onRelease={releaseDir}><ChevronUp className="h-6 w-6" /></DPad>
          <span />
          <DPad dir="left" onHold={holdDir} onRelease={releaseDir}><ChevronLeft className="h-6 w-6" /></DPad>
          <DPad dir="down" onHold={holdDir} onRelease={releaseDir}><ChevronDown className="h-6 w-6" /></DPad>
          <DPad dir="right" onHold={holdDir} onRelease={releaseDir}><ChevronRight className="h-6 w-6" /></DPad>
        </div>
        <p className="mt-3 hidden text-xs text-white/50 sm:block">Arrow keys / WASD to move · ⭐ eat the ghosts · ❄ freeze them · ❤ extra life · swipe on touch</p>
      </div>

      <style jsx>{`
        .pac {
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(251, 191, 36, 0.6);
          animation: chomp 0.28s steps(1, end) infinite;
        }
        @keyframes chomp {
          0%, 100% { background: conic-gradient(from -40deg, transparent 0 80deg, #fbbf24 80deg 360deg); }
          50% { background: conic-gradient(from -12deg, transparent 0 24deg, #fbbf24 24deg 360deg); }
        }
      `}</style>
    </div>
  );
}

function Ghost({ color, scared, frozen }: { color: string; scared: boolean; frozen: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_0_8px_rgba(0,0,0,0.4)]">
      <path d="M10 52 a40 40 0 0 1 80 0 V92 l-13 -11 l-13 11 l-14 -11 l-13 11 l-14 -11 Z" fill={color} />
      <circle cx="37" cy="46" r="12" fill="#fff" />
      <circle cx="63" cy="46" r="12" fill="#fff" />
      <circle cx="40" cy="48" r="6" fill="#160c33" />
      <circle cx="66" cy="48" r="6" fill="#160c33" />
      {scared || frozen ? (
        <circle cx="50" cy="72" r="5" fill="#160c33" />
      ) : (
        <path d="M32 70 l7 -7 l7 7 l7 -7 l7 7 l7 -7 l7 7" fill="none" stroke="#160c33" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      )}
    </svg>
  );
}

function DPad({ dir, onHold, onRelease, children }: { dir: Dir; onHold: (d: Dir) => void; onRelease: (d: Dir) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => { e.preventDefault(); onHold(dir); }}
      onPointerUp={() => onRelease(dir)}
      onPointerLeave={() => onRelease(dir)}
      onPointerCancel={() => onRelease(dir)}
      className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white active:bg-white/25"
    >
      {children}
    </button>
  );
}
