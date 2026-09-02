# Tutor supply: pay visibility, community rate, and the incentive ladder

Companion to PLAN-marketplace-funnel.md. That plan is the demand side; this
one is what has to be true for there to be anybody to book.

## The situation

Prices were set by the founder, who is also currently the only tutor. At a
take rate of zero -- you receive the whole $25 either way -- the take rate is
invisible. The first genuine third-party tutor experiences a different
product, and the numbers they experience are:

  tier          student pays   tutor gets   take    hourly
  professional        $25.00       $13.00     48%    $15.60
  community           $10.00        $5.00     50%     $6.00

Against the market:

  italki                          15%
  Preply         18-33% (33% only for a tutor's first 20 hours)
  FrancoLink                   48-50%

Preply is openly attacked by tutors for 33%. We are fifteen points above that.

### The model mismatch, which is the real problem

The percentage alone is survivable -- Engoo and Cambly take more. The problem
is that we price like Engoo and recruit like italki.

  Engoo / Cambly    platform sets price, tutors interchangeable, no individual
                    profiles, low fixed rate traded for volume the tutor does
                    not have to generate.

  italki / Preply   tutors are named professionals with bios, intro video,
                    specialties, their own URL; they set their rate and treat
                    the platform as a channel they pay commission to.

Our pricing is the first. Our directory -- headshots, "Meet our tutors",
intro video, years teaching, qualifications, /tutors/francais-avec-bambot --
is the second. We recruit tutors into an identity that primes them to think
like italki tutors and then pay them like Engoo tutors. That gap is where
resentment and off-platform leakage come from, and a 48% take is exactly the
incentive that makes a tutor suggest WhatsApp after lesson three.

### What genuinely justifies a higher take than italki's

Worth saying out loud in recruiting rather than hoping nobody does the
arithmetic:

  * We pay the tutor on student cancellations inside 12 hours. italki does
    not. That is real money for held time.
  * Zero student acquisition burden. No profile SEO, no rate negotiation, no
    messaging funnel.
  * We supply the curriculum -- lesson library, homework, games, AI tutor,
    placement tests are all built. Most marketplaces hand a tutor an empty
    room.

That is a managed-teaching product, not matchmaking, and it justifies more
than 15%. It does not justify 48% indefinitely.

---

## Stage 0 -- The pay data is public right now

`lesson_pricing` carries price_cents AND tutor_pay_cents in one row, under:

    create policy "anyone reads pricing" on public.lesson_pricing
      for select using (true);          -- 20260805_bookings.sql:217

Anyone holding the anon key -- which ships in the browser bundle -- can read
both columns for every tier. No login. Separately, `participants read
bookings` gives a tutor select on the whole booking row including price_cents,
so a tutor can see what the student paid for the lesson they just taught.

We do not RENDER either number to tutors, but that is a UI accident, not a
boundary. This is a one-query discovery and the first tutor who runs it makes
the take rate public.

Fix: split the table.

  * `lesson_prices_public` view exposing (tier, duration_minutes, price_cents,
    currency) -- policy `using (true)`, this is what the site reads.
  * tutor_pay_cents stays on the base table with select revoked from anon and
    authenticated; service-role reads it, which is all /api/booking/create
    needs.
  * Narrow the bookings policy so a tutor selects their own columns without
    price_cents, or move student price off the row a tutor can reach.

Do this BEFORE recruiting. It is small and everything else assumes it.

## Stage 1 -- Community pay to $6.50

$5.00/50min is $6.00/hour. Below Cambly (~$10.20/hr) and below Preply's
realistic floor. At that rate we recruit tutors with no alternative, which is
adverse selection on the tier a new student is most likely to try first.

  community 50min  $5.00 -> $6.50 pay   (take 50% -> 35%)
  community 25min  $2.50 -> $3.25

Student price does not move. $10.00/50min stays cheap and competitive; the
change comes out of take, which is where the slack is. Professional stays at
$13.00 for now -- see Stage 4.

## Stage 2 -- Publish the promotion ladder

Community -> Professional takes pay from $6.50 to $13.00, a 2x raise. It is by
far the largest incentive we have and today it is invisible: tier is set by an
admin (`set_tier`, api/admin/tutors/route.ts:34) on unstated criteria at an
unknown time. A community tutor's entire incentive is to teach at $6/hour and
hope.

Everything a criteria table needs is already computable from `bookings` and
`lesson_reviews`:

  lessons taught      count(*) where status = 'completed'
  reliability         no_show_tutor + cancelled_by_tutor over completed
  rebooking rate      distinct students with >1 completed / distinct students
  rating              avg(lesson_reviews.rating)

New `tutor_tier_criteria` table holding the threshold for each, and a
`tutor_ladder_standing(uuid)` function returning current step, next step, and
the gap on each metric. Admin keeps final say -- promotion is proposed by the
function and confirmed by a human, because credentials still matter and a
metric can be farmed.

## Stage 3 -- In-tier steps, so progress is not all-or-nothing

Promotion is a cliff. A community tutor forty lessons in needs to see movement
before they clear it.

  step 0    $6.50    on approval
  step 1    $7.00    50 completed lessons, reliability >= 95%
  step 2    $7.50   150 completed lessons, reliability >= 95%, rating >= 4.5
  step 3    $8.00   300 completed lessons, same gates

All far under the $14.50 cap (`tutor_pay_cents <= duration_minutes * 29`).
Because pay is SNAPSHOT onto each booking at creation time, a step change
applies to future bookings only and nothing historical has to be restated --
the schema already handles this correctly.

## Stage 4 -- The bonus pool, funded from breakage

The migration comment at 20260823_credits_simplify.sql:169 imagined a pool
"funded from breakage already collected". Breakage is now exactly measurable:

    select sum(-delta) from lesson_credits where reason = 'lapsed_30_day'

Every such row is a lesson a student paid for and did not take. That is the
pool, and it can be computed per period without estimation.

Pay it on the metric we actually want, which is students coming back: a
monthly distribution weighted by each tutor's rebooking rate over lessons
taught in the period. It sits OUTSIDE per-lesson pay deliberately -- money
above the cap must not enter unit cost, or a bad month for breakage turns into
a margin hole.

## Stage 5 -- Show the tutor where they stand

A ladder nobody can see is not an incentive. The tutor dashboard needs current
step, next step, the gap on each metric, and last period's bonus. Without this
stages 2-4 are accounting, not motivation.

## Stage 6 -- Take rate over time

Plan to reach ~35% on professional by the time there are 20+ tutors, funded by
the blended margin improvement that subscription volume and breakage will have
delivered by then. Going DOWN over time is a recruiting story. Going up is a
revolt. Setting the target now stops us spending the improvement elsewhere.

---

## Also found, unrelated

`src/app/api/admin/pricing/tutor-plans/route.ts` writes to a `tutor_plans`
table that appears in zero migrations (0 hits in COMBINED.sql). The route
fails on any call. Delete it or add the table -- it is not part of this plan
either way.

---

## Build status (2026-08-25)

  stage 0  RLS split                 BUILT  20260826_pay_visibility.sql
  stage 1  community pay $6.50       BUILT  20260827_community_pay.sql
  stage 2  promotion ladder          BUILT  20260828_tutor_ladder.sql
  stage 3  in-tier pay steps         BUILT  same migration + booking/create
  stage 4  bonus pool from breakage  BUILT  20260829_tutor_bonus_pool.sql
  stage 5  tutor sees their standing BUILT  components/tutor/ladder-card.tsx
  stage 6  take rate to ~35%         not started -- a decision for 20+ tutors

NOT VERIFIED: none of the SQL has been run. There is no local Postgres on this
machine (no docker, no psql), so the migrations are reviewed but unexecuted.
Run them against a branch database before production.

Stage 0 changed two call sites to read `booking_details` instead of
`bookings`: the student's booked-lesson page and the tutor's availability
page. Every other reader was already service-role and is unaffected.

Stage 3 changed how pay is chosen at booking time: /api/booking/create now
calls tutor_pay_cents() instead of taking lesson_pricing.tutor_pay_cents flat.
It falls back to the flat rate if the RPC errors -- an underpaid tutor can be
corrected, a lost lesson cannot.
