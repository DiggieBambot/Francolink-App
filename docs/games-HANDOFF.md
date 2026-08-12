# Games — Handoff

Repo: `francolink` (Next.js App Router + Supabase). Branch `main`.
Written 2026-08-01, from the state of the code at commit `2f435e9`.

This document hands off the **kids' vocabulary games** section so another agent can
keep building it without re-deriving the architecture.

---

## 1. What exists today

Five mini-games, played over a *theme* (Animals, Food, …) inside a *language* course.

Route shape (student area):

```
/learn/[language]/games                          → theme picker (lobby)
/learn/[language]/games/[theme]                  → game picker
/learn/[language]/games/[theme]/maze-chase       → Pac-Man-style, the flagship
/learn/[language]/games/[theme]/quiz-show
/learn/[language]/games/[theme]/picture-quiz
/learn/[language]/games/[theme]/listen-find
/learn/[language]/games/[theme]/memory-match
/learn/[language]/games/[theme]/leaderboard
```

There is also a legacy `/games` entry at `src/app/(student)/games/page.tsx`.

### Key files

| Path | Role |
|---|---|
| `src/lib/games/themes.ts` | The 15 `THEMES` (slug/label/emoji/gradient/keywords), `classifyVocab()`, `GAME_BLOCKLIST`, `themeIcon()` |
| `src/lib/games/curated/` | Hand-curated, image-verified word sets — one file per theme + `index.ts` registry |
| `src/components/games/*.tsx` | The five game components + `game-shell.tsx` |
| `src/app/api/games/pool/route.ts` | Serves the word pool a game plays with |
| `src/app/api/games/themes/route.ts` | Theme list + eligible-item counts |
| `src/app/api/games/score/route.ts` | Records a finished game |
| `src/app/api/games/leaderboard/route.ts` | Reads the board |
| `supabase/migrations/20260712_game_scores.sql` | `game_scores` table, RLS, `game_leaderboard()` RPC |
| `public/games/<theme>/<slug>.png` | Curated artwork, committed to the repo |
| `scripts/generate-curated-images.mjs` | Generic image generator for any curated theme |
| `scripts/generate-curated-body.mjs` | Special-case generator (one base figure + highlight rings) |

---

## 2. The two vocabulary sources — the central design decision

`GET /api/games/pool?lang=french&theme=food&count=10` resolves in this order:

1. **Curated set** (only when `langCode(lang) === "fr"`, since curated terms are French).
   `curatedPool(themeSlug)` from `src/lib/games/curated/index.ts`. Returns `null`
   if the theme isn't registered or has fewer than 4 items. Response carries
   `source: "curated"`.
2. **Lesson-derived fallback** — scans `lessons.content.vocabulary` across all
   published courses for that language, keeps items that have `image_url`/`image`
   and a `term` ≤ 28 chars, buckets them with `classifyVocab(translation)`,
   dedupes by term, Fisher–Yates shuffles.

**Why curated exists:** the lesson-derived pool produced ambiguous pictures and
confusable pairs (leopard/cheetah, frog/toad), which a matching game can't fairly
test. The curated files encode the rules — read the header comment in
`src/lib/games/curated/animals.ts`, it is the canonical statement of the standard:
visually distinct subjects only, one clear subject per picture, verified artwork,
optional `annotate` ring for busy pictures.

### Curated file shape

```ts
export interface CuratedItem {
  slug: string;          // URL-safe id AND the image filename stem
  term: string;          // French, with article: "la voiture"
  translation: string;   // English: "car"
  prompt: string;        // generation prompt for the image
  annotate?: CuratedAnnotation; // optional ring/arrow overlay
}
export function curatedImage(slug: string) { return `/games/travel/${slug}.png`; }
```

`animals.ts` is the only file that *declares* the types; every other theme does
`import type { CuratedItem } from "./animals"`.

### Curated coverage (11 of 15 themes)

| Theme | Curated | Images in `public/games/` |
|---|---|---|
| animals | ✅ | 20 |
| clothes | ✅ | 15 |
| food | ✅ | 15 |
| home | ✅ | 14 |
| body | ✅ (base + rings) | 13 (incl. `_base.png`) |
| nature | ✅ | 12 |
| sports | ✅ | 12 |
| travel | ✅ | 12 |
| colors | ✅ | 11 |
| numbers | ✅ | 10 |
| weather | ✅ | 10 |
| **family** | ❌ | — |
| **places** | ❌ | — |
| **actions** | ❌ | — |
| **time** | ❌ | — |

Themes are defined in `themes.ts` at lines ~28–190; the four uncurated ones still
fall back to lesson-derived vocab.

---

## 3. Generating artwork for a new curated theme

The loop that produced the 11 existing themes:

1. Write `src/lib/games/curated/<theme>.ts` — 10–14 items, each with a `prompt`.
   Enforce the "no confusable pairs" rule while choosing words.
2. Register it in `src/lib/games/curated/index.ts` (import + `REGISTRY` entry).
3. Generate:

```bash
node --env-file=.env.local scripts/generate-curated-images.mjs --theme=<theme>
```

4. **Eyeball every PNG.** Regenerate individual bad ones:

```bash
node --env-file=.env.local scripts/generate-curated-images.mjs --theme=<theme> --only=voiture,bus --seed=7 --force
```

5. Commit the PNGs (they are version-controlled on purpose — fast, stable, shared
   by all five games).

Generator details: Cloudflare Workers AI, model `@cf/black-forest-labs/flux-1-schnell`,
512×512, `num_steps: 6`, 400 ms throttle. Needs `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN` in `.env.local`. The script parses the TS file with a regex
and `eval`s the array — so keep the literal form `export const NAME: CuratedItem[] = [ … \n];`
or the loader breaks.

`generate-curated-body.mjs` is deliberately different: one base character
illustration is generated once (cached at `public/games/body/_base.png`) and each
body part gets a copy with a highlight ring composited on. Use `--regen-base` to
redraw the figure. That is the pattern to copy for any theme where the subject is
*part of* a scene rather than the whole picture.

---

## 4. Scoring & leaderboard

- `POST /api/games/score` with `{ game, theme, language, score, level, won }`.
  Whitelist of `game` values lives in the route: `maze-chase`, `memory-match`,
  `picture-quiz`, `listen-find`, `quiz-show` — **add new games to that set** or
  scores silently 400.
- It **fails soft**: a DB error returns `ok:false` with HTTP 200 so a missing
  migration never breaks gameplay. Don't "fix" that into a hard error.
- Reads go through the `game_leaderboard(game, theme, language, limit)`
  `SECURITY DEFINER` RPC, which joins `users.name`/`avatar_url` — RLS only lets a
  player read their *own* rows directly.

---

## 5. Maze Chase (the flagship, `src/components/games/maze-chase.tsx`, ~34 KB)

Most-invested game; read this before touching it.

- Grid mazes as string arrays in `MAZES` (13 rows × 15 cols), precomputed into
  `MAZE_INFOS` by `buildInfo()` (open cells + BFS distance matrix).
- `LEVELS` config: answers per level, enemy count, enemy types.
- Three enemy AIs: `chaser`, `ambusher`, `roamer` (`ENEMY_COLOR` per type).
- Tuning constants, all deliberately kid-friendly — `STEP_MS = 200` (calm cadence),
  `MIN_ENEMY_EVERY = 3` (enemies never faster than this), `START_LIVES = 3`,
  `MAX_LIVES = 5`.
- Power-ups: `star` (scare, `SCARE_MS = 5000`), `freeze` (`FREEZE_MS = 4500`), `heart`.
- Answer tiles placed by `pickAnswerCells()`; power-ups by `pickFarCells()` with a
  `minDist` so they aren't trivially adjacent.
- Fetches `count=30` from the pool (the largest consumer — a theme with a thin
  pool degrades here first).
- `DIR_DEG` drives the Pac-Man mouth rotation — commit `bdfbe8c` fixed this;
  don't regress it.

Other games' pool appetites: quiz-show / picture-quiz / listen-find request
`ROUND_COUNT × OPTIONS`; memory-match requests `PAIR_COUNT × 2` (6 pairs → 12).
`MIN_ITEMS = 6` in the themes API exists because of memory-match.

---

## 6. Known gaps / suggested next steps

**A. The lobby ignores curated sets — highest-value fix.**
`src/app/(student)/learn/[language]/games/page.tsx` and
`src/app/api/games/themes/route.ts` both compute theme counts *only* from
lesson-derived vocab and hide any theme under `MIN_ITEMS = 6`. Neither imports
`curatedPool`. So a theme that is fully curated and playable can still be hidden
from the picker if the French lessons happen not to contain 6 classified,
image-bearing words for it. Fix: make both count `max(curatedCount, lessonCount)`
for French. Note the count logic is **duplicated** between those two files —
worth extracting into `src/lib/games/` while fixing.

**B. Curated sets are French-only.** `pool/route.ts` gates on `code === "fr"`.
Spanish/German/English courses always get the fuzzy lesson pool. Extending means
either per-language term fields on `CuratedItem` or per-language curated dirs
(images are language-neutral and could be shared).

**C. Four themes uncurated:** family, places, actions, time. `actions` and `time`
are the hard ones — verbs and abstract time words resist single-subject flashcard
art; much of `time` is already in `GAME_BLOCKLIST` as non-picturable. Consider the
`generate-curated-body.mjs` compositing approach, or dropping those themes from
the games surface entirely.

**D. Count duplication / N+1 reads.** Both the lobby page and the themes API pull
*every published lesson's* `content` and classify in JS on each request. Fine at
current scale, an obvious cache/materialize target later.

**E. No games use `game_shell.tsx` uniformly** — check before adding a sixth game;
maze-chase in particular rolls its own chrome.

---

## 7. Working conventions observed in this codebase

- Every file opens with a `// path` line and a short comment explaining *why* it
  exists. Match that.
- Commits are scoped: `feat(games): …`, `fix(maze-chase): …`.
- Curated artwork is committed to git, not uploaded to Supabase Storage. Theme
  *icons* are the exception — they're served from Supabase Storage via
  `themeIcon()` (`.../lesson-images/theme-icons/<slug>.png`).
- Fail soft in game paths: a backend problem should never blank the game.

## 8. Uncommitted work at handoff time

Not games-related, but present in the working tree — don't be confused by it:
modified `src/app/api/homework/assign/route.ts` and `src/lib/email/transactional.ts`,
plus untracked grammar/lesson scripts and `docs/PRD-google-play-launch.md`.
The games code itself is fully committed as of `6f9bf08` (curated Travel, Home,
Nature, Weather, Sports).
