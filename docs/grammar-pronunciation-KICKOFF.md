# Grammar & Pronunciation — build kickoff brief

Paste-in context for a fresh session. Goal: build **French Grammar** (lessons +
homework) and **French Pronunciation** (lessons) to a premium, expert-pedagogy
standard — as if a team of language-teaching experts authored it.

## 0. Read these first (in the repo)
- `docs/grammar-pronunciation-plan.md` — the signed-direction plan: locked
  decisions, pedagogical principles, grammar lesson shape, pronunciation lesson
  shape, **full A1–C1 grammar syllabus**, pronunciation inventory, build order.
  **Build from the top of the A1 grammar syllabus first.**
- `docs/integration-hooks.md` — the reusable services to plug into (push,
  analytics events, streak, connections).
- `AGENTS.md` — ⚠️ this is a **modified Next.js**; APIs/conventions may differ
  from training data. Read the relevant guide in `node_modules/next/dist/docs/`
  before writing framework code.

## 1. Environment
- Repo: `/Users/pc/Documents/Projects/francolink` (sibling of the Digistack cwd —
  `cd` there first for any shell command).
- Stack: Next.js (App Router, modified) · Supabase (Postgres + RLS + service
  role) · Stripe · next-intl (locales en/fr/ar, `localePrefix: as-needed`) · PWA.
- Deploy: **git push to `main` only** (Vercel builds on push). Don't rely on the
  Vercel MCP/CLI here (wrong account / unauthenticated).
- After code changes: `npx tsc --noEmit` and check only newly-touched files (the
  repo has many pre-existing TS errors; don't chase them).

## 2. UI / quality standards (non-negotiable)
- Every page uses the brand `primary-*` / `secondary-*` theme tokens and shows the
  role-appropriate navbar. No raw hex, no off-brand components.
- Pedagogy must read as expert-authored: form-follows-use, input → noticing →
  controlled practice → free production; real audio for pronunciation (not IPA
  footnotes); "common mistakes" sections that reflect real learner errors.
- Production model (locked): **curated syllabus + AI fill + human review** — the
  ordering/contrasts are hand-authored in the plan doc; AI drafts examples /
  exercises / common-mistakes per spec; human review before publish (same as the
  Daily News pipeline).

## 3. Content data model (what a lesson IS)
- Lessons live in the **`tutor_lessons`** table; the actual content is the
  `content` JSON column following the **v2 schema in `src/lib/lessons/types.ts`**
  (`SectionKind`, `Skill` — note `Skill` already includes `"grammar"`).
  Published lessons have `status = 'published'`.
- Existing `SectionKind`s to reuse for grammar: `vocabulary_with_examples`,
  `fill_in_blank_dialogue(_extended)`, `word_order`, `matching_qa`,
  `reading_comprehension`, `free_response`. The room/lesson renderer is
  `src/components/lesson-v2/` and exercise components already exist.
- Seed content lives under `src/lib/seed/french-*/unitN/*.ts` (see
  `src/lib/seed/french-a1/` for the pattern) and is loaded into `tutor_lessons`.
- **Placement (locked in the plan):** two new `/library` categories —
  `grammar` / `fr-grammar` and `pronunciation` / `fr-prononciation` — reusing the
  Daily News generate/review pipeline, tutor/student dual view, and Inworld TTS.

## 4. Homework (grammar has homework)
- Tables: **`homework_assignments`** and **`homework_submissions`**.
- Routes already exist: `src/app/api/homework/{assign,generate,review,save,submit}`.
- On submit, `/api/homework/submit` already: writes `homework_submissions`, emits
  the canonical **`homework_submitted`** analytics event, and calls
  **`recordActivity(userId, {kind:"homework"})`** (streak). Reuse this — a grammar
  homework just needs to create `homework_assignments` and flow through submit.

## 5. Reusable services to plug into (don't rebuild — see docs/integration-hooks.md)
- **Push a student:** `sendPush(userId, {title, body, deeplink})` from
  `@/lib/notifications/push` (VAPID env-driven; `notifyUser` also writes an inbox
  row). Prod needs `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in Vercel.
- **Analytics events:** client `trackEvent(kind, …)` (`@/lib/analytics/client`) or
  server `logActivity(userId, kind, …)` (`@/lib/analytics/activity`). Client kinds
  must be in `CLIENT_EMITTABLE_KINDS`. Admin funnels live at `/admin/growth`.
- **Streak / activity:** `recordActivity(userId, {kind})` from
  `@/lib/streak/record-activity` — the single hook any activity calls; advances
  the streak and emits the daily-activity signal. A completed grammar lesson /
  pronunciation quiz should call it (or its lesson route should).
- **Tutor↔student connections:** `getConnectionsFor(userId, "tutor"|"student")`
  from `@/lib/lessons/lesson-space`. Students can have multiple teachers;
  `tutor_students` is the source of truth (not `referred_by_tutor_id`, which is
  first-touch commission only).
- **TTS / audio:** existing `/api/tts` cache (Inworld). Pronunciation audio and
  minimal-pair models go through it — no new audio infra.

## 6. The one genuinely new interactive piece
Per the plan, the only new `SectionKind` to build is the **pronunciation
minimal-pair discrimination quiz** (listen-and-choose). Everything else reuses
existing section/exercise components. Pronunciation v1 = listen + discrimination
only (no record-yourself).

## 7. Build order (from the plan)
1. **Grammar category** end-to-end on 2–3 A1/A2 points (prove category +
   generation + review + dual view + homework), then scale down the A1 syllabus.
2. **Pronunciation category** — build the discrimination-quiz section kind, then
   curate from the inventory; audio via existing TTS.
3. **Cross-linking** — surface the matching grammar lesson from Daily News
   stories by tense/structure tag. Last.

## 8. Open questions to resolve at the start of the new chat
- Sign off / edit the **A1 grammar syllabus** in the plan doc (build from its top).
- **Scope:** French-only for v1, or also English grammar/pronunciation? (Plan
  leaves this open.)
- Confirm pronunciation v1 = discrimination quizzes only (no record-yourself).

## 9. Suggested first move for the new session
Read `docs/grammar-pronunciation-plan.md` + `docs/integration-hooks.md`, confirm
the A1 syllabus and scope with me, then produce a concrete implementation plan for
the **grammar category + first 2–3 A1 lessons + one homework**, wired to the
existing content model, homework flow, streak, and analytics — before writing code.
