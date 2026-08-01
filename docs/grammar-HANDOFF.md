# French Grammar — build handoff

Paste-in context for a fresh session. Covers **where the build stands**, **how to add
homework to the 47 lessons that lack it**, and **how to continue with C1 (and C2)**.

Read alongside:
- `docs/grammar-pronunciation-curriculum.md` — the pedagogical source of truth (A1–C1
  syllabus + pronunciation inventory).
- `docs/grammar-pronunciation-KICKOFF.md` — original brief (data model, reusable services).
- `docs/integration-hooks.md` — push, analytics, streak, connections.
- `AGENTS.md` — ⚠️ modified Next.js; read `node_modules/next/dist/docs/` before writing
  framework code. The repo has ~100 pre-existing TS errors — ignore those, only check
  files you touch.

---

## 1. Current state (verified)

**48 grammar lessons live and published** at `https://app.francolink.net/library/fr-grammar`:

| Level | Count | Status |
|---|---|---|
| A1 | 14 | ✅ complete |
| A2 | 13 | ✅ complete |
| B1 | 11 | ✅ complete |
| B2 | 10 | ✅ complete |
| C1 | 0 | ⬜ **not started** (8 points specced in curriculum doc) |
| C2 | 0 | ⬜ **not specced** — see §4 |

**Homework: only 1 of 48 lessons has homework** (`fr-grammar-a1-01-subject-pronouns-etre`).
That is the main gap — see §3.

Everything is committed and deployed. Grammar commits in history:
`6b70f68`, `9a4ec75`, `d3e1120`, `7d0d3d7`, `9e36a89`, `7cfd129`.

---

## 2. How the system works

### Content model
A lesson is a v2 `Lesson` object (`src/lib/lessons/types.ts`) stored in
`tutor_lessons.content` (JSON). No schema changes were ever needed.

**Lesson shape used by every grammar lesson** (the locked 5-part arc):
1. `reading_comprehension` — "In context" (target structure in `**bold**`)
2. `grammar_explainer` — the pattern (**custom section kind built for this project**)
3. `matching_qa` — recognition drill
4. `fill_in_blank_dialogue` — controlled practice
5. `word_order` — production
6. `free_response` — "Produce it"

### The `grammar_explainer` section (custom)
Renderer: `src/components/lesson-v2/sections/grammar-explainer.tsx`. Fields:

```ts
{
  kind: "grammar_explainer",
  number, title, student_instruction, tutor_instruction,
  explanation, explanation_translation,
  table:           { headers: string[], speak_col?: number, rows: [{cells: string[]}] },
  table_secondary: { ...same },
  examples:        [{ text, translation?, note? }],
  common_mistakes: [{ wrong, right, note? }],   // red ✗ → green ✓ cards
  tips:            string[],                     // green "Astuces & mémo" block
  exceptions:      [{ title, detail }],          // indigo "Exceptions & à retenir"
}
```
`**bold**` renders as brand-coloured `<strong>` in `explanation`, `note`, `tips`,
`exceptions`. **Single `*asterisks*` are NOT supported** — they render literally.

### Files
```
src/lib/seed/fr-grammar/           # 50 files — lesson content (GITIGNORED, see below)
  a1-01-etre.ts … b2-10-ne-expletif.ts
  index.ts                          # frGrammarLessons[] — add new lessons here
  homework.ts                       # grammarHomework[] — HomeworkSpec[]
scripts/seed-fr-grammar.mts        # seeder — untracked (local only, never committed)
src/components/lesson-v2/sections/grammar-explainer.tsx
src/lib/lessons/syllabus-order.ts  # pedagogical ordering + "Lesson N" badges
src/lib/lessons/categories.ts      # fr-grammar category, routed by source_url
src/components/library/lesson-card.tsx   # concept tile + topic subtitle
```

⚠️ **`src/lib/seed/` and `src/app/api/seed/` are gitignored** (`.gitignore:42-43`).
Lesson content lives in the **database**, not in deployed code. Editing seed files and
re-seeding is the whole workflow — no commit needed for content changes. Only
**component/logic** changes need committing + pushing.

### Seeding
```bash
cd /Users/pc/Documents/Projects/francolink
npx tsx scripts/seed-fr-grammar.mts            # status=review (hidden)
npx tsx scripts/seed-fr-grammar.mts --publish  # status=published (live)
```
Idempotent upsert by slug. Also upserts homework from `grammarHomework`.
(There is no `CRON_SECRET` locally, so the `/api/seed/fr-grammar` route can't be used
without an admin session — use the script.)

### Ordering
`syllabus-order.ts` sorts by the level + number encoded in the slug
(`fr-grammar-b2-07-…` → B2, 07). **Slug naming must follow `fr-grammar-<level>-<NN>-<name>`**
or the lesson sorts last. Cards show a "Lesson N" badge in syllabus categories.

---

## 3. TASK A — Homework for the remaining 47 lessons

### Status
`lesson_homework` has exactly **one** grammar row (être). Every other lesson needs one.

### The flow (already built — do not rebuild)
```
author spec in homework.ts  →  seed script upserts to lesson_homework (published+enabled)
  →  TUTOR opens lesson, uses "Send homework" panel  →  /api/homework/assign
  →  STUDENT sees HomeworkPanel on the lesson  →  /api/homework/submit
       ↳ already emits `homework_submitted` + calls recordActivity() (streak)
```
Routes: `src/app/api/homework/{generate,save,assign,review,submit}/route.ts`
UI: `src/components/homework/homework-panel.tsx` (student),
`review-card.tsx` (tutor, auto-grades), `homework-send-panel.tsx` (tutor assigns).

⚠️ **Homework is assignment-gated.** A student only sees it after a tutor sends it.
It will NOT appear on the public lesson page. That's by design, not a bug.

### Question types (`src/lib/homework/types.ts`)
```ts
type HomeworkQuestionType = "short" | "long" | "fill_blank" | "mcq" | "reorder";

interface HomeworkQuestion {
  prompt: string;
  prompt_translation?: string;
  hint?: string;
  type: HomeworkQuestionType;
  options?: string[];   // mcq: choices | reorder: scrambled tokens
  answer?: string;      // fill_blank/mcq/reorder — enables auto-grading
  sentence?: string;    // fill_blank: sentence containing "___"
}
```
`short`/`long` = free text, tutor-graded. The other three self-check via
`answerMatches()` (case/accent/punctuation-insensitive) and show ✓/✗ to the tutor.

### Spec format (`src/lib/seed/fr-grammar/homework.ts`)
```ts
export const grammarHomework: HomeworkSpec[] = [
  {
    lesson_slug: "fr-grammar-a1-01-subject-pronouns-etre",
    title: "Homework — être",
    instructions: "Complete the exercises, check your answers, then submit to your tutor.",
    questions: [ /* HomeworkQuestion[] */ ],
  },
];
```
Read the existing être entry as the model. **Recommended shape per lesson** (~7 questions):
2 × `fill_blank`, 2 × `mcq`, 2 × `reorder`, 1 × `long` (free production, tutor-graded).

### Rules to follow when authoring homework
1. **Derive from the lesson.** Every question must test something that lesson taught —
   ideally its `common_mistakes` (that's where the pedagogical value is).
2. **`reorder` tokens must exactly match the answer.** Space-separated; keep elisions
   whole (`j'ai`, `c'est`, `qu'il`, `n'en`). Validate — see §5.
3. **Keep `answer` unambiguous.** One correct string. Avoid answers where a synonym
   would also be right.
4. **No English TTS concerns here** — homework has no audio.
5. Add each new spec to `grammarHomework[]`, then re-seed.

### Suggested batching
47 lessons × ~7 questions is a lot for one session. Do **one level per batch**
(A1 first: 13 remaining), validate, seed, verify, then continue.

---

## 4. TASK B — C1 and C2

### C1 — specced, ready to build
`docs/grammar-pronunciation-curriculum.md` §C1 lists **8 points**:
1. Passé simple (recognition; literary/news)
2. Subjonctif imparfait (recognition only)
3. Advanced concordance des temps across registers
4. Nominalisation (verb→noun, formal writing)
5. Register shifts (soutenu ↔ familier ↔ argot)
6. Advanced argumentation connectors (néanmoins, or, en effet, quant à, dès lors)
7. Inversion stylistique (after ainsi, peut-être, sans doute, à peine)
8. Nuanced modality (devoir/pouvoir shades)

**C1 is recognition + nuance, not production.** Several points (passé simple, subjonctif
imparfait) should be taught for **reading comprehension only** — say so explicitly in the
lesson, as B2-10 (ne explétif) already does. Adjust the exercise mix accordingly: more
`reading_comprehension` and `matching_qa`, less `word_order`.

Slugs: `fr-grammar-c1-01-passe-simple` … `fr-grammar-c1-08-nuanced-modality`.
Level field: `"C1"`. `syllabus-order.ts` already handles C1 (regex covers `[abc][12]`).

### ⚠️ C2 — NOT specced
**The curriculum document contains no C2 section.** Before building C2 lessons you must
first author the C2 syllabus (points, order, contrasts, signature errors) and add it to
`docs/grammar-pronunciation-curriculum.md`, the same way A1–C1 were done. Do not
improvise C2 lessons without agreeing the syllabus with the user first.

Also note `syllabus-order.ts`'s `LEVEL_RANK` includes C2, but its `SLUG_ORDER_RE`
(`/-([abc][12])-(\d{1,2})-/i`) **does match `c2`**, so ordering will work once content exists.

---

## 5. Quality gates — run these before every seed

### Word-order token validation (catches the most common authoring bug)
```bash
cd /Users/pc/Documents/Projects/francolink
node -e '
const fs=require("fs");
const norm=s=>s.trim().toLowerCase().replace(/[‘’ʼʻ]/g,"\x27").replace(/[.,!?;:]/g,"").replace(/\s+/g," ");
const tok=s=>norm(s).split(/\s+/).filter(Boolean).sort();
let bad=0,total=0;
for(const f of fs.readdirSync("src/lib/seed/fr-grammar").filter(f=>/^[abc][12]-/.test(f))){
  const t=fs.readFileSync("src/lib/seed/fr-grammar/"+f,"utf8");
  const re=/scrambled: "([^"]+)", correct: "([^"]+)"/g; let m;
  while(m=re.exec(t)){ total++;
    const a=tok(m[1]),b=tok(m[2]);
    if(!(a.length===b.length&&a.every((x,i)=>x===b[i]))){bad++;console.log("MISMATCH["+f+"]",JSON.stringify(a),JSON.stringify(b));}
  }
}
console.log(bad===0?("✓ ALL "+total+" word_order valid"):(bad+" broken"));'
```
Currently **202/202 valid**. The recurring bug: a leftover duplicate word in `scrambled`
(e.g. `"ai j'ai mangé"`), or splitting an elision (`"j' ai"` can never rebuild `j'ai`).

### Stray single asterisks (they render literally)
```bash
grep -oP '(?<!\*)\*(?!\*)' src/lib/seed/fr-grammar/*.ts | wc -l   # must be 0
```
Fix with: `perl -i -pe 's/\*\*/\x00/g; s/\*//g; s/\x00/**/g' <file>`

### Typecheck (only your files — repo has ~100 pre-existing errors)
```bash
npx tsc --noEmit 2>&1 | grep -E "seed/fr-grammar|grammar-explainer|homework" || echo "✓ clean"
```

### `speak: false` on English-text drills
`matching_qa` sections whose text is English must set `speak: false`, or students get
TTS buttons reading English aloud. Check any new matching drill.

---

## 6. Known quirks (will waste your time otherwise)

| Quirk | Detail |
|---|---|
| **Local dev HMR is unreliable** for `grammar-explainer.tsx` / `lesson-card.tsx` — edits often don't hot-reload. Verify on the deployed site instead. | Confirmed repeatedly |
| **Category page is ISR-cached** (`revalidate = 300` in `src/app/library/[category]/page.tsx`). New lessons take up to 5 min to appear there. Lesson pages are `force-dynamic` and update instantly. | |
| **The site is a PWA** — the browser may serve a stale service-worker copy. Verify with `curl`, or hard-refresh. | |
| **`scan-duplicate-blank-answers.mjs` false-positives on transformation exercises.** It flags 3 grammar lessons (Reflexive verbs, Direct object pronouns, Noun gender) — all correct as written (`Nous nous couchons`; `Il connaît les élèves → Il les connaît`). Do not "fix" these. | |
| **Deploy = `git push` to main only.** Vercel MCP/CLI points at the wrong account. | |

---

## 7. Suggested first move for the new session

1. Read `docs/grammar-pronunciation-curriculum.md` (at minimum the level you're building).
2. Read `src/lib/seed/fr-grammar/homework.ts` and `a1-01-etre.ts` as format models.
3. **Confirm with the user**: homework first or C1 first? And flag that **C2 has no
   syllabus yet** and needs authoring before any C2 lesson can be built.
4. Work in batches of one level (or ~5 lessons), running §5 gates before each seed.
