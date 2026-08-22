# Lesson subscriptions — plan (not yet built)

Status: **design, part-built.** Written 2026-08-22, revised 2026-08-23.

> **Part I's pricing grid is superseded by Part III.** The three-tier,
> group-inclusive model below was replaced by two tiers and a 50-minute
> lesson unit. Read Part III for the live numbers; Part I is kept for the
> reasoning that produced them.

Sells a Cambly-style recurring plan: *plan type × lessons per week × plan length*.
A subscription buys **live lesson credits** with FrancoLink tutors. FrancoLink
collects the subscription revenue and pays tutors a per-lesson rate.

Self-study content (the existing `PREMIUM` / `PREMIUM_PLUS` entitlement) is
bundled into every paid lesson plan — it is not what the student is buying.

---

## 1. The constraint that shapes everything

`supabase/migrations/20260805_bookings.sql` already sets our cost of goods:

| Tier | 25 min price | 25 min tutor pay | 50 min price | 50 min tutor pay |
|---|---|---|---|---|
| community | $10.99 | **$6.00** | $19.00 | $10.00 |
| certified | $12.99 | **$7.50** | $22.00 | $13.00 |
| professional | $14.99 | **$9.00** | $25.00 | $16.00 |

Tutor pay is a **cash cost per lesson taught**, and a subscription does not
reduce it. So:

> **Effective per-lesson revenue must stay above `tutor_pay_cents` + payment
> fees + a target margin — at every discount level, for every plan.**

Two consequences that make our grid differ from the screenshot:

1. **No 50% annual discount.** Cambly's $7.82/lesson works because their tutor
   supply and lesson economics are different. At -50% our professional tier
   sells at $7.50 against a $9.00 cost — a loss on every lesson, worse the more
   the student uses the plan. Cap the length discount at **-25%**.
2. **Volume discounts are pure margin loss.** 10 lessons/week costs us 10× the
   tutor pay. Cambly discounts volume anyway; we can't do it meaningfully.
   Keep lessons/week as a **quantity multiplier at a flat per-lesson rate**, or
   give at most a token -5% at the top end.

`lesson_pricing` already enforces `tutor_pay_cents <= price_cents` for non-trial
rows. Subscriptions bypass that table, so the same floor must be enforced in the
plan catalogue (see §4).

---

## 2. Proposed grid

Plan type maps onto the existing tutor tiers, so entitlement is just "which tiers
may this plan book".

| Plan | Books tutors of tier | Positioning |
|---|---|---|
| **Group** | any tier, group room (2–4 students) | cheapest; one tutor pay split across students |
| **Standard** | community + certified, 1-on-1 | the default |
| **Pro** | all tiers incl. professional, 1-on-1 | structured lessons, goal tracking |

Base rate = per 25-minute lesson, billed monthly, 1 lesson/week:

| Plan | List / lesson | Tutor cost / lesson | Gross margin |
|---|---|---|---|
| Group | $6.99 | ~$2.50 (pay ÷ seats, floor-protected) | ~64% |
| Standard | $12.99 | $7.50 | 42% |
| Pro | $15.99 | $9.00 | 44% |

Length discount applies to the per-lesson rate:

| Length | Discount | Group | Standard | Pro | Pro margin |
|---|---|---|---|---|---|
| Monthly | — | $6.99 | $12.99 | $15.99 | 44% |
| 3 months | -12% | $6.15 | $11.43 | $14.07 | 36% |
| 12 months | -25% | $5.24 | $9.74 | $11.99 | 25% |

**Do not go below -25%.** At -30% Pro lands at $11.19 (20% margin) and Stripe
fees plus refunds/no-shows eat most of what's left.

Charge amount = `per_lesson_rate × lessons_per_week × 4.33 weeks × months`.
Show the student the per-lesson number (it is the number Cambly leads with and
it is the honest unit), and the total, exactly as in the screenshot.

**Group plan caveat:** a group lesson still pays the tutor once. Margin depends
on actually filling seats. Price it against a *worst case of 2 students*, not
the 4-seat ideal, or a half-empty group room loses money. Needs the group
classroom work on `feat/group-classrooms` to land first.

---

## 3. The -20% first month

Worth doing, but it only means something on the monthly plan.

- **Monthly:** Stripe coupon, `percent_off: 20`, `duration: 'once'`. Applies to
  invoice 1 only. Cost: $3.20 on a Pro 1/week plan. Fine.
- **3-month / 12-month:** these are a **single upfront charge**, so "-20% first
  month" is either meaningless or, applied naively, becomes -20% of the whole
  term (-$97 on an annual Pro 5/week plan) stacked on top of the -25% length
  discount. That combination is below cost.

**Recommendation:** offer the first-month discount on the monthly plan only, and
present it as the reason to *start* monthly. For longer terms the length
discount is already the offer — don't stack. Enforce this in code, not just in
the UI copy: reject any coupon whose `duration != 'once'` or that is applied to
a non-monthly plan.

Watch the obvious abuse: cancel-and-resubscribe to farm -20% forever. Gate on
"no prior paid subscription on this user **or** this Stripe customer **or** this
payment fingerprint" — the signup-risk work in
`supabase/migrations/20260821_signup_risk.sql` is the natural place to hang this.

---

## 4. Data model

### `subscription_plans` — the catalogue
```
plan_key            text pk        -- 'pro_25'
name, description
allowed_tiers       text[]         -- which lesson_pricing tiers it may book
duration_minutes    int            -- 25 | 50
is_group            boolean
per_lesson_cents    int            -- monthly list rate
active              boolean
```

### `subscription_plan_prices` — one row per sellable combination
```
plan_key            fk
lessons_per_week    int            -- 1,2,3,5,10
term_months         int            -- 1,3,12
discount_bps        int            -- 0,1200,2500
total_cents         int            -- computed and stored
stripe_price_id     text
primary key (plan_key, lessons_per_week, term_months)
```
Plus a check constraint mirroring `lesson_pricing_margin_ok`: the effective
per-lesson cents after discount must exceed the highest `tutor_pay_cents` among
`allowed_tiers`. This is the guard that stops someone configuring a loss-making
plan in the admin UI.

**Stripe object strategy:** 3 plans × 5 weekly counts × 3 terms = 45 Price
objects, which is unmanageable by hand and will drift. Instead create **one
Price per (plan, term)** — 9 objects — and set the subscription item
`quantity = lessons_per_week`. Volume then costs exactly linear, which is what
the economics say anyway. If a volume discount is ever added, it becomes a
Stripe *tiered* price on the same object rather than a new object.

### `user_subscriptions`
```
id, user_id, plan_key, lessons_per_week, term_months
stripe_subscription_id, stripe_customer_id
status              -- trialing|active|past_due|canceled|paused
current_period_start / _end
cancel_at_period_end boolean
started_at, canceled_at
```
`users.subscription_plan` stays as-is for content entitlement and is derived
from this (any active lesson plan ⇒ `PREMIUM_PLUS` content access).

### `lesson_credits` — append-only ledger
```
id, user_id, subscription_id
delta               int            -- +N grant, -1 consume, +1 refund, -N expire
reason              text           -- 'weekly_grant'|'booking'|'cancellation_refund'
                                   -- |'tutor_no_show'|'expiry'|'admin_adjustment'
booking_id          uuid null fk
expires_at          timestamptz null
created_at
```
Balance = `sum(delta) where expires_at is null or expires_at > now()`. Append-only
because credits are money and we will be asked to explain a balance.

### `bookings` additions
```
paid_with         text default 'stripe'  -- 'stripe' | 'credit'
credit_ledger_id  uuid null
```
`price_cents` records the attributed subscription value (per-lesson rate), and
`tutor_pay_cents` is unchanged. **Tutor payout logic does not need to know
subscriptions exist** — that is the seam that makes this tractable.

---

## 5. Credit lifecycle

**Grant weekly, not per cycle.** The product promise is "N lessons per week", and
a lump grant of 130 annual credits is a liability the student can burn in a
month while we keep paying tutors. A weekly cron grants `lessons_per_week`
credits each Monday in the user's timezone while the subscription is `active`.

**Rollover:** up to one week's worth carries over, expiring 30 days after grant.
Beyond that, unused credits lapse. Say this plainly on the pricing page — it is
the single most complained-about mechanic in this category.

**Consumption:** booking confirmation debits 1 credit inside the same
transaction that inserts the booking. If the debit fails, the booking is not
created. A 50-minute lesson on a 25-minute plan costs 2 credits.

**Refunds:**
| Event | Credit | Tutor paid? |
|---|---|---|
| Student cancels > 24h before | refunded | no |
| Student cancels < 24h before | consumed | yes |
| Student no-show | consumed | yes |
| Tutor cancels, any time | refunded | no |
| Tutor no-show | refunded + 1 goodwill credit | no |

**Dunning:** `past_due` stops new grants but honours already-granted credits —
lessons already booked go ahead. Cancel/expire revokes unused credits at period
end.

---

## 6. Stripe webhook work

`src/app/api/webhooks/stripe/route.ts` already handles the subscription events.
Needed:
- `checkout.session.completed` with `metadata.kind === 'lesson_subscription'` —
  a third branch alongside the existing `lesson_booking` and plan paths.
- `customer.subscription.created/updated` — write `user_subscriptions`, issue the
  first weekly grant immediately so the student can book on day one.
- `invoice.payment_succeeded` — renewal; resume grants after a `past_due`.
- `customer.subscription.deleted` — expire unused credits, downgrade content
  entitlement.
- New: `invoice.payment_failed` → `past_due` + notify.

Every handler must be idempotent on `stripe_event_id` — credits are money and
Stripe redelivers. Add a `processed_stripe_events` table if there isn't one.

---

## 7. Build order

1. **Catalogue + margin guard.** `subscription_plans`, `subscription_plan_prices`,
   the constraint, admin UI under `/admin/pricing`. No checkout yet.
2. **Ledger.** `lesson_credits`, balance helper, weekly grant cron. Testable with
   admin-issued credits before any money moves.
3. **Booking pays with credits.** `bookings.paid_with`, debit in the booking
   transaction, refund rules. This is the riskiest piece — race conditions on
   double-spend. Use the same "let the database refuse it" discipline as
   `bookings_no_overlap`.
4. **Stripe.** 9 Price objects, checkout with quantity, webhook branches,
   idempotency.
5. **Pricing page.** The three-column selector from the screenshot.
6. **First-month coupon** + abuse gate.
7. **Group plans** — after `feat/group-classrooms` lands.

Steps 1–3 are shippable and useful on their own (admin can hand-issue credits to
early students), which is the natural point to sanity-check the economics with
real bookings before turning on billing.

---

## 8. Open questions

- **25 vs 50 minutes.** The grid above assumes 25-minute credits with 50-minute
  lessons costing 2. Cleaner than separate plans, slightly worse value optics.
- **Does a plan bind the student to one tutor?** Cambly's doesn't. Ours has
  `tutor_students` many-to-many and a first-touch commission field
  (`users.referred_by_tutor_id`) — need to decide whether the referring tutor
  earns anything on subscription revenue, and if so whether that comes out of
  our margin or is a separate acquisition cost.
- **Commission vs. per-lesson pay.** `commission_ledger` currently pays tutors a
  cut of student subscriptions. Under this model tutors are paid per lesson
  taught instead. Two payout systems must not both fire for the same lesson.
- **Currency.** `/api/checkout` charges USD only today. Same limitation applies.
- **Pausing.** Cambly allows it. Cheap to promise, annoying to implement against
  weekly grants. Suggest launching without it.

---

# Part II — Information architecture

The host split already exists (`src/lib/site/hosts.ts`, middleware rewrites `/`
→ `/site` on marketing hosts). Nothing structural to add. What changes is **what
each host is for**, and the shape of the app sidebar.

## 9. Host responsibilities

### `francolink.net` — acquisition and booking funnel
Public, unauthenticated, SEO-owned. Its job is to turn a visitor into a
registered student with a first lesson booked.

- Home, how-it-works, about, FAQ, blog, testimonials, teach (all exist)
- **Tutor directory + profiles** (`/tutors`, `/tutors/[slug]`) — exists
- **Pricing** — needs rewriting around the subscription grid from Part I
- **Slot picker → registration → checkout** — exists, hands off to
  `app.francolink.net/book` (correctly, for first-party cookie reasons)

The one addition: registration on this host is framed as *"start learning with a
tutor"*, and the post-signup landing is the app dashboard, not a marketing page.

### `app.francolink.net` — the student dashboard
Authenticated. Everything the student *has*, not everything we *sell*.

Live lessons are the primary object here and self-study is a section within it —
the inverse of today's sidebar.

## 10. Proposed sidebar

Three groups instead of a flat list. Today's 11 flat items give a game and a
booked live lesson identical visual weight.

```
┌ [logo]
│ ┌───────────────────────────────┐
│ │ Pro · 3 lessons left this week│   ← credit pill, links to /subscription
│ └───────────────────────────────┘
│
│ MY LESSONS
│   Dashboard            /dashboard
│   Book a lesson        /book              ← becomes a real in-app browser
│   Upcoming             /student/sessions
│   History & reviews    /student/history
│   Homework             /student/homework
│   My tutors            /student/tutors    ← new
│
│ SELF-STUDY                      [collapsible]
│   Courses              /learn
│   Games                /games
│   AI Tutor             /student/ai-tutor
│   Placement test       /placement-test
│   Leaderboard          /student/leaderboard
│
│ ACCOUNT
│   Subscription         /student/subscription   ← new
│   Notifications        /notifications
│   Settings             /settings
└
```

**On the group name:** use **"Self-study"**. It is already the term used
throughout `docs/PROJECT-CONTEXT.md` for exactly this material, so the UI and the
codebase agree. "Self learn" reads as non-native English; "Practice" collides
with the existing `/student/practice` route.

Collapse **Self-study by default for students who hold a live-lesson
subscription**, expanded for everyone else. That single rule makes the sidebar
correct for both audiences without a settings toggle. Persist the open/closed
state per user.

**Credit pill** is the highest-value new element: "3 lessons left this week" is
the number a subscriber checks constantly, and putting it in the chrome removes
a page visit from the most common session. Reads the ledger balance from §4.

## 11. Dashboard, re-pointed

`/dashboard` today opens on streak, XP, daily goal and continue-learning — a
self-study dashboard. Under the new model the top of the page should be:

1. **Next lesson** — tutor, time in the student's timezone, join button that
   goes live at T-5min, reschedule/cancel with the 24h rule stated inline
2. **Credits this week** — used / remaining, when the next grant lands
3. **Book again** — one click back to the tutor they last saw
4. *then* streak, continue-learning, daily goal — kept, moved below the fold

A student with no subscription sees the plan selector where (1) and (2) would be.

## 12. Work this implies

- **`/book` must become a real page.** It is currently a handoff-only screen
  (`src/app/(student)/book/page.tsx`) that expects `?tutor=&start=` from the
  website's slot picker. A logged-in subscriber paying with credits should never
  round-trip through the marketing host. Extract the directory components
  (`src/components/site/tutor-directory.tsx`, `tutor-card.tsx`, `slot-picker.tsx`
  are already standalone) and render them on both hosts with a different CTA:
  site → "Sign up to book", app → "Book (1 credit)".
- **`/student/subscription`** — plan, per-lesson rate, renewal date, credit
  balance and ledger history, invoices, change plan, cancel. Does not exist.
- **`/student/tutors`** — the student side of `tutor_students`. Tutors have a
  class list; students have no equivalent view.
- **Reviews** — `lesson_reviews` exists in the bookings migration with no UI.
  Surface as a prompt after a completed lesson and a list under history.
- **Two cleanups found while mapping this**, worth folding in rather than
  carrying forward:
  - `src/app/(student)/lessons/booked/page.tsx` and `/student/sessions` are two
    views of upcoming lessons. Pick one; the sidebar can only point at one.
  - `src/app/(student)/page.tsx` is dead — shadowed by `[locale]/page.tsx` for
    `/`, already flagged in `PROJECT-CONTEXT.md`. Delete it while touching this
    route group, so the next person doesn't edit the wrong file.

## 13. Sequencing against Part I

The IA work does not block on billing and should go first — it is
independently useful and de-risks the rest:

- **Now:** sidebar regrouping, `/student/tutors`, reviews UI, the two cleanups.
  No schema, no Stripe.
- **With ledger (Part I step 2):** credit pill, `/student/subscription`,
  dashboard re-point.
- **With credit booking (Part I step 3):** in-app `/book` browser.


---

# Part III — the model as built (supersedes Part I's grid)

Decided 2026-08-23, migrated in `supabase/migrations/20260823_credits_simplify.sql`.

## 14. What changed and why

**No group lessons.** Priced against a pessimistic two seats, Group cleared its
floor by 74c a lesson at the annual discount — one refund wiped out ten lessons
of profit. Not worth the classroom complexity for that.

**Two tiers, not three.** `certified` folds into `professional`; their
50-minute pay was identical ($13.00), so no tutor's rate moved.

**A lesson is 50 minutes.** A 25-minute lesson is half a lesson, at exactly half
the price and half the tutor pay. No premium for the short slot — the point is
that a student reading "1.5 lessons left" can work out what it buys.
`lesson_credits.delta` is therefore `numeric(6,1)`, not an integer.

## 15. The numbers

| Tier | Price (50 min) | Tutor pay | Tutor's share | You keep | Margin |
|---|---|---|---|---|---|
| Community | $10.00 | $5.00 | 50% | $4.64 | 46.4% |
| Professional | $25.00 | $13.00 | 52% | $11.21 | 44.8% |

Terms at 0% / −10% / −20%:

| Tier | Term | Price | /25 min | Margin at 0% breakage |
|---|---|---|---|---|
| Community | monthly | $10.00 | $5.00 | 46.4% |
| Community | 3 months | $9.00 | $4.50 | 41.3% |
| Community | annual | $8.00 | $4.00 | 34.5% |
| Professional | monthly | $25.00 | $12.50 | 44.8% |
| Professional | 3 months | $22.50 | $11.25 | 39.2% |
| Professional | annual | $20.00 | $10.00 | 32.1% |

**Professional pays $13, not the $15 first proposed.** At $15 the annual lesson
sells for $20 and leaves 22% before any refund. $13 holds 32%, and — more
importantly — matches Community's 50% share, so both tiers have the same room
to discount. At $15 the premium tier had the *least* discount headroom, which is
backwards: annual prepay matters most on the biggest cheque.

## 16. Breakage, and why it can't fund the incentive ladder

Unused credits are real margin — you bill for every credit and pay only for the
lessons taught:

| | 0% unused | 10% | 20% | 30% |
|---|---|---|---|---|
| Community annual $8.00 / pay $5 | 34.5% | 40.8% | 47.0% | 53.3% |
| Professional annual $20 / pay $13 | 32.1% | 38.6% | 45.1% | 51.6% |
| Professional annual $20 / pay $18 | **7.1%** | 16.1% | 25.1% | 34.1% |

The ladder runs to $18 for tutors who complete the most lessons. **It cannot be
underwritten by breakage**, because a tutor good enough to earn the top rung
teaches engaged students, and engaged students use their credits. The ladder pays
most exactly where breakage is lowest, so the top rung has to survive at *zero*
breakage — and $18 against a $20 annual lesson is 90% of revenue.

**So the ladder is split in two:**

- **Per-lesson rate caps at $14.50**, enforced by `lesson_pricing_pay_ceiling`.
  That clears 25% on the deepest annual price at zero breakage, so it is safe on
  every plan.
- **Everything above that is a monthly bonus pool**, funded from breakage already
  collected and measured. A tutor still reaches $18 effective; the difference is
  that $18 is never a hard-wired unit cost against a $20 unit price, and a bad
  month shrinks the pool instead of inverting the margin.

Measure before betting: `rollover_expiry` rows *are* the breakage number, and
`subscription_ended` catches the rest. The admin-issued-credit phase produces a
real figure before any of this is load-bearing.

## 17. Cancellation and refunds

Two obligations, both built rather than handled by email:

**14-day withdrawal.** Distance selling in the UK/EU gives 14 days on any
subscription. Where service has started with express consent, the delivered
portion is chargeable pro-rata and the rest is refunded.

**Mid-term cancellation refunds unused whole months at the MONTHLY rate** —
`subscription_refund_due()`. The student loses the discount they were only
entitled to by committing to the term, which is proportionate; keeping nine
months of an annual prepay for nothing delivered is the term that gets
challenged as unfair. Worked example, Professional annual 1/week:

> Paid $1,039.20. Cancels in month 1. One month consumed at the monthly rate of
> $108.25 → **$930.95 refunded**, full margin kept on what was delivered.

**Credits are an allowance, not stored value — keep the copy that way.** A gym
membership's unused classes owe nothing back; a gift-card balance does. What
pushes credits toward stored value is purchase language ("you bought 520
lessons"), unbounded accumulation, and sale detached from a period. The weekly
grant with a one-week rollover cap is already the right shape — never describe
credits as purchased units, and the balance never reads as a wallet.

**Budget on within-term lapse only.** The student who holds 3 credits and uses 2
is where the margin comes from, and none of the above touches it. Breakage from
*cancelled term plans* is the legally shaky portion — treat it as upside you do
not count.

*Not legal advice; consumer law varies by market and this wants 20 minutes with
someone who knows the markets the students are actually in. The monthly plan
carries almost none of this risk, which is a further argument for launching
monthly-first.*

## 18. Supply risk worth restating

$5 per 50-minute lesson is $6/hour. That is viable in North Africa and
francophone West Africa, and not viable for a tutor in France, Belgium or
Québec. It is a choice of supply pool, not just a price. Community is where
quality complaints will land, and with `certified` removed the step up to
Professional ($25) is large for a student to cross. A middle rung is the obvious
answer if that gap starts costing conversions.
