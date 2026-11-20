# FrancoLink Mobile App (Native) — v1 PRD

**Owner:** Diggie Bambot
**Status:** Draft v2
**Created:** 2026-09-14 · **Revised:** 2026-10-01
**Target platform:** Android (Google Play) first, iOS after Android test period

> **Supersedes** `docs/PRD-google-play-launch.md` (TWA/PWA-wrapper approach, 2026-06-17).
>
> **v2 changes (2026-09-29 → 2026-10-01):** scope narrowed to the self-study lesson library
> + audio; tutor directory, bookings and AI tutor moved out of v1; Premium is now sold
> in-app through Google Play Billing via RevenueCat (§6); new §5.4 **Engagement & feel**,
> the layer that makes daily study a habit.

---

## 1. Summary

FrancoLink currently exists as a Next.js 16 PWA on Vercel with Supabase auth, Stripe
billing, self-study lesson content, an AI tutor (currently switched off), and a web-based
tutor booking marketplace.

This PRD defines **v1 of a native mobile app** (Expo/React Native) focused on the one thing
students will open it for every day: **studying the lessons**. The bar is that it has to
feel at least as good to use as the apps it sits next to on the store (Duolingo, Babbel).
Content alone won't get there; the feedback, rewards and daily habit loop in §5.4 are
part of v1, not a polish pass.

### Key decisions (locked)

| Decision | Choice | Implication |
|---|---|---|
| Architecture | **Native app (Expo/React Native)**, not a TWA/PWA wrapper | Real native screens; reuses existing Supabase/Next.js backend and data |
| v1 scope | **Lesson library + audio only** | Tutor directory, bookings and AI tutor are not in v1 (§1 non-goals) |
| Monetization in app | **Premium only**, monthly + yearly, via **Google Play Billing + RevenueCat** — **$8.99 / $69.99** | Web stays $7.99 / $59.99 on Stripe; the app never mentions web pricing (§6) |
| Premium+ | Not sold in the app | Its only real extra is AI tutor messages, and the AI tutor isn't in v1 |
| Existing subscribers | Web (Stripe) subscribers log in and get Premium access in the app | Both stores write `users.subscription_plan`; `subscription_source` keeps them from overwriting each other (server side shipped in #12) |
| Engagement | Streaks, daily goal, native reminders, answer feedback and a lesson-complete reward are **v1 requirements** (§5.4) | ~1–2 weeks added to the build; the lesson player is designed around them from day one |
| Mascot | **Not in v1** — revisit with retention data (§5.4.9) | Screens leave a slot for a character so one can be added without a redesign |

### Non-goals (v1)

- No tutor directory, bookings, or booking link-outs (web only for now).
- No AI tutor (hidden on web too while `ai_tutor_enabled` is off).
- No Premium+ in-app purchase.
- No hearts/lives, gems, or in-app currency (§5.4.8).
- No mascot character (§5.4.9).
- No iOS build (Android closed test first; iOS is a follow-on once Android is validated).

---

## 2. Background & rationale

### Why native instead of the TWA plan
A Trusted Web Activity is just the website in a chrome-less window: no haptics, no native
notifications, no 60fps animation, none of the feel that users compare against Duolingo
the moment they install. Native (Expo/React Native) is chosen because:

- One codebase covers Android now and iOS later with minimal rework.
- It reuses all existing backend logic (Supabase auth/data, Next.js API routes, lesson
  content, streak/XP tracking, subscription tables).
- It gives access to haptics, native push, and smooth animation (Reanimated, Lottie),
  which the engagement layer (§5.4) depends on.

### Why sell Premium in the app (changed 2026-09-30)
v1 originally kept all purchases on the web. That means a new user who finds FrancoLink on
Google Play installs it, hits a locked lesson, and has no way forward in the app, which
is the worst possible first session. Play Billing costs 15% on subscriptions; the app
price ($8.99 / $69.99) absorbs that. RevenueCat handles receipt validation and keeps
Supabase the source of truth.

---

## 3. Users

- **Student**: the only account type with a mobile UI. Either an existing web account
  (any tier) or a new signup from the store listing.
- Typical v1 student: an adult learning French with a deadline, often for **TCF Canada /
  immigration**. Motivated by a goal, not by play. Shapes the tone of §5.4: serious,
  encouraging, never childish or guilt-tripping.

---

## 4. Success criteria

- App approved and live on Google Play (closed test: 12+ testers for 14 days → production).
- A student can sign up or log in, study lessons with audio, and (if Free) buy Premium
  in the app; web subscribers get their access without buying again.
- **Retention (leading indicators for the 1,000-paying-subscriber goal, 2027-03-10):**
  - D1 / D7 / D30 retention of new installs.
  - % of weekly active users who hit their daily goal at least 3 days that week.
  - % of users with a streak of 7+ days.
  - Notification opt-in rate.
  - Free → Premium conversion in the app.
- Store rating ≥ 4.5 over the first 50 reviews.

---

## 5. Scope — v1 features

### 5.1 Auth
- Sign up and log in with Supabase (email/password + existing OAuth providers), using the
  mobile login token already accepted by the API (#11).
- Onboarding mirrors the web: language, level, daily goal, plus the optional exam goal
  (§5.4.7).

### 5.2 Lesson library
- Learning path by language + CEFR level (§5.4.6), matching the existing unit/lesson
  structure.
- Lesson player for the existing exercise types, with audio playback for every item that
  has audio.
- Progress read/written against the existing progress tables; every completed lesson
  calls the existing `recordActivity` path so streaks stay identical across web and app.
- Locked Premium lessons show a lock and open the paywall (§5.3).

### 5.3 Premium purchase
- Paywall screen: Premium monthly $8.99, yearly $69.99 (show the yearly saving), what
  Premium unlocks, restore purchases, terms/privacy links.
- Purchase through RevenueCat → app calls `POST /api/billing/sync` after purchase and on
  launch; entitlement comes from `users.subscription_plan`.
- Shown when a Free user taps a locked lesson, and from Profile. Never as an interruption
  mid-lesson.

### 5.4 Engagement & feel

The goal: every session ends with a reason to come back tomorrow, and every tap feels
responsive. Everything here builds on data the web app already has unless marked **new**.

#### 5.4.1 Answer feedback (lesson player)
- On check, a **feedback panel slides up** from the bottom:
  - Correct: green, "Bien joué !" (rotating short praise), light haptic, short positive sound.
  - Wrong: red, the correct answer shown clearly, a short explanation if the exercise has
    one, medium haptic, soft negative sound. The panel stays until the user taps
    Continue, which preserves the "give a wrong answer time to be read" behaviour (#9).
- The selected option animates (scale pop on correct, small shake on wrong).
- Progress bar at the top animates forward on each correct answer; a **combo** indicator
  appears after 3 correct in a row.
- Missed items come back at the end of the lesson ("Let's review 2 mistakes") so a lesson
  always finishes on a correct answer.

#### 5.4.2 Lesson-complete screen
- XP earned **counts up** (base + bonuses: perfect lesson, combo, first lesson of the day).
- Stats: accuracy %, time taken.
- **Daily goal ring** fills with this lesson's contribution; a goal-met burst the first
  time it closes each day.
- **Streak flame** animates +1 when this lesson extended the streak (use `isNewDay` from
  `recordActivity`).
- Confetti (Lottie) only on a real milestone: perfect lesson, goal met, streak milestone
  (7/30/100/365), level complete. Not every lesson, or it stops meaning anything.
- One primary action: **Continue** (next lesson on the path); secondary: back to path.

#### 5.4.3 Streak
- Existing `current_streak` / `longest_streak` / `last_activity_date` on `users`,
  advanced by `src/lib/streak/record-activity.ts`. Shown on the home header on every
  screen.
- **Streak freeze (new):** a user holds up to 2 freezes. One is earned for every 7-day
  streak. If exactly one day is missed and a freeze is held, it's consumed and the
  streak survives. Needs a `streak_freezes` column on `users` and a change to
  `recordActivity` (the `diff === 2` case). Applies on web too, since the streak is shared.
- Streak milestones (7, 30, 100, 365) get a full-screen celebration once.
- A broken streak shows a kind message and the longest streak, not a loss screen.

#### 5.4.4 Daily goal
- Existing `daily_goal_minutes` (set in onboarding/settings). The app shows the same goal
  ring as the web dashboard. During the build, confirm what the web ring counts today
  and reuse the same source so web and app agree.

#### 5.4.5 Native push reminders
- The web already sends daily reminders from `src/app/api/cron/push-reminders/route.ts`
  (web push/VAPID, hourly run, per-user `notification_time`, `notify_streak` /
  `notify_reminders`). The app reuses that cron and those preferences.
- **New:** a `device_push_tokens` table (user_id, Expo push token, platform, updated_at);
  the cron sends via the Expo push service to device tokens in addition to web push.
- Ask for notification permission **after the first completed lesson** ("Want a daily
  reminder at 7pm?"), not on first launch, when people usually say no.
- At most **one reminder a day**. Copy is encouraging, never guilt-tripping. Streak-at-risk
  variant in the evening if the user hasn't studied that day.

#### 5.4.6 Learning path
- Units shown as a vertical path of lesson nodes (done / current / locked), not a flat
  list. The current node pulses; tapping opens the lesson.
- Unit headers show CEFR level and unit title; a level-complete node leads to the existing
  certificate.

#### 5.4.7 Exam goal (new, optional)
- Onboarding and Profile: "Preparing for an exam?" → TCF Canada / TEF Canada / DELF /
  none, plus an optional exam date.
- **New columns:** `exam_type`, `exam_date` on `users`.
- Where set, the streak header reads e.g. "Day 23 · 41 days to your TCF", and reminder
  copy can reference the exam. This ties the habit to the user's own reason for
  studying, which is what separates us from a general-purpose app.

#### 5.4.8 Deliberately excluded
- **Hearts/lives:** they punish mistakes to push purchases; wrong for adults preparing
  for an exam.
- **Gems / in-app currency / shop.**
- **Leagues:** v1.1, built on the existing leaderboard, once there are enough active
  users for a league to feel alive.

#### 5.4.9 Mascot (deferred)
- Not in v1. A good one needs an illustrator plus a Rive animator for ~15–20 states
  (roughly $3–8k and several weeks); a cheap one hurts credibility with paying adults.
- v1 animates a brand motif instead (streak flame, FrancoLink mark).
- The celebration screen, empty states and notification artwork each leave a **character
  slot** so a mascot can be dropped in later without redesign. Revisit once D7/D30
  retention data exists.

#### 5.4.10 Feel & accessibility requirements
- 60fps animations on a mid-range Android device (test on a ~$200 phone, not only a
  flagship). Use Reanimated for UI motion, Lottie for celebrations; keep each Lottie file
  small (< 100 KB).
- Haptics via `expo-haptics`; sounds via `expo-audio`, preloaded.
- Settings: sound effects on/off, haptics on/off. Respect the OS "reduce motion" setting
  (replace motion with fades, skip confetti).
- Feedback never relies on colour alone (icon + text as well).

### 5.5 Profile
- Name, level, streak (current / longest / freezes held), total XP, exam goal.
- Daily goal and reminder time (writes the same fields the web settings page does).
- Subscription status, source (Google Play / web) and a manage link: Play subscriptions →
  Google Play subscription page; web subscriptions → neutral "Managed on your account"
  text, no link or price (§6).
- Sound/haptics toggles, privacy policy, account deletion (reuses #10).

---

## 6. Payments policy compliance

- Digital content (Premium) is sold in the app **only through Google Play Billing**.
- **Anti-steering:** the app never mentions, links to, or hints at web pricing or web
  checkout, including the cheaper web price. No "subscribe on our website" copy anywhere.
- Web subscribers get access in the app because it is the same account; that's allowed,
  but the app gives them no purchase or pricing information about the web.
- One active subscription per user: web checkout already refuses a Stripe subscription
  for a Play subscriber (#12); the app should hide the paywall for anyone already on
  Premium from either source.
- Account deletion tells Play subscribers to cancel renewal in Google Play first (#12).
- The user is an individual developer: once the app sells, Google Play shows a seller
  address publicly. Settle which address to use before production.

---

## 7. Architecture

- **Client**: Expo (React Native), TypeScript, Expo Router. Reanimated, Lottie
  (`lottie-react-native`), `expo-haptics`, `expo-audio`, `expo-notifications`,
  `react-native-purchases` (RevenueCat).
- **Backend**: existing Next.js API routes + Supabase. Shipped already: mobile login
  token (#11), RevenueCat webhook + `/api/billing/sync` (#12), account deletion (#10).
- **New backend work for v1:**
  - Migration: `users.streak_freezes`, `users.exam_type`, `users.exam_date`,
    `device_push_tokens` table.
  - `recordActivity`: freeze handling.
  - Push-reminders cron: send to Expo device tokens as well as web push.
  - API route for the app to register/remove its push token.

---

## 8. Non-functional requirements

- Reuse existing Supabase RLS/auth policies; the app is just another authenticated client.
- Add the app's auth callback scheme to Supabase's redirect list (and each OAuth provider).
- Lesson audio cached after first play so replays are instant and survive a weak signal.
- Play Store requirements: privacy policy URL, account deletion path, Data Safety form
  (now including purchase history), content rating (Education).

---

## 9. Sequenced plan

1. Scaffold the Expo project; prove login end-to-end against the existing Supabase project.
2. Design system + motion primitives: colours, type, buttons, the feedback panel,
   progress bar, haptic/sound helpers. Build these first so every screen uses them.
3. Learning path + lesson player with the full feedback loop (§5.4.1) and audio.
4. Lesson-complete screen (§5.4.2), streak header and daily-goal ring (§5.4.3–5.4.4).
5. Backend migration: streak freezes, exam goal, device push tokens; extend
   `recordActivity` and the push-reminders cron.
6. Native push registration + permission prompt after first lesson (§5.4.5).
7. Paywall + RevenueCat purchase / restore / sync (§5.3).
8. Onboarding (incl. exam goal) and Profile/settings.
9. Performance pass on a mid-range Android device; reduce-motion and accessibility pass.
10. Compliance pass: Data Safety, content rating, privacy/deletion links, seller address.
11. Closed testing (12+ testers, 14 days) → production.

---

## 10. Risks

- **Scope creep toward "be Duolingo":** it's easy to keep adding game mechanics. Anything
  not in §5.4 waits for retention data.
- **Animation performance on low-end Android:** heavy Lottie files or JS-thread animation
  will stutter and feel worse than no animation. Mitigated by Reanimated (UI thread),
  small Lottie files, and testing on a cheap device.
- **Notification fatigue:** more than one nudge a day gets the app muted or uninstalled.
  Hard cap of one per day.
- **Streak divergence between web and app:** streak logic must stay in the one shared
  server path (`recordActivity`); the app never computes streaks locally.
- **Anti-steering:** any mention of web pricing in the app risks rejection (§6).
- **Content parity drift:** a new lesson/exercise type added for web must be handled in
  the app player too, or it breaks on mobile only.

---

## 11. Deferred to v1.1+

- Leagues (weekly, built on the existing leaderboard).
- Weekly progress recap (in-app + notification).
- Home-screen widget (streak + goal).
- Mascot (see §5.4.9).
- AI tutor, once re-enabled on the web.
- Tutor directory + booking link-out; bookings list.
- iOS / App Store launch (App Store IAP via the same RevenueCat setup).
