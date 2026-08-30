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
