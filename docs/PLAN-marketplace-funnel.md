# Marketplace funnel: filters, favorites, subscription-first booking

Scope decided 2026-08-24. Keeps the current UI language (chips, rounded-2xl
cards, primary/secondary tokens). Borrows Engoo/Preply *flow*, not their look.

## Decisions taken

1. Subscription only. A student with no active plan cannot buy a single
   lesson; the per-lesson Stripe path in /api/booking/create survives for the
   discounted TRIAL and nothing else.

   Note the reason, because it is not the obvious one. Per lesson, the one-off
   was the most profitable thing on the platform -- professional 50min at
   $25.00 against $13.00 pay is 48%, where the annual plan sells the same
   lesson at $20.00 for 35%. The term discount is what we pay for commitment.
   The case for killing it is churn (a one-off buyer retains at roughly zero),
   breakage (unused credits inside the rollover cap are pure margin and the
   expiry sweep already banks them), and tutor supply planning, which needs
   committed weekly demand to exist at all.

   The cost: the discounted trial becomes the ONLY low-commitment door into
   FrancoLink, and every trial is sold below tutor pay ($7.99 vs $13.00
   professional, $3.99 vs $5.00 community). Trial -> plan conversion is now
   the single number the funnel lives on. Instrument it in stage 3, not
   later.
2. The filter rail ships complete, availability included, with state in the
   URL. `?lang=fr&level=B1&when=tue-evening` is shareable and indexable.

3. The entrance is a DISCOUNTED FIRST MONTH at 40% off, not a discounted
   single lesson. See "Intro pricing" below for the arithmetic and the one
   trap in it. The below-cost trial SKU (is_trial rows in lesson_pricing) is
   retired: it lost $5.01 on every professional taster and $1.01 on every
   community one, and the intro month does its job while staying positive.

## Why this work exists

`/api/checkout/subscription` is fully written and **nothing calls it**. The
credits system underneath it -- weekly grants, rollover, expiry, tier
entitlement -- is finished and unreachable. `Register free` on the tutor card
points at `/signup`, which lands on the student dashboard: an account with no
plan, no credits, and nothing to do. The missing piece is the funnel between
them, not the machinery.

---

## Intro pricing

The ceiling is set by tutor pay, because credits are granted WEEKLY and every
granted lesson is a real payout:

  community     $10.00 list / $5.00 pay   -> max 50% off
  professional  $25.00 list / $13.00 pay  -> max 48% off

After Stripe (2.9% + $0.30) true breakeven is ~46%. The
`subscription_plan_prices_margin_ok` trigger already refuses anything past the
floor, so the schema will physically stop an overshoot -- the same guard must
be mirrored onto the intro rate.

We charge 40% off month one. It is the deepest discount that stays positive on
every plan at every lessons-per-week, and it reads as generous:

  plan          lpw   normal    intro   per lesson
  community       1   $43.30   $25.98   $6.00
  community       2   $86.60   $51.96   $6.00
  professional    1  $108.25   $64.95   $15.00
  professional    2  $216.50  $129.90   $15.00
  professional    3  $324.75  $194.85   $15.00

Month-one profit at 40% off, by how many granted lessons are actually booked:

  plan          lpw   100% used     80%     60%
  community       2       $6.85  $15.51  $24.17
  professional    2      $13.25  $35.77  $58.28
  professional    3      $20.03  $53.80  $87.58

Never negative, even at full utilisation. Real first-month utilisation is well
under 100%, so the middle column is the honest number.

### BUILT DIFFERENTLY -- two corrections found during implementation

Both of these changed the design. They are recorded here rather than quietly
fixed, because the numbers above are what the offer was sold on.

**1. The rate is per plan, not 40% across the board.**

The floor is tutor pay, and PLAN-tutor-supply.md raises community pay from
$5.00 to $6.50 in the same release. That moves the community ceiling:

    community     $10.00 list / $6.50 pay   -> ceiling 35%, we take 30%
    professional  $25.00 list / $13.00 pay  -> ceiling 48%, we take 40%

A flat 40% would have sold community lessons at $6.00 against $6.50 of pay --
a loss on every one, introduced by our own raise. intro_discount_bps is
therefore a per-plan column, and subscription_plans_intro_ok() makes the
below-cost configuration impossible rather than trusting whoever edits the
table next.

**2. The intro applies to the 1-month term ONLY.**

The plan originally said the intro discount should apply to the undiscounted
list rate regardless of term, so an annual subscriber would not get a worse
intro than a monthly one. That does not survive contact with Stripe: a
once-duration coupon discounts the FIRST INVOICE, and the first invoice on a
twelve-month term IS the twelve months. Discounting a twelfth of it instead is
arithmetic nobody can read off the page.

The longer terms already carry 10% and 20% off every lesson for the whole
term, which is worth far more in absolute money than 40% of one month. So the
offer is a ladder rather than a trick:

    start monthly, 40% off month one  ->  or commit for a year, 20% off all of it

Enforced in /api/checkout/subscription, which only attaches the coupon when
term_months = 1 and intro_offer_available() says the student has never held a
plan of any status -- so cancelling and resubscribing cannot buy a second
discounted month.

### Why weekly granting makes this safe

The usual way intro pricing gets abused is buy-cheap-month-one, consume
everything, cancel. That cannot happen here. `grant_weekly_credits` issues
`lessons_per_week` at a time and each lot expires 30 days after ITS OWN grant
date (20260825_credit_expiry.sql) -- there is no month-one lump to drain. A
canceller only ever holds what has been granted to date.

Note the expiry is a rolling per-lot 30 days, NOT a monthly reset. A 2/week
student can bank up to ~8.6 lessons before the oldest lot lapses.

---

## Stage 1 -- Filter rail

`src/components/site/tutor-directory.tsx`

Replace the two chip rows with a sticky rail. Facets:

  language, level, tier, speaks, specialties, country,
  availability (weekday + time-of-day, in the VIEWER's timezone),
  first-lesson-available, favorites-only
  sort: relevance | most available | newest

State lives in the URL via `useSearchParams` + `router.replace`, so a filtered
directory can be linked and crawled. Filtering stays client-side; the list is
tens of tutors, not thousands. Revisit past ~200.

Availability is the one facet needing new data: `listTutors()` in
`src/lib/site/queries.ts` must return a coarse weekly availability summary
(weekday -> time-of-day buckets) alongside each card. Bucket boundaries are
computed per viewer timezone in the browser -- the stored slots are the
tutor's, and showing a Douala clock to someone in Montreal is how people miss
lessons.

## Stage 2 -- Favorites

Migration `tutor_favorites (student_id, tutor_id, created_at)`, RLS: a student
reads and writes only their own rows.

  POST/DELETE /api/tutors/[slug]/favorite

Heart button on the card and the profile, optimistic. Logged out, the click
stores the slug in localStorage and routes into signup; the first
authenticated load flushes the queue. Favoriting is itself a soft funnel
entry, which is the point of allowing it before signup.

## Stage 3 -- `Register free` becomes the entrance

New `/(auth)/start` on the app host, carrying `?next=` end to end so a visitor
who entered from a tutor card returns to that tutor's calendar:

  signup -> goal/level onboarding (already built)
        -> PLAN PICKER (new UI over /api/checkout/subscription:
           plan x lessons-per-week x 1/3/12-month term)
        -> Stripe -> back to the tutor, credits in hand

The plan picker is the only genuinely new screen. It reads
`subscription_plans` and `subscription_plan_prices` and posts the plan_key,
lessons_per_week and term_months -- the server prices it, as it already does.

## Stage 4 -- Gate the booking path

`src/app/(student)/book/page.tsx` gains a server-side check before rendering
the handoff:

  authenticated AND no active subscription
    -> redirect into the plan picker (40% intro month), slot preserved
       in `next`

There is no "just this one lesson" link and no discounted trial. The intro
month IS the low-commitment door, and unlike the trial it makes money.

`/api/booking/create` must enforce this server-side as well as in the page: a
booking from a student with no active plan is refused there, or the gate is
decorative. The is_trial branch and its pricing rows come out at the same
time.

With an active plan the existing credit path in `/api/booking/create` already
books it, writes both calendars and hands the student `/student/sessions`.
Nobody who has not paid lands on the dashboard.

## Stage 5 -- Lifecycle polish

* Reschedule: cancel + rebook as one operation, honouring the 12h window.
* Intro-month retention tracked as the headline funnel metric: intro started
  / lessons taken in month one / renewed at full price. Month-one utilisation
  is the leading indicator -- a student who books 2 of 8 granted lessons will
  not renew, and that is visible in week two, not at the renewal.
* Cancellation reason capture.
* The lessons list states the credit consequence BEFORE confirming --
  "cancel now, credit returned" vs "inside 12 hours, credit is spent". The
  rules in `/api/booking/cancel` do not change; only their visibility does.

---

## Build status (2026-08-25)

  stage 1  filter rail               BUILT  components/site/tutor-directory.tsx
  stage 2  favourites                BUILT  20260830_tutor_favorites.sql,
                                            api/tutors/[slug]/favorite,
                                            api/tutors/favorites/adopt
  stage 3  plan picker + /start      BUILT  app/(auth)/start,
                                            components/student/plan-picker.tsx,
                                            lib/credits/plans.ts
           intro month               BUILT  20260831_intro_offer.sql +
                                            api/checkout/subscription
  stage 4  booking gate              BUILT  book/page.tsx + api/booking/create
           trial retired             BUILT  is_trial is now always false
  stage 5  cancellation consequence  BUILT  api/booking/cancel (GET) +
                                            components/booking/cancel-lesson.tsx
           reschedule                NOT BUILT -- see below

NOT VERIFIED: no SQL has been run (no local Postgres on this machine), and no
Stripe call has been exercised. In particular the intro coupon path in
/api/checkout/subscription has never talked to Stripe.

### Favourites on the website are a SHORTLIST, not a favourite

Worth knowing before reading that code. The marketing host has no session --
the Supabase cookie belongs to app.francolink.net and the website never calls
getUser() anywhere. So a heart on /tutors cannot write tutor_favorites, and
localStorage is per-origin so the app host cannot read it either.

The shortlist therefore rides the signup URL as slugs and is adopted once, on
arrival, by /api/tutors/favorites/adopt. Same constraint that made /book a
navigation rather than a fetch.

### Still to do

  * RESCHEDULE. Deliberately not attempted rather than half-done: the safe
    order is hold the NEW slot first, then cancel the old one and refund, then
    spend the credit on the new booking. Any other order can leave a student
    with neither slot, or with a lesson nobody paid for.
  * The lessons list needs to actually RENDER <CancelLesson>. The component
    and its preview endpoint exist; nothing mounts them yet.
  * Stripe Price objects for the plan catalogue. subscription_plan_prices rows
    without stripe_price_id are shown as unbuyable in the picker, which is
    honest but is not a shop.
