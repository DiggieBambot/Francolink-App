# FrancoLink marketplace — handoff

Context for a fresh session picking up the francolink.net website, tutor
applications, and paid lesson booking. Read `docs/PROJECT-CONTEXT.md` first for
the app itself; this covers what was added on top.

Last updated: 2026-08-19.

---

## 1. The business model, and why it changed mid-build

FrancoLink is now **two products in one codebase**, and confusing them is the
single easiest way to break something:

| | Who | What they get |
|---|---|---|
| **The tool** | ~150 tutor accounts | Teach students *they* brought. Invite by class code, live room, homework. FrancoLink takes no payment and sets no price. |
| **The marketplace** | A small vetted roster | Listed on francolink.net, we send them students, we take the payment, we pay them a fixed amount per lesson. |

Early in the build the tutor directory was written assuming all ~150 accounts
were FrancoLink tutors. They are not — they're software users. The directory
briefly published invented vetting claims and fabricated 5.0 ratings about real,
named people. That page was rewritten and the old `/tutors` app page now
redirects. **Never reintroduce claims about tutors that nobody has verified.**

Modelled on Engoo: platform sets prices, tutors are supply not sellers, free
ungated content drives acquisition.

### Naming trap
- `/become-tutor` → **instant**, no review. "Teach your own students."
- `/teach` and `/tutor/apply` → **reviewed**. Become a FrancoLink tutor.

Both were once called "Become a tutor". Keep them distinct in any new copy.

---

## 2. Architecture

### Host split
One Next.js project serves two domains, decided in `src/middleware.ts` by the
`Host` header (`src/lib/site/hosts.ts`):

- `francolink.net` → rewrites `/*` → `/site/*` (marketing pages at clean URLs)
- `app.francolink.net` → the app; `/site/*` redirects out
- Local: `site.localhost:3000` vs `localhost:3000`

`robots.txt` and `sitemap.xml` are host-aware. **Vercel has `www` as primary**,
so the apex 308s to www while the code canonicalises on the apex — harmless but
inconsistent; fixable by making the apex primary in Vercel.

### The three publish gates
A tutor appears publicly only when **all three** are true:
`approval_status='approved'` AND `is_public` AND `accepts_bookings`.
Missing any one is the most common "why isn't my tutor showing" cause. The admin
Tutors panel shows which gate is shut.

### Pricing
`lesson_pricing` keyed by (tier, duration, is_trial). **Never read
`tutor_public_profiles.hourly_rate_cents`** — a dead column from the old model.
Tiers: community / certified / professional. Trial is a one-off discounted first
lesson, enforced by a partial unique index.

### Booking
- `src/lib/booking/slots.ts` — pure slot generator, DST-correct. Tested.
- `src/lib/booking/availability.ts` — the single source both the public picker
  and the booking route use, so they cannot disagree.
- A GiST exclusion constraint on `bookings` makes double-booking impossible at
  the database level. Application checks lose that race; the constraint doesn't.
- `/api/booking/create` holds the slot **before** creating the Stripe session.
  The reverse order would let two students pay for one slot.
- The picker on francolink.net **navigates** to `/book` on the app host rather
  than fetching its API. The session cookie is first-party there; a cross-origin
  fetch would need third-party cookies, which Safari blocks.

### Anti-spam
Public forms fetch an HMAC-signed token on mount and send it back
(`src/lib/site/form-token.ts`). 44 of the first 45 waitlist signups were bots
POSTing straight at the API, which the honeypot could never catch. Rejections
return 200 so bots get no retry signal.

---

## 3. Current state

### Data (as of last check)
- 8 tutor applications — **all genuine, all unreviewed**
- 1 listing (`francais-avec-bambot`) — **pending, not public, not bookable, no
  photo, 0 availability blocks** → invisible on the site
- 0 bookings
- 1 genuine waitlist signup (44 spam rows purged)
- ~150 tutor accounts, 47+ students

### Migrations — all applied
`20260804_public_site` · `20260805_bookings` · `20260806_tutor_applications` ·
`20260807_inapp_tutor_applications` · `20260811_ai_tutor_conversations` ·
`20260812_tutor_waitlist` · `20260813_calendar_feed`

### Deploy
- Vercel project **`francolink-app`** under team **`francolink-s-projects`**
- ⚠️ `.vercel/project.json` points at an **abandoned** `francolink` project under
  a different team. This already caused an hour lost misreading a dead project's
  history as a broken pipeline. Run `vercel link` against `francolink-app`.
- Deploys on push to `main`. Working branch is `feat/group-classrooms`, pushed
  with `git push origin feat/group-classrooms:main`.

### Secrets
Supabase legacy JWT keys **rotated and disabled**; the leaked service-role key is
dead. Now on new-style `sb_secret_…` / `sb_publishable_…`. Stripe was **not**
compromised — the leaked `sk_live_...ahhd` was already deleted; production uses
`...MDBh`.

⚠️ **`.env.local` still holds the dead legacy key.** Local dev and any diagnostic
script will fail until it's updated with the new values.

---

## 4. What could be broken — check these first

1. **Stripe webhooks have been failing.** `headers()` is async in Next 15+; the
   route called `.get()` on the promise and threw, so **every** webhook POST
   returned 500. Fixed but **unpushed**. Implication: subscription events
   (`invoice.payment_succeeded`, `customer.subscription.*`) may not have been
   processed for some time. **Audit Premium subscribers against Stripe.**

2. **`app_settings.stripe_enabled`** had to be exactly `'true'` or the webhook
   silently dropped every event *and returned 200*. Now only an explicit
   `'false'` disables it. Verify the row's actual value.

3. **Two Stripe webhook destinations** both point at `app.francolink.net`. One is
   **Thin** payload — useless here, since the handler reads `event.data.object`.
   Only the **Snapshot** one (231 events) matters. Consider deleting the Thin one.

4. **`checkout.session.async_payment_succeeded` is subscribed but unhandled.**
   Delayed payment methods send `completed` as *unpaid* (correctly left held),
   then succeed later — that later event is ignored, so the booking expires after
   the student paid. Cards unaffected. **Not yet fixed.**

5. **The whole booking flow is untested end to end.** No real payment has ever
   gone through. Test with a separate student account (you can't book yourself,
   and one trial per student is enforced), then refund.

6. **The trial loses money** at professional tier: sells $7.99, pays the tutor
   $9.00. Deliberate acquisition cost, but revisit at scale.

7. **`/tutor/schedule`** is the legacy session-based view and now sits beside
   `/tutor/availability`. Overlapping concepts; worth consolidating.

8. **Stale `preview/deploy-check` branch** on the remote, from a false alarm.

---

## 5. Not built yet

**Booking completion**
- "My lessons" for student and tutor
- Cancel / reschedule (12h rule + refund)
- Reminders (24h, 1h) — push and Resend both already exist
- Calendar-subscribe button (`/api/calendar/subscribe` exists, nothing surfaces it)
- Bookings + Earnings pages for the tutor nav's middle group

**After that**
- Reviews, no-show handling
- Tutor payout statement — sum `bookings.tutor_pay_cents` for completed lessons
  per month. Manual payouts; Stripe Connect does **not** support Cameroon.
- Publish Daily News — the cron already generates it, nothing is public. Cheapest
  SEO win available.
- Utilisation widget (booked ÷ available hours) for the 75% recruit trigger
- French/Arabic marketing site — deferred to the SEO phase

---

## 6. Decisions already made

- **Buyer**: French-learning diaspora + international learners → USD + Stripe
- **Prices**: $14.99/25min, $25/50min professional; trial $7.99. Not to be cut —
  capacity is the constraint, not demand.
- **Cancellation**: free ≥12h before, no refund inside
- **Payouts**: monthly, in arrears, manual. Student no-show → tutor paid, student
  not refunded. Tutor no-show → tutor unpaid, student refunded.
- **Tiers set from credentials, never from reviews.** Reliability is a separate
  behavioural badge so one bad review can't cut someone's pay.

### Still open
- Tier spread is only $4 wide ($14.99 / $12.99 / $10.99) — too narrow to mean
  anything. Widen, or drop to two tiers.
- Tutor pay rates ($9 / $16 professional) are a proposal, not a decision.
- "Commissions" (referral) and lesson earnings share one word in the UI.

---

## 7. Testing

```bash
npx tsx scripts/test-slots.mts        # 18 — DST, buffers, min notice
npx tsx scripts/test-calendar.mts     # 20 — ICS escaping, folding, Google links
npx tsx scripts/test-form-token.mts   # 10 — anti-spam token
```

Dev runs with a 4 GB heap (`package.json`) — the 2.24 GB default OOM-crashed the
dev server on an 8 GB machine.
