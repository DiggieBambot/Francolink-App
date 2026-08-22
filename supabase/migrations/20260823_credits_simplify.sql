-- Simplify the lesson model, and price it properly.
--
-- Four changes, all of them narrowing:
--
--   1. No group lessons. One tutor, one student.
--   2. Two tutor tiers, not three: community and professional. Existing
--      'certified' tutors become professional -- their 50-minute pay was
--      $13.00 and professional's new rate is also $13.00, so nobody's pay
--      changes. Demoting them to community would have halved it.
--   3. A lesson IS 50 minutes. A 25-minute lesson is half a lesson, priced at
--      exactly half, so a student can hold 1.5 lessons and the arithmetic is
--      obvious to them. This is why lesson_credits.delta becomes numeric.
--   4. New prices: community $10.00 / pay $5.00, professional $25.00 /
--      pay $13.00.
--
-- On the professional rate: $13 rather than $15 because the annual plan sells
-- that lesson for $20, and $15 against $20 leaves 22% before any refund. $13
-- holds 32% at zero breakage, which is the number that has to survive -- a
-- tutor good enough to earn the top of the incentive ladder teaches students
-- who actually turn up, so the ladder cannot be underwritten by breakage.
-- Per-lesson pay is capped at $14.50 for that reason (see the check on
-- lesson_pricing below); performance money above that belongs in a separate
-- bonus pool paid from breakage already banked, not in the unit cost.

-- ---------------------------------------------------------------------------
-- 1. Credits become fractional
-- ---------------------------------------------------------------------------
-- The functions depend on the column type, so they are dropped and rebuilt
-- around the alter rather than being left to bind to a stale signature.
drop function if exists public.spend_credits(uuid, int, uuid, text);
drop function if exists public.grant_weekly_credits(uuid, date);
drop function if exists public.credit_balance(uuid);

alter table public.lesson_credits
  alter column delta type numeric(6,1) using delta::numeric(6,1);

comment on column public.lesson_credits.delta is
  'Lessons, where one lesson is 50 minutes. A 25-minute lesson costs 0.5. '
  'numeric, not float: this is money and must not drift.';

create or replace function public.credit_balance(p_user_id uuid)
returns numeric language sql stable as $$
  select coalesce(sum(delta), 0)::numeric(6,1)
    from public.lesson_credits
   where user_id = p_user_id;
$$;

create or replace function public.spend_credits(
  p_user_id    uuid,
  p_amount     numeric,
  p_booking_id uuid,
  p_reason     text default 'booking'
) returns bigint language plpgsql as $$
declare
  v_balance numeric;
  v_id      bigint;
begin
  if p_amount <= 0 then
    raise exception 'spend_credits: amount must be positive, got %', p_amount;
  end if;

  -- Serialises spends per student. Two bookings both reading a balance of 1
  -- would otherwise both pass an application check, and the free lesson still
  -- costs us the tutor's pay.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  v_balance := public.credit_balance(p_user_id);

  if v_balance < p_amount then
    raise exception 'insufficient credits: have %, need %', v_balance, p_amount
      using errcode = 'check_violation';
  end if;

  insert into public.lesson_credits (user_id, subscription_id, delta, reason, booking_id)
  values (
    p_user_id,
    (select id from public.user_subscriptions
      where user_id = p_user_id and status in ('active','past_due') limit 1),
    -p_amount, p_reason, p_booking_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.grant_weekly_credits(
  p_subscription_id uuid,
  p_week            date
) returns numeric language plpgsql as $$
declare
  sub      public.user_subscriptions%rowtype;
  v_plan   public.subscription_plans%rowtype;
  v_cap    numeric;
  v_excess numeric;
begin
  -- Same lock, taken in the same order, as spend_credits -- a grant landing
  -- while a student is booking must serialise, not deadlock.
  perform pg_advisory_xact_lock(hashtextextended(
    (select user_id::text from public.user_subscriptions where id = p_subscription_id), 0));

  select * into sub from public.user_subscriptions
    where id = p_subscription_id for update;

  if not found or sub.status <> 'active' then
    return 0;
  end if;

  if sub.last_grant_week is not null and sub.last_grant_week >= p_week then
    return 0;
  end if;

  select * into v_plan from public.subscription_plans where plan_key = sub.plan_key;

  insert into public.lesson_credits (user_id, subscription_id, delta, reason)
  values (sub.user_id, sub.id, sub.lessons_per_week, 'weekly_grant');

  -- Clamp to this week's grant plus the rollover allowance. Doing it here,
  -- rather than expiring each grant on its own timer, keeps balance a plain
  -- sum(delta) -- a per-row expiry filter goes negative the moment a lapsed
  -- grant has been partly spent.
  v_cap := round(sub.lessons_per_week * (1 + v_plan.rollover_weeks), 1);
  v_excess := public.credit_balance(sub.user_id) - v_cap;

  if v_excess > 0 then
    insert into public.lesson_credits (user_id, subscription_id, delta, reason, note)
    values (sub.user_id, sub.id, -v_excess, 'rollover_expiry',
            format('above rollover cap of %s', v_cap));
  end if;

  update public.user_subscriptions
     set last_grant_week = p_week, updated_at = now()
   where id = sub.id;

  return sub.lessons_per_week;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Two tiers. 'certified' folds into 'professional' at identical pay.
-- ---------------------------------------------------------------------------
update public.tutor_public_profiles set tier = 'professional' where tier = 'certified';

alter table public.tutor_public_profiles drop constraint if exists tutor_public_profiles_tier_check;
alter table public.tutor_public_profiles add constraint tutor_public_profiles_tier_check
  check (tier in ('community', 'professional'));

-- lesson_pricing is keyed on tier, so the old rows are replaced wholesale.
delete from public.lesson_pricing where tier = 'certified';

alter table public.lesson_pricing drop constraint if exists lesson_pricing_tier_check;
alter table public.lesson_pricing add constraint lesson_pricing_tier_check
  check (tier in ('community', 'professional'));

-- A 25-minute lesson is exactly half a 50-minute one, on both sides of the
-- ledger. No premium for the shorter slot: the point is that half a lesson
-- costs half a credit and a student can read their balance without help.
insert into public.lesson_pricing (tier, duration_minutes, is_trial, price_cents, tutor_pay_cents) values
  ('professional', 50, false, 2500, 1300),
  ('professional', 25, false, 1250,  650),
  ('professional', 25, true,   799,  650),
  ('community',    50, false, 1000,  500),
  ('community',    25, false,  500,  250),
  ('community',    25, true,   399,  250)
on conflict (tier, duration_minutes, is_trial) do update
  set price_cents     = excluded.price_cents,
      tutor_pay_cents = excluded.tutor_pay_cents;

-- The per-lesson pay ceiling. The incentive ladder runs to $18 effective, but
-- only the first $14.50 may be paid as a per-lesson rate: at the deepest
-- annual price ($20.00) even $14.50 leaves just 25%, and $18 would leave 7%.
-- Money above the cap is a bonus pool funded from breakage already collected,
-- where a bad month shrinks the pool instead of inverting the margin.
alter table public.lesson_pricing drop constraint if exists lesson_pricing_pay_ceiling;
alter table public.lesson_pricing add constraint lesson_pricing_pay_ceiling
  check (tutor_pay_cents <= duration_minutes * 29);  -- $14.50 per 50 min

-- ---------------------------------------------------------------------------
-- 3. No group plans; a plan sells lessons, not minutes
-- ---------------------------------------------------------------------------
delete from public.subscription_plan_prices where plan_key = 'group_25';
delete from public.subscription_plans       where plan_key = 'group_25';

-- The trigger reads these, so it is dropped before the columns move.
drop trigger if exists subscription_plan_prices_margin on public.subscription_plan_prices;

alter table public.subscription_plans
  drop column if exists is_group,
  drop column if exists duration_minutes;

alter table public.subscription_plans drop constraint if exists subscription_plans_allowed_tiers_check;
alter table public.subscription_plans add constraint subscription_plans_allowed_tiers_check
  check (
    allowed_tiers <@ array['community','professional']::text[]
    and array_length(allowed_tiers, 1) > 0
  );

comment on table public.subscription_plans is
  'Sellable lesson plans. per_lesson_cents prices a 50-MINUTE lesson; a '
  '25-minute booking costs half a credit and half the money. Seeded inactive: '
  'a plan becomes buyable only when an admin activates it.';

-- Rebuilt for the simplified model: no group split, and the floor is the
-- 50-minute pay of the most expensive tier the plan may book.
create or replace function public.subscription_plan_prices_margin_ok()
returns trigger language plpgsql as $$
declare
  v_plan          public.subscription_plans%rowtype;
  worst_pay_cents int;
  effective_cents int;
begin
  select * into v_plan from public.subscription_plans where plan_key = new.plan_key;

  select max(tutor_pay_cents) into worst_pay_cents
    from public.lesson_pricing
   where tier = any(v_plan.allowed_tiers)
     and duration_minutes = 50
     and not is_trial;

  if worst_pay_cents is null then
    raise exception 'plan % has no 50-minute lesson_pricing row for its tiers',
      new.plan_key;
  end if;

  effective_cents := round(v_plan.per_lesson_cents * (10000 - new.discount_bps) / 10000.0);

  if effective_cents <= worst_pay_cents then
    raise exception
      'plan % at %/week for % months sells a lesson for %c but the tutor is paid %c',
      new.plan_key, new.lessons_per_week, new.term_months,
      effective_cents, worst_pay_cents;
  end if;

  new.total_cents := round(
    effective_cents * new.lessons_per_week * public.weeks_per_month() * new.term_months
  );

  return new;
end;
$$;

create trigger subscription_plan_prices_margin
  before insert or update on public.subscription_plan_prices
  for each row execute function public.subscription_plan_prices_margin_ok();

-- ---------------------------------------------------------------------------
-- 4. Cancellation and refunds
-- ---------------------------------------------------------------------------
-- Two obligations that are not optional in the UK/EU, recorded on the
-- subscription so a refund can be explained months later:
--
--   * 14-day withdrawal on distance contracts. Service already delivered may
--     be charged pro-rata; the rest is refunded.
--   * A term plan cancelled mid-term refunds the UNUSED WHOLE MONTHS at the
--     MONTHLY rate, not the discounted term rate. The student loses the
--     discount they were only entitled to by committing to the term, which is
--     proportionate; keeping nine months of an annual prepay for nothing
--     delivered is the term that gets challenged as unfair.
--
-- Breakage inside a live term (the student who has 3 credits and uses 2) is
-- unaffected by any of this and is where the model's margin actually comes
-- from. Breakage from cancelled term plans is upside we do not count.
alter table public.user_subscriptions
  add column if not exists ended_at        timestamptz,
  add column if not exists refunded_cents  int not null default 0
    check (refunded_cents >= 0),
  add column if not exists refund_reason   text
    check (refund_reason is null or refund_reason in (
      'withdrawal_14_day',   -- statutory cooling-off
      'term_cancelled',      -- unused whole months, at the monthly rate
      'goodwill',
      'chargeback'
    )),
  add column if not exists stripe_refund_id text;

-- What a mid-term cancellation owes the student, in cents.
--
-- Charges elapsed months at the plan's own MONTHLY price and refunds the
-- remainder of what they actually paid. A part-used month is not refunded --
-- the allowance for it was granted and available.
create or replace function public.subscription_refund_due(p_subscription_id uuid)
returns int language plpgsql stable as $$
declare
  sub            public.user_subscriptions%rowtype;
  paid_cents     int;
  monthly_cents  int;
  months_elapsed int;
  owed           int;
begin
  select * into sub from public.user_subscriptions where id = p_subscription_id;
  if not found then
    return 0;
  end if;

  select total_cents into paid_cents
    from public.subscription_plan_prices
   where plan_key = sub.plan_key
     and lessons_per_week = sub.lessons_per_week
     and term_months = sub.term_months;

  select total_cents into monthly_cents
    from public.subscription_plan_prices
   where plan_key = sub.plan_key
     and lessons_per_week = sub.lessons_per_week
     and term_months = 1;

  if paid_cents is null or monthly_cents is null then
    return 0;
  end if;

  -- Any part of a month counts as a whole month consumed.
  months_elapsed := least(
    sub.term_months,
    greatest(1, ceil(
      extract(epoch from (now() - sub.started_at)) / (30.44 * 86400)
    )::int)
  );

  owed := paid_cents - (monthly_cents * months_elapsed) - sub.refunded_cents;

  return greatest(0, owed);
end;
$$;

comment on function public.subscription_refund_due is
  'Cents owed on a mid-term cancellation: elapsed months charged at the plan '
  'monthly rate, remainder refunded. Never negative -- a student who has '
  'already had more value than they paid for is not billed extra.';

-- ---------------------------------------------------------------------------
-- 5. Reseed the catalogue
-- ---------------------------------------------------------------------------
delete from public.subscription_plan_prices
 where plan_key in ('standard_25', 'pro_25');
delete from public.subscription_plans
 where plan_key in ('standard_25', 'pro_25');

insert into public.subscription_plans
  (plan_key, name, description, allowed_tiers, per_lesson_cents, rollover_weeks, sort_order)
values
  ('community', 'Community',
   'Live lessons with community tutors. 50 minutes, or two 25-minute lessons.',
   array['community'], 1000, 1.0, 1),
  ('professional', 'Professional',
   'Live lessons with any tutor, including professional.',
   array['community','professional'], 2500, 1.0, 2)
on conflict (plan_key) do update
  set name             = excluded.name,
      description      = excluded.description,
      allowed_tiers    = excluded.allowed_tiers,
      per_lesson_cents = excluded.per_lesson_cents;

-- Terms at -0% / -10% / -20%. The annual discount stops at 20% because
-- professional then sells at $20.00 against $13.00 of tutor pay -- 32% before
-- any breakage, which is the floor that has to hold when breakage is zero.
do $$
declare p text; w int; t int; d int;
begin
  foreach p in array array['community','professional'] loop
    foreach w in array array[1,2,3,5] loop
      foreach t in array array[1,3,12] loop
        d := case t when 1 then 0 when 3 then 1000 else 2000 end;
        insert into public.subscription_plan_prices
          (plan_key, lessons_per_week, term_months, discount_bps)
        values (p, w, t, d)
        on conflict (plan_key, lessons_per_week, term_months) do update
          set discount_bps = excluded.discount_bps;
      end loop;
    end loop;
  end loop;
end $$;
