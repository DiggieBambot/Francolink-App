# FrancoLink — project context for a fresh AI session

Paste this whole file (or point the model at it) to orient a new session before it
modifies or extends this codebase. It's an index, not a full spec — it tells you
what exists and which doc to read next for the part you're touching.

## What this is

FrancoLink is a language-learning platform (French-first, expanding to other
languages) with two user types:
- **Tutors** invite students via a unique code/link, teach live in shared rooms,
  assign homework, and earn referral commission on student subscriptions.
- **Students** create their own accounts (required for GDPR/PECR — tutors never
  create accounts on a student's behalf), self-study via lessons/games, take a
  placement test, and optionally connect to one or more tutors.

A student can be connected to **multiple tutors** simultaneously (many-to-many via
`tutor_students`; commission attribution is separately first-touch via
`users.referred_by_tutor_id` — don't conflate the two).

## ⚠️ Read this first

`AGENTS.md` (repo root): **this is a modified Next.js** — APIs and conventions may
differ from training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing framework-level code (routing,
middleware, caching).

The repo has ~100 pre-existing TypeScript errors unrelated to any single feature.
Run `npx tsc --noEmit` after changes and only check **files you touched** — don't
try to fix unrelated pre-existing errors.

## Environment

- Repo root: `/Users/pc/Documents/Projects/francolink` — if your shell starts
  elsewhere, `cd` here first.
- Stack: Next.js App Router (modified) · Supabase (Postgres + RLS + service role
  client for cross-user/admin reads) · Stripe (subscriptions/checkout) ·
  `next-intl` (locales `en`/`fr`/`ar`, `localePrefix: "as-needed"` — the
  **default-locale root `/` is served by `src/app/[locale]/page.tsx`**, not
  `src/app/(student)/page.tsx`, which is a shadowed/legacy file — don't edit the
  wrong one) · PWA (installable, push notifications) · `web-push` for Web Push ·
  OpenAI/Gemini for content generation.
- Deploy: **`git push` to `main` only** — Vercel builds on push. There is no
  reliable Vercel CLI/MCP session in this environment; don't assume you can read
  or set Vercel env vars — ask the user to check/set them and tell them exactly
  what to paste.
- Dev server: `npm run dev`. `.claude/launch.json` has a preview config, but
  automated preview tooling in this environment has previously booted the wrong
  sibling project — if that happens, just run `npm run dev` directly instead of
  fighting the tool.

## Data model — the essentials

Supabase Postgres. Key tables (there are more; these are the load-bearing ones):

| Table | Purpose |
|---|---|
| `users` | Single table for students, tutors, and admins — role-gated by `role` (`USER`/`TUTOR`/`ADMIN`). Also carries `tutor_invite_code`, `referred_by_tutor_id` (first-touch commission only), `payout_details` (jsonb), streak fields (`current_streak`, `longest_streak`, `last_activity_date`), `signup_source`, `timezone`, subscription/Stripe fields. |
| `tutor_students` | Many-to-many tutor↔student connections (`status: 'active'`). **Source of truth for "who's in whose class"** — not `referred_by_tutor_id`. |
| `tutor_lessons` | Lessons. Content is a v2 `Lesson` JSON object in the `content` column — see `src/lib/lessons/types.ts` for the full schema (`SectionKind` union, `Skill`, etc.). `status: 'published'` gates visibility. |
| `tutor_lesson_sessions` | A live room (one per tutor↔student pair — `getOrCreateLessonSpace` in `src/lib/lessons/lesson-space.ts`). Rooms are **private**: only the owning tutor and that specific student may enter (`src/app/room/[id]/page.tsx`). |
| `tutor_lesson_messages`, `tutor_lesson_highlights` | Room chat + highlights, scoped per session. |
| `homework_assignments`, `homework_submissions` | Homework. Routes: `src/app/api/homework/{assign,generate,review,save,submit}`. Submit already emits the canonical `homework_submitted` analytics event and calls `recordActivity` (streak). |
| `user_activity` | Analytics event log — see Analytics section below. |
| `push_subscriptions` | Web Push subscriptions (`notification_time`, `notify_streak`, `notify_reminders` prefs). |
| `commission_ledger`, `commission_payouts` | Tutor commission accounting; `users.commission_balance` is the running total. |
| `class_requests`, `session_participants`, `tutor_sessions` | Scheduling/booking. |

## Reusable services — plug into these, don't rebuild

Full detail: **`docs/integration-hooks.md`**. Summary:

- **Push**: `sendPush(userId, {title, body, deeplink, tag})` from
  `@/lib/notifications/push`. `notifyUser()` in `@/lib/notifications/create` also
  writes an in-app inbox row. Needs `NEXT_PUBLIC_VAPID_PUBLIC_KEY` +
  `VAPID_PRIVATE_KEY` (+ optional `VAPID_EMAIL`) in the Vercel **build** env (the
  public key is inlined at build time — it must exist before the deploy builds).
- **Analytics events**: client `trackEvent(kind, opts)` from
  `@/lib/analytics/client` (posts to `/api/activity/event`, kind must be in
  `CLIENT_EMITTABLE_KINDS`), or server `logActivity(userId, kind, opts)` from
  `@/lib/analytics/activity`. Admin dashboards read these at `/admin/growth`.
- **Streak / daily activity**: `recordActivity(userId, {kind})` from
  `@/lib/streak/record-activity` — the one hook any activity (lesson, game,
  homework) calls to advance the streak and emit the between-lesson-return
  signal. Idempotent per calendar day, timezone-aware, never throws.
- **Tutor↔student connections**: `getConnectionsFor(userId, "tutor"|"student")`
  from `@/lib/lessons/lesson-space`.
- **TTS**: `/api/tts` (Inworld, cached) — used for all spoken audio, vocab, and
  pronunciation.

## Route map (App Router groups)

- `(auth)` — signup/login/onboarding/join-by-code flows.
- `(student)` — dashboard, lessons (`/learn`), games, placement test, settings,
  notifications, `become-tutor`. **Note**: `(student)/page.tsx` is a legacy file
  shadowed by `[locale]/page.tsx` for the actual `/` route — see the warning above.
- `(tutor)` — `/tutor` (dashboard + invite code + class code), `/tutor/students`
  (class list, per-student private rooms), `/tutor/commisions` (commission +
  payout details — note the route is misspelled `commisions`, matches the folder).
- `(admin)` — `/admin/growth` (analytics), `/admin/pricing/commission` (commission
  settings + manual payouts queue), `/admin/tutor-lessons`, `/admin/users`,
  `/admin/content`, `/admin/import-from-drive`, and more — see
  `find src/app/(admin) -name page.tsx` for the full list.
- `[locale]` — the actual public marketing root (`/`, `/pricing`) with i18n.
- `room/[id]` — the live lesson room (chat, whiteboard, exercises).
- Top-level: `api/**` (all backend routes), `library`, `tutors`, `get-started`,
  `pricing`, `space/{new,open}` (room routing helpers).

## Major subsystems and where to read more

| Subsystem | Status | Read |
|---|---|---|
| **Lessons content model** (v2 schema, section kinds, exercise components) | Mature, actively extended | `src/lib/lessons/types.ts`, `src/components/lesson-v2/sections/*` |
| **French Grammar** (48 A1–B2 lessons live, C1/C2 planned, homework mostly missing) | In progress | `docs/grammar-HANDOFF.md` (start here), `docs/grammar-pronunciation-curriculum.md` (syllabus), `docs/grammar-pronunciation-KICKOFF.md` (original brief) |
| **Pronunciation** | Planned, not yet built | `docs/grammar-pronunciation-plan.md` |
| **Kids' vocab games** (5 mini-games: maze-chase, quiz-show, picture-quiz, listen-find, memory-match) | Mature, actively extended | `docs/games-HANDOFF.md` |
| **Growth analytics** (activation funnel × acquisition source, first-session drop-off, between-lesson return, onboarding A/B experiment, homework-doer retention) | Built, live at `/admin/growth` | `src/lib/admin/analytics.ts` |
| **PWA push notifications** | Built; action-gated permission prompt, iOS Add-to-Home-Screen flow, scheduled reminders via `/api/cron/push-reminders` (hourly GitHub Actions trigger) | `docs/integration-hooks.md` |
| **Onboarding A/B experiment** | Live 50/50 split (`src/lib/flags.ts`, `NEXT_PUBLIC_ONBOARDING_EXPERIMENT` kill switch) — fast lesson-first flow vs. current 4-step flow | `src/app/(auth)/onboarding/page.tsx` |
| **Multi-tutor connections** | Built — students can join unlimited tutors by class code; `tutor_students` is the membership source of truth | (no separate doc — see Data model above) |
| **Tutor payouts** | Built — tutor sets payout method (PayPal/Skrill/bank/mobile money) at `/tutor/commisions`; admin has a manual "mark as paid" queue at `/admin/pricing/commission` | `src/app/api/tutor/payout-details/route.ts`, `src/app/api/admin/payouts/route.ts` |
| **Content generation pipeline** (Google Doc → Gemini/OpenAI convert → repair passes → hydrate images → publish) | Mature | `src/lib/lessons/convert.ts`, `src/lib/lessons/build-lesson.ts`, `src/app/api/admin/drive/import/route.ts` |

## Known content-quality issues (actively being cleaned up)

The lesson library (654 lessons at last count) has some generation-era content
bugs, being found and fixed via read-only scan scripts before any write:
- Fixed: fill-in-blank exercises misrendering as empty drop targets on lesson
  switch or on certain generation shapes (`src/components/lesson-v2/sections/fill-blank-dialogue.tsx`,
  `src/lib/lessons/convert.ts:repairFillBlanks`).
- Fixed: 88 lessons had broken blank-number tracking / thin answer pools —
  repaired via `scripts/repair-fill-blank-lessons.mjs`.
- Fixed: 9 lessons had a "duplicate answer" content bug (blank positioned so
  filling it duplicates a word already in the sentence) — repaired via
  `scripts/fix-duplicate-blank-answers.mjs` (hand-verified per case, not a blind
  regex — some flagged matches are grammatically correct French and must NOT be
  "fixed", e.g. reflexive "nous nous couchons").
- Two lessons ("Urgences de Voyage…", "Mauvais temps") have deeper garbled
  dialogue beyond simple duplication — flagged for a full reconvert, not patched.
- `scripts/scan-duplicate-blank-answers.mjs` is safe to re-run any time
  (read-only) to check for regressions or new instances after content edits.

**Pattern for any future content-quality fix**: write a read-only scan script
first, review real examples with full context (don't trust a single field in
isolation — pull the whole section/exchange array), classify true bugs vs.
legitimate repetition, then a separate dry-run-by-default fix script with
`--apply`. Several such scripts already exist in `scripts/` as a template.

## Conventions

- **UI**: every page uses brand `primary-*`/`secondary-*` Tailwind tokens and the
  role-appropriate navbar — no raw hex, no off-brand components.
- **Server vs. client Supabase**: `@/lib/supabase/server` (`createClient()`,
  respects RLS + session) for user-scoped reads; `@supabase/supabase-js` with the
  **service role** key for cross-user/admin reads (bypasses RLS) — see any
  `svc()` helper pattern throughout the API routes.
- **Commits**: conventional-ish (`feat(scope): …`, `fix(scope): …`), one logical
  change per commit, pushed straight to `main` (no PR flow in this repo's
  workflow as currently used).
- **Migrations**: `supabase/migrations/*.sql`, applied manually by the user via
  the Supabase SQL editor (no CLI/CI migration runner connected) — always give
  the user the exact SQL to paste, and make application code degrade gracefully
  if a migration hasn't been run yet (see `payout-details/route.ts` for the
  pattern: detect the missing-column error and return a clear, non-crashing
  response).
- **Scripts**: one-off Node scripts (`.mjs`, `dotenv` loading `.env.local`) for
  data audits/repairs live in `scripts/`. Convention: **dry-run by default,
  `--apply` to write**, clear before/after reporting.

## What NOT to do

- Don't rebuild games or homework UI from scratch — both have dedicated handoff
  docs and are actively maintained elsewhere; read the handoff first.
- Don't treat `referred_by_tutor_id` as "this student's tutor" — it's commission
  attribution only. Use `tutor_students` for membership/class-list logic.
- Don't assume Vercel env vars are set — ask and verify via the user pasting
  `vercel env ls production` output, or by testing behavior (e.g. push silently
  no-ops without VAPID keys).
- Don't blindly regex-patch lesson content across the library — French sentences
  need per-case human/semantic verification (see the content-quality section
  above for the safe pattern).
