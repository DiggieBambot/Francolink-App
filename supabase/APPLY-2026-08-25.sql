-- ===========================================================================
-- FrancoLink — marketplace funnel + tutor supply
-- Paste this whole file into the Supabase SQL Editor and Run.
-- ===========================================================================
--
-- Six migrations, concatenated in the order they must run. Wrapped in one
-- transaction: if any statement fails, NOTHING is applied and you can fix and
-- re-run. Do not split it — 20260827 must land before 20260831, or the intro
-- discount check validates against the OLD community pay rate and passes for
-- the wrong reason.
--
-- Safe to run: at time of writing this project has 0 bookings, 0 subscriptions
-- and 0 lesson credits, so nothing transactional is at risk. The one
-- behavioural change to existing surfaces is that `bookings` and
-- `lesson_pricing` stop being readable with the anon/authenticated keys —
-- every reader in the app is service-role except two pages, which have already
-- been repointed at the new booking_details view.
--
-- Contents:
--   20260826_pay_visibility.sql   tutor pay stops being public
--   20260827_community_pay.sql    community pay $5.00 -> $6.50
--   20260828_tutor_ladder.sql     metrics, pay steps, promotion criteria
--   20260829_tutor_bonus_pool.sql bonus pool funded from breakage
--   20260830_tutor_favorites.sql  favourites
--   20260831_intro_offer.sql      discounted first month
--
-- v2 (2026-08-25): fixes ERROR 42703 "record new has no field
-- duration_minutes" in subscription_plans_intro_ok(). That column was dropped
-- by 20260823_credits_simplify.sql when it settled that a lesson IS 50
-- minutes; the check now hardcodes 50, exactly as the sibling trigger
-- subscription_plan_prices_margin_ok() already did.
-- ===========================================================================

begin;


-- ###########################################################################
-- ## 20260826_pay_visibility.sql
-- ###########################################################################

-- What a tutor is paid stops being public.
--
-- Two leaks, both one query away from anybody who wanted to look:
--
--   1. lesson_pricing carried price_cents AND tutor_pay_cents in the same row
--      under `anyone reads pricing ... using (true)` (20260805_bookings.sql).
--      The anon key ships in the browser bundle, so the take rate was readable
--      by anyone, logged in or not.
--
--   2. `participants read bookings` gives a tutor select on the whole booking
--      row, price_cents included -- so a tutor could see what the student paid
--      for the lesson they had just taught.
--
-- Neither number was ever RENDERED to a tutor, but that was a UI accident and
-- not a boundary. The take rate is a thing to discuss with a tutor honestly
-- and deliberately, in a recruiting conversation where the cancellation pay,
-- the supplied curriculum and the zero acquisition burden are on the table
-- too. It is not a thing to have discovered.
--
-- The pattern below is column masking through a view. RLS is row-level and
-- cannot say "this column, but only for the student on the row", and column
-- GRANTs are per-ROLE -- student and tutor are both `authenticated`, so a
-- grant cannot separate them either. A view can, because it can read
-- auth.uid() per row.
--
-- The views are deliberately NOT security_invoker: they run as owner and do
-- their own filtering in an explicit where clause. security_invoker would
-- check privileges as the caller, and the caller is exactly who we are about
-- to revoke from.

-- ---------------------------------------------------------------------------
-- 1. Lesson prices: public price, private pay
-- ---------------------------------------------------------------------------

drop policy if exists "anyone reads pricing" on public.lesson_pricing;

create or replace view public.lesson_prices_public
  with (security_barrier = true) as
  select tier, duration_minutes, is_trial, price_cents, currency
    from public.lesson_pricing;

comment on view public.lesson_prices_public is
  'What a lesson SELLS for. The only price surface anon and authenticated may '
  'read -- tutor_pay_cents lives on lesson_pricing and is service-role only.';

revoke all on public.lesson_pricing from anon, authenticated;
grant select on public.lesson_prices_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Bookings: each side sees its own half of the money
-- ---------------------------------------------------------------------------
-- The student sees what they paid. The tutor sees what they earn. Neither
-- sees the other, so the take rate is not derivable from a row either party
-- holds.

create or replace view public.booking_details
  with (security_barrier = true) as
  select
    b.id,
    b.tutor_id,
    b.student_id,
    b.starts_at,
    b.ends_at,
    b.duration_minutes,
    b.status,
    b.tier,
    b.is_trial,
    b.currency,
    b.room_session_id,
    b.expires_at,
    b.cancelled_at,
    b.cancelled_by,
    b.student_note,
    b.refund_status,
    b.created_at,
    b.updated_at,
    -- The money, masked per viewer.
    case when auth.uid() = b.student_id then b.price_cents     end as price_cents,
    case when auth.uid() = b.tutor_id   then b.tutor_pay_cents end as tutor_pay_cents
  from public.bookings b
  where auth.uid() = b.student_id
     or auth.uid() = b.tutor_id;

comment on view public.booking_details is
  'Participant-facing bookings. Money columns are masked to the side they '
  'belong to: a student never sees tutor pay, a tutor never sees the student '
  'price. Read this from the app; the base table is service-role only.';

-- The row policy stays as documentation of intent, but the grant is what
-- actually closes the door -- a policy without a privilege grants nothing.
revoke all on public.bookings from anon, authenticated;
grant select on public.booking_details to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Nothing here touches service_role
-- ---------------------------------------------------------------------------
-- /api/booking/create, /api/booking/cancel, the completion sweeper and the
-- credit ledger all use the service client, which bypasses both RLS and these
-- grants. Pricing a lesson and paying a tutor are unaffected.

-- ###########################################################################
-- ## 20260827_community_pay.sql
-- ###########################################################################

-- Community tutors get a raise, out of take rather than out of the student.
--
-- $5.00 per 50-minute lesson is $6.00 an hour. That is below Cambly (~$10.20)
-- and below any realistic Preply floor, which means the only tutors who accept
-- it are tutors with no alternative -- adverse selection on the tier a new
-- student is most likely to try FIRST. The cheap tier being the bad tier is
-- the fastest way to lose someone in their first week.
--
-- The student price does not move. $10.00 for 50 minutes stays cheap and
-- competitive; the raise comes out of the take rate, which is where the slack
-- was:
--
--   community    take 50% -> 35%
--   professional unchanged at 48% for now -- see PLAN-tutor-supply.md stage 6,
--                which targets ~35% once there are 20+ tutors and blended
--                margin has absorbed it.
--
-- Pay is SNAPSHOT onto each booking at creation (20260805_bookings.sql), so
-- this applies to future bookings only and nothing historical is restated.
-- That is the correct behaviour and it is why the snapshot exists.

update public.lesson_pricing
   set tutor_pay_cents = 650
 where tier = 'community' and duration_minutes = 50 and not is_trial;

update public.lesson_pricing
   set tutor_pay_cents = 325
 where tier = 'community' and duration_minutes = 25 and not is_trial;

-- The trial rows are updated for consistency while they still exist. They are
-- retired entirely in the marketplace-funnel work -- a taster sold below tutor
-- pay ($3.99 against $3.25 here, $7.99 against $13.00 at professional) is
-- replaced by a discounted first MONTH, which stays profitable. See
-- PLAN-marketplace-funnel.md.
update public.lesson_pricing
   set tutor_pay_cents = 325
 where tier = 'community' and duration_minutes = 25 and is_trial;

-- Guard: a raise must never cross the price it is paid out of. The $14.50 cap
-- from 20260823 still applies on top of this.
alter table public.lesson_pricing drop constraint if exists lesson_pricing_pay_under_price;
alter table public.lesson_pricing add constraint lesson_pricing_pay_under_price
  check (tutor_pay_cents < price_cents);

-- ###########################################################################
-- ## 20260828_tutor_ladder.sql
-- ###########################################################################

-- The incentive ladder, which until now existed only as a comment.
--
-- 20260823_credits_simplify.sql talks about "the top of the incentive ladder"
-- and "a bonus pool funded from breakage already banked". Neither was built.
-- What a community tutor actually had was: teach at $6.00/hour and hope an
-- admin promotes you, on unstated criteria, at an unknown time. That is the
-- weakest retention story on the worst-paid tier.
--
-- Three things here:
--
--   1. METRICS. Everything a ladder needs is already in `bookings` and
--      `lesson_reviews`; nothing new has to be recorded.
--   2. IN-TIER STEPS, so a tutor forty lessons in sees movement before they
--      clear the promotion cliff.
--   3. PROMOTION CRITERIA, published rather than implied. Community ->
--      Professional roughly doubles pay ($6.50 -> $13.00) and is by far the
--      largest incentive we have; it should not be a secret.
--
-- Deliberately NOT here: automatic promotion. The function proposes, a human
-- confirms. Credentials still matter, and any metric can be farmed by a tutor
-- who understands it -- which, since we are about to publish the thresholds,
-- is all of them.

-- ---------------------------------------------------------------------------
-- 1. Metrics
-- ---------------------------------------------------------------------------
-- Reliability counts only faults that are the TUTOR's: a student who no-shows
-- must not cost the tutor a step. Bookings that never got paid for
-- ('pending_payment', 'expired') are not events either party caused.

create or replace function public.tutor_metrics(p_tutor uuid)
returns table (
  completed      int,
  tutor_faults   int,
  reliability_bps int,
  students       int,
  rebooked       int,
  rebooking_bps  int,
  avg_rating     numeric,
  rated_count    int
) language sql stable as $$
  with b as (
    select status, student_id
      from public.bookings
     where tutor_id = p_tutor
  ),
  done as (
    select student_id, count(*) as n
      from b where status = 'completed'
     group by student_id
  ),
  agg as (
    select
      coalesce((select sum(n)::int from done), 0)                      as completed,
      (select count(*)::int from b
        where status in ('no_show_tutor', 'cancelled_by_tutor'))       as tutor_faults,
      (select count(*)::int from done)                                 as students,
      (select count(*)::int from done where n >= 2)                    as rebooked
  ),
  r as (
    select round(avg(rating)::numeric, 2) as avg_rating, count(*)::int as rated_count
      from public.lesson_reviews where tutor_id = p_tutor
  )
  select
    agg.completed,
    agg.tutor_faults,
    -- No history yet reads as perfect, not as zero: a new tutor must not be
    -- gated out of step 1 by a denominator of nothing.
    case when agg.completed + agg.tutor_faults = 0 then 10000
         else (10000 - round(10000.0 * agg.tutor_faults
                             / (agg.completed + agg.tutor_faults)))::int end,
    agg.students,
    agg.rebooked,
    case when agg.students = 0 then 0
         else round(10000.0 * agg.rebooked / agg.students)::int end,
    coalesce(r.avg_rating, 0),
    coalesce(r.rated_count, 0)
  from agg, r;
$$;

comment on function public.tutor_metrics is
  'Ladder inputs for one tutor, derived from bookings and lesson_reviews. '
  'Only TUTOR faults count against reliability -- a student no-show is not '
  'the tutor''s to pay for.';

-- ---------------------------------------------------------------------------
-- 2. In-tier pay steps
-- ---------------------------------------------------------------------------
create table if not exists public.tutor_pay_steps (
  tier             text not null check (tier in ('community', 'professional')),
  step             int  not null check (step >= 0),
  -- Gates. All must be met.
  min_lessons      int  not null default 0 check (min_lessons >= 0),
  min_reliability_bps int not null default 0 check (min_reliability_bps between 0 and 10000),
  min_rating       numeric(3,2) not null default 0 check (min_rating between 0 and 5),
  -- Pay for a 50-minute lesson at this step. 25 minutes is exactly half, the
  -- same rule the student price uses.
  pay_cents_50     int  not null check (pay_cents_50 > 0),
  -- The cap from 20260823: performance money above $14.50 belongs in the bonus
  -- pool, not in unit cost, or a bad month for breakage becomes a margin hole.
  check (pay_cents_50 <= 1450),
  primary key (tier, step)
);

comment on table public.tutor_pay_steps is
  'In-tier pay ladder. Step 0 is the tier base and must match lesson_pricing.';

alter table public.tutor_pay_steps enable row level security;
drop policy if exists "anyone reads pay steps" on public.tutor_pay_steps;
create policy "anyone reads pay steps" on public.tutor_pay_steps
  for select using (true);

-- Published on purpose. A ladder nobody can see is not an incentive, and
-- unlike the take rate this is a number we WANT a prospective tutor to read.

insert into public.tutor_pay_steps
  (tier, step, min_lessons, min_reliability_bps, min_rating, pay_cents_50)
values
  ('community',    0,   0,    0, 0.00,  650),
  ('community',    1,  50, 9500, 0.00,  700),
  ('community',    2, 150, 9500, 4.50,  750),
  ('community',    3, 300, 9500, 4.50,  800),
  ('professional', 0,   0,    0, 0.00, 1300),
  ('professional', 1, 100, 9500, 4.50, 1375),
  ('professional', 2, 300, 9500, 4.60, 1450)
on conflict (tier, step) do update
  set min_lessons          = excluded.min_lessons,
      min_reliability_bps  = excluded.min_reliability_bps,
      min_rating           = excluded.min_rating,
      pay_cents_50         = excluded.pay_cents_50;

-- Which step a tutor currently stands on. Highest step whose gates are all met.
-- A rating gate is only applied once there are enough ratings to mean
-- anything -- one five-star review is not evidence, and one one-star review
-- should not cost somebody a raise.
create or replace function public.tutor_pay_step(p_tutor uuid)
returns int language sql stable as $$
  with m as (select * from public.tutor_metrics(p_tutor)),
       t as (select tier from public.tutor_public_profiles where user_id = p_tutor)
  select coalesce(max(s.step), 0)
    from public.tutor_pay_steps s, m, t
   where s.tier = t.tier
     and m.completed >= s.min_lessons
     and m.reliability_bps >= s.min_reliability_bps
     and (s.min_rating = 0 or m.rated_count < 5 or m.avg_rating >= s.min_rating);
$$;

-- What to snapshot onto a booking. Falls back to the lesson_pricing base if a
-- tier somehow has no steps configured, so a missing row can never zero a
-- tutor's pay.
create or replace function public.tutor_pay_cents(
  p_tutor    uuid,
  p_duration int,
  p_is_trial boolean default false
) returns int language plpgsql stable as $$
declare
  v_tier text;
  v_base int;
  v_step int;
begin
  select tier into v_tier from public.tutor_public_profiles where user_id = p_tutor;
  if v_tier is null then
    return null;
  end if;

  select tutor_pay_cents into v_base
    from public.lesson_pricing
   where tier = v_tier and duration_minutes = p_duration and is_trial = p_is_trial;

  if v_base is null then
    select tutor_pay_cents into v_base
      from public.lesson_pricing
     where tier = v_tier and duration_minutes = p_duration and not is_trial;
  end if;

  select round(s.pay_cents_50 * p_duration / 50.0)::int into v_step
    from public.tutor_pay_steps s
   where s.tier = v_tier and s.step = public.tutor_pay_step(p_tutor);

  -- The step is a raise, never a cut.
  return greatest(coalesce(v_base, 0), coalesce(v_step, 0));
end;
$$;

comment on function public.tutor_pay_cents is
  'The pay to snapshot onto a booking: the tier base from lesson_pricing, '
  'raised to the tutor''s current ladder step. Never returns less than base.';

-- ---------------------------------------------------------------------------
-- 3. Promotion criteria
-- ---------------------------------------------------------------------------
create table if not exists public.tutor_tier_criteria (
  from_tier           text primary key check (from_tier in ('community', 'professional')),
  to_tier             text not null check (to_tier in ('professional')),
  min_lessons         int  not null,
  min_reliability_bps int  not null,
  min_rebooking_bps   int  not null,
  min_rating          numeric(3,2) not null,
  min_rated           int  not null default 10
);

comment on table public.tutor_tier_criteria is
  'Published thresholds for tier promotion. Meeting them makes a tutor '
  'ELIGIBLE; an admin still confirms. Credentials matter and metrics can be '
  'farmed once the thresholds are public -- which they now are.';

alter table public.tutor_tier_criteria enable row level security;
drop policy if exists "anyone reads tier criteria" on public.tutor_tier_criteria;
create policy "anyone reads tier criteria" on public.tutor_tier_criteria
  for select using (true);

insert into public.tutor_tier_criteria
  (from_tier, to_tier, min_lessons, min_reliability_bps, min_rebooking_bps, min_rating, min_rated)
values
  ('community', 'professional', 200, 9700, 5000, 4.60, 15)
on conflict (from_tier) do update
  set min_lessons         = excluded.min_lessons,
      min_reliability_bps = excluded.min_reliability_bps,
      min_rebooking_bps   = excluded.min_rebooking_bps,
      min_rating          = excluded.min_rating,
      min_rated           = excluded.min_rated;

-- ---------------------------------------------------------------------------
-- 4. Standing -- what the tutor's dashboard reads
-- ---------------------------------------------------------------------------
create or replace function public.tutor_ladder_standing(p_tutor uuid)
returns jsonb language sql stable as $$
  with m as (select * from public.tutor_metrics(p_tutor)),
       t as (select tier from public.tutor_public_profiles where user_id = p_tutor),
       cur as (select public.tutor_pay_step(p_tutor) as step),
       nxt as (
         select s.* from public.tutor_pay_steps s, t, cur
          where s.tier = t.tier and s.step > cur.step
          order by s.step limit 1
       ),
       pro as (select c.* from public.tutor_tier_criteria c, t where c.from_tier = t.tier)
  select jsonb_build_object(
    'tier', (select tier from t),
    'metrics', jsonb_build_object(
      'completed',       m.completed,
      'reliability_bps', m.reliability_bps,
      'rebooking_bps',   m.rebooking_bps,
      'avg_rating',      m.avg_rating,
      'rated_count',     m.rated_count
    ),
    'step', (select step from cur),
    'pay_cents_50', (select pay_cents_50 from public.tutor_pay_steps s, t, cur
                      where s.tier = t.tier and s.step = cur.step),
    'next_step', (select case when nxt.step is null then null else jsonb_build_object(
        'step', nxt.step,
        'pay_cents_50', nxt.pay_cents_50,
        'lessons_to_go', greatest(0, nxt.min_lessons - m.completed),
        'needs_reliability_bps', nxt.min_reliability_bps,
        'needs_rating', nxt.min_rating
      ) end from nxt),
    'promotion', (select case when pro.from_tier is null then null else jsonb_build_object(
        'to_tier', pro.to_tier,
        'lessons_to_go', greatest(0, pro.min_lessons - m.completed),
        'needs_reliability_bps', pro.min_reliability_bps,
        'needs_rebooking_bps', pro.min_rebooking_bps,
        'needs_rating', pro.min_rating,
        'eligible',
          m.completed >= pro.min_lessons
          and m.reliability_bps >= pro.min_reliability_bps
          and m.rebooking_bps >= pro.min_rebooking_bps
          and m.rated_count >= pro.min_rated
          and m.avg_rating >= pro.min_rating
      ) end from pro)
  )
  from m;
$$;

comment on function public.tutor_ladder_standing is
  'Everything the tutor dashboard shows: where they stand, what the next step '
  'pays, and how far off promotion is. A ladder nobody can see is not an '
  'incentive.';

-- ###########################################################################
-- ## 20260829_tutor_bonus_pool.sql
-- ###########################################################################

-- The bonus pool, funded from breakage.
--
-- 20260823_credits_simplify.sql: "performance money above [$14.50] belongs in
-- a separate bonus pool paid from breakage already banked, not in the unit
-- cost." This builds that.
--
-- Breakage is now exactly measurable rather than estimated. Since
-- 20260825_credit_expiry.sql, every lesson a student paid for and did not take
-- lands as a row:
--
--     select sum(-delta) from lesson_credits where reason = 'lapsed_30_day'
--
-- That is real money already collected, with no tutor payout attached to it.
-- Paying it out as a bonus rather than banking it is a choice to spend
-- margin we already have on the thing we most need, which is tutors staying.
--
-- Two properties this design must keep:
--
--   * It sits OUTSIDE per-lesson pay. Money above the $14.50 cap must never
--     enter unit cost, or a quiet month for breakage becomes a margin hole in
--     the price list.
--   * It pays for RETENTION, not volume. A tutor who teaches 100 lessons to
--     100 different people who never come back is worth less to us than one
--     who teaches 60 lessons to 20 people who do. Weighting by rebooking rate
--     is how that gets said in money.

-- ---------------------------------------------------------------------------
-- 1. What breakage was collected in a window
-- ---------------------------------------------------------------------------
create or replace function public.breakage_cents(p_from timestamptz, p_to timestamptz)
returns bigint language sql stable as $$
  -- Lapsed lessons are counted at what the STUDENT paid for them, which is
  -- the plan's per-lesson rate, not the tutor rate -- nobody was paid for a
  -- lesson that never happened. Valued at the plan list rate the student was
  -- on when the credit lapsed.
  select coalesce(sum(
    (-c.delta) * coalesce(p.per_lesson_cents, 0)
  ), 0)::bigint
    from public.lesson_credits c
    left join public.user_subscriptions s on s.id = c.subscription_id
    left join public.subscription_plans p on p.plan_key = s.plan_key
   where c.reason = 'lapsed_30_day'
     and c.created_at >= p_from
     and c.created_at <  p_to;
$$;

comment on function public.breakage_cents is
  'Money collected for lessons that expired unused in a window. The bonus '
  'pool is a share of this and never more than this.';

-- ---------------------------------------------------------------------------
-- 2. Periods and awards
-- ---------------------------------------------------------------------------
create table if not exists public.tutor_bonus_periods (
  id            uuid primary key default gen_random_uuid(),
  period_start  date not null,
  period_end    date not null,
  -- What share of the window's breakage is distributed. Not 100%: breakage is
  -- also what underwrites refunds and the term discounts, so the pool takes a
  -- slice and the rest stays where it was.
  share_bps     int  not null default 5000 check (share_bps between 0 and 10000),
  breakage_cents bigint not null default 0,
  pool_cents    bigint not null default 0,
  status        text   not null default 'draft'
                check (status in ('draft', 'approved', 'paid')),
  computed_at   timestamptz,
  paid_at       timestamptz,
  created_at    timestamptz not null default now(),
  unique (period_start, period_end),
  check (period_end > period_start)
);

create table if not exists public.tutor_bonus_awards (
  period_id     uuid not null references public.tutor_bonus_periods(id) on delete cascade,
  tutor_id      uuid not null references public.users(id) on delete cascade,
  lessons       int  not null,
  rebooking_bps int  not null,
  weight        numeric(12,4) not null,
  amount_cents  int  not null check (amount_cents >= 0),
  primary key (period_id, tutor_id)
);

alter table public.tutor_bonus_periods enable row level security;
alter table public.tutor_bonus_awards  enable row level security;

-- A tutor sees their own awards, and only once the period is settled. A draft
-- is arithmetic we may still change, and showing somebody a bonus that later
-- shrinks is worse than showing them nothing.
drop policy if exists "tutor reads own settled awards" on public.tutor_bonus_awards;
create policy "tutor reads own settled awards" on public.tutor_bonus_awards
  for select using (
    auth.uid() = tutor_id
    and exists (
      select 1 from public.tutor_bonus_periods p
       where p.id = period_id and p.status in ('approved', 'paid')
    )
  );

drop policy if exists "anyone reads settled periods" on public.tutor_bonus_periods;
create policy "anyone reads settled periods" on public.tutor_bonus_periods
  for select using (status in ('approved', 'paid'));

-- ---------------------------------------------------------------------------
-- 3. Compute a period
-- ---------------------------------------------------------------------------
-- Weight = lessons taught in the window x (0.5 + rebooking rate). The floor of
-- 0.5 matters: a tutor with genuinely new students every week has no rebooking
-- history YET and must not be zeroed out for it, but retention still doubles
-- the multiplier at the top.
create or replace function public.compute_tutor_bonus(p_period uuid)
returns bigint language plpgsql as $$
declare
  per   public.tutor_bonus_periods%rowtype;
  v_from timestamptz;
  v_to   timestamptz;
  v_break bigint;
  v_pool  bigint;
begin
  select * into per from public.tutor_bonus_periods where id = p_period for update;
  if not found then
    raise exception 'compute_tutor_bonus: no such period %', p_period;
  end if;
  if per.status <> 'draft' then
    raise exception 'compute_tutor_bonus: period % is already %', p_period, per.status;
  end if;

  v_from := per.period_start::timestamptz;
  v_to   := (per.period_end + 1)::timestamptz;

  v_break := public.breakage_cents(v_from, v_to);
  v_pool  := (v_break * per.share_bps) / 10000;

  delete from public.tutor_bonus_awards where period_id = p_period;

  -- One statement, no temp table. tutor_metrics is set-returning so it cannot
  -- sit in the select list of a grouped query -- count the lessons first, then
  -- join it laterally, one tutor at a time.
  insert into public.tutor_bonus_awards
    (period_id, tutor_id, lessons, rebooking_bps, weight, amount_cents)
  with lessons as (
    select b.tutor_id, count(*)::int as n
      from public.bookings b
     where b.status = 'completed'
       and b.starts_at >= v_from
       and b.starts_at <  v_to
     group by b.tutor_id
  ),
  weighted as (
    select l.tutor_id,
           l.n as lessons,
           coalesce(m.rebooking_bps, 0) as rebooking_bps,
           (l.n * (0.5 + coalesce(m.rebooking_bps, 0) / 10000.0))::numeric as weight
      from lessons l
      left join lateral public.tutor_metrics(l.tutor_id) m on true
  ),
  pool as (select sum(weight) as total from weighted)
  select p_period,
         w.tutor_id,
         w.lessons,
         w.rebooking_bps,
         round(w.weight, 4),
         floor(v_pool * w.weight / p.total)::int
    from weighted w, pool p
   where p.total > 0 and v_pool > 0;

  update public.tutor_bonus_periods
     set breakage_cents = v_break,
         pool_cents     = v_pool,
         computed_at    = now()
   where id = p_period;

  return v_pool;
end;
$$;

comment on function public.compute_tutor_bonus is
  'Distributes a share of the period''s breakage across tutors, weighted by '
  'lessons taught x (0.5 + rebooking rate). Re-runnable while the period is '
  'draft; refuses once approved.';

-- ###########################################################################
-- ## 20260830_tutor_favorites.sql
-- ###########################################################################

-- Favouriting a tutor.
--
-- Small table, but it earns its place twice over: it is the lightest possible
-- commitment a visitor can make, and it is a filter people actually use on a
-- directory ("show me the four I liked" beats re-deriving them).
--
-- Note the spelling. The product is British-English elsewhere, but every
-- identifier here is 'favorite' to match the rest of the codebase and the
-- route path. One spelling, consistently, beats the right one inconsistently.

create table if not exists public.tutor_favorites (
  student_id uuid not null references public.users(id) on delete cascade,
  tutor_id   uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, tutor_id)
);

-- The directory asks "which of these has this student favourited", so the
-- lookup is by student. The reverse (how many people favourited this tutor)
-- rides the primary key.
create index if not exists tutor_favorites_student_idx
  on public.tutor_favorites (student_id, created_at desc);

alter table public.tutor_favorites enable row level security;

-- Strictly the student's own rows. A tutor cannot see who favourited them --
-- it would be a popularity signal we have not decided how to use, and
-- exposing it by default forecloses that decision.
drop policy if exists "student manages own favorites" on public.tutor_favorites;
create policy "student manages own favorites" on public.tutor_favorites
  for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- ###########################################################################
-- ## 20260831_intro_offer.sql
-- ###########################################################################

-- The discounted first month, which replaces the discounted first lesson.
--
-- The old trial was sold below what we pay the tutor -- $7.99 against $13.00
-- professional, $3.99 against $5.00 community -- so every taster was a loss we
-- hoped to earn back later. An intro MONTH does the same job (lower the bar to
-- starting) while staying profitable, and it puts the student on a
-- subscription from day one, which makes continuing the default instead of a
-- second decision.
--
-- ---------------------------------------------------------------------------
-- Why the rate is per plan and not one number
-- ---------------------------------------------------------------------------
-- The floor is tutor pay, because credits are granted weekly and every granted
-- lesson is a real payout. After the community raise in 20260827:
--
--   community     $10.00 list / $6.50 pay  -> ceiling 35%, we take 30%
--   professional  $25.00 list / $13.00 pay -> ceiling 48%, we take 40%
--
-- A single 40% would have sold community lessons at $6.00 against $6.50 of
-- pay. The trigger below makes that configuration impossible rather than
-- leaving it to whoever edits the table next.
--
-- ---------------------------------------------------------------------------
-- Why only the monthly term
-- ---------------------------------------------------------------------------
-- "40% off your first month" and a twelve-month term do not compose: the first
-- invoice on an annual plan IS the twelve months, so a once-only coupon would
-- discount the whole year. Discounting a twelfth of it instead is arithmetic
-- nobody can read off the page.
--
-- The 3- and 12-month terms already carry 10% and 20% off EVERY lesson for the
-- whole term, which is worth far more in absolute money than 40% of one month.
-- So the offer reads as a genuine ladder rather than a trick:
--
--     start monthly, 40% off month one  ->  or commit for a year, 20% off all of it
--
-- and the intro is restricted to term_months = 1, enforced in the checkout
-- route.

alter table public.subscription_plans
  add column if not exists intro_discount_bps int not null default 0
    check (intro_discount_bps between 0 and 5000);

comment on column public.subscription_plans.intro_discount_bps is
  'Discount on the FIRST month only, for new subscribers on the 1-month term. '
  'Floored by tutor pay -- see subscription_plans_intro_ok().';

-- The same margin floor as subscription_plan_prices_margin_ok, applied to the
-- intro rate. Written as a trigger for the same reason: a CHECK cannot run the
-- subquery into lesson_pricing that this needs.
create or replace function public.subscription_plans_intro_ok()
returns trigger language plpgsql as $$
declare
  worst_pay_cents int;
  effective_cents int;
begin
  if new.intro_discount_bps = 0 then
    return new;
  end if;

  -- 50 minutes, hardcoded, exactly as subscription_plan_prices_margin_ok does
  -- it. 20260823_credits_simplify.sql dropped subscription_plans.duration_minutes
  -- when it settled that a lesson IS 50 minutes and a 25-minute one is half a
  -- lesson; per_lesson_cents is denominated in that unit.
  select max(tutor_pay_cents) into worst_pay_cents
    from public.lesson_pricing
   where tier = any(new.allowed_tiers)
     and duration_minutes = 50
     and not is_trial;

  effective_cents := round(new.per_lesson_cents * (10000 - new.intro_discount_bps) / 10000.0);

  if worst_pay_cents is not null and effective_cents <= worst_pay_cents then
    raise exception
      'plan % intro of %bps sells a lesson for %c but the tutor is paid %c',
      new.plan_key, new.intro_discount_bps, effective_cents, worst_pay_cents;
  end if;

  return new;
end;
$$;

drop trigger if exists subscription_plans_intro_ok on public.subscription_plans;
create trigger subscription_plans_intro_ok
  before insert or update on public.subscription_plans
  for each row execute function public.subscription_plans_intro_ok();

update public.subscription_plans set intro_discount_bps = 3000 where plan_key = 'community';
update public.subscription_plans set intro_discount_bps = 4000 where plan_key = 'professional';

-- ---------------------------------------------------------------------------
-- Has this student ever had a plan?
-- ---------------------------------------------------------------------------
-- The intro is once per person, not once per subscription. Cancelling and
-- resubscribing must not buy another discounted month.
create or replace function public.intro_offer_available(p_user_id uuid)
returns boolean language sql stable as $$
  select not exists (
    select 1 from public.user_subscriptions where user_id = p_user_id
  );
$$;

comment on function public.intro_offer_available is
  'True only for a student who has never held a lesson plan of any status. '
  'Deliberately not "has no ACTIVE plan" -- that would make the intro month '
  'repeatable by cancelling.';

commit;

-- ===========================================================================
-- Sanity check — run this SEPARATELY after the commit above succeeds.
-- ===========================================================================
-- select 'views'      as what, count(*) from information_schema.views
--   where table_schema='public' and table_name in ('lesson_prices_public','booking_details')
-- union all
-- select 'pay steps',  count(*) from public.tutor_pay_steps
-- union all
-- select 'criteria',   count(*) from public.tutor_tier_criteria
-- union all
-- select 'intro col',  count(*) from information_schema.columns
--   where table_schema='public' and table_name='subscription_plans'
--     and column_name='intro_discount_bps';
-- Expect: 2, 7, 1, 1
