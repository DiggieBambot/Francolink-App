-- Lesson credits: the subscription half of the booking system.
--
-- A student buys a plan (N lessons per week for a term) and spends the credits
-- it grants on bookings. Design notes in docs/PLAN-subscriptions.md.
--
-- Two rules this file encodes, both of them money rules:
--
--   * The ledger is APPEND-ONLY. Balance is sum(delta), never a stored counter.
--     Credits are money and we will be asked to explain a balance months later;
--     a mutable integer column cannot answer that.
--
--   * A plan may never sell a lesson below what the tutor is paid for it.
--     lesson_pricing enforces this for one-off bookings
--     (lesson_pricing_margin_ok). Subscriptions bypass that table, so the same
--     floor is enforced here — see subscription_plan_prices_margin_ok below.
--
-- Nothing in this file charges anyone. Stripe wiring is deliberately a later
-- step: credits can be issued by an admin, so the whole booking-with-credits
-- path is exercisable with real students before any billing code exists.

-- ---------------------------------------------------------------------------
-- Plan catalogue
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_plans (
  plan_key         text primary key,
  name             text not null,
  description      text,

  -- Which lesson_pricing tiers this plan may book. Drives both entitlement
  -- and the margin floor below.
  allowed_tiers    text[] not null check (
    allowed_tiers <@ array['community','certified','professional']::text[]
    and array_length(allowed_tiers, 1) > 0
  ),

  duration_minutes int not null check (duration_minutes in (25, 50)),
  is_group         boolean not null default false,

  -- Monthly list rate for one lesson, before any term discount.
  per_lesson_cents int not null check (per_lesson_cents > 0),

  -- How many credits carry into the next week. Product rule is "one week's
  -- worth", expressed as a multiple of the weekly grant.
  rollover_weeks   numeric(3,1) not null default 1.0 check (rollover_weeks >= 0),

  active           boolean not null default false,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now()
);

comment on table public.subscription_plans is
  'Sellable lesson plans. Seeded inactive: a plan becomes buyable only when an '
  'admin activates it, so half-configured pricing can never reach checkout.';

-- ---------------------------------------------------------------------------
-- One row per sellable combination of plan x lessons/week x term
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_plan_prices (
  plan_key         text not null references public.subscription_plans(plan_key) on delete cascade,
  lessons_per_week int  not null check (lessons_per_week between 1 and 20),
  term_months      int  not null check (term_months in (1, 3, 12)),

  -- Term discount in basis points. 2500 = -25%.
  discount_bps     int  not null default 0 check (discount_bps between 0 and 5000),

  -- What the student is charged for the whole term, computed by the trigger
  -- below rather than trusted from the caller.
  total_cents      int  not null default 0,

  -- One Stripe Price per (plan, term); lessons_per_week is the subscription
  -- item QUANTITY. 45 Price objects would drift; 9 will not.
  stripe_price_id  text,

  currency         text not null default 'USD',
  primary key (plan_key, lessons_per_week, term_months)
);

-- Average weeks in a month. Billing multiplies by this, so it lives in one
-- place rather than being retyped as 4.33 at each call site.
create or replace function public.weeks_per_month() returns numeric
  language sql immutable as $$ select 4.33::numeric $$;

-- The margin floor. A CHECK constraint cannot run the subquery this needs
-- (the tutor pay for the plan's tiers lives in lesson_pricing), so it is a
-- trigger. Same rule as lesson_pricing_margin_ok, enforced one level up.
create or replace function public.subscription_plan_prices_margin_ok()
returns trigger language plpgsql as $$
declare
  v_plan          public.subscription_plans%rowtype;
  worst_pay_cents int;
  effective_cents int;
begin
  select * into v_plan from public.subscription_plans where plan_key = new.plan_key;

  -- The most expensive tutor the plan may book, at the plan's lesson length.
  select max(tutor_pay_cents) into worst_pay_cents
    from public.lesson_pricing
   where tier = any(v_plan.allowed_tiers)
     and duration_minutes = v_plan.duration_minutes
     and not is_trial;

  effective_cents := round(v_plan.per_lesson_cents * (10000 - new.discount_bps) / 10000.0);

  -- A group lesson pays the tutor once across the room, so the per-student
  -- floor is the pay split over the pessimistic case of two seats -- never the
  -- four-seat ideal, or a half-empty room loses money on every lesson.
  if v_plan.is_group then
    worst_pay_cents := ceil(worst_pay_cents / 2.0);
  end if;

  if worst_pay_cents is null then
    raise exception 'plan % has no lesson_pricing row for its tiers at % minutes',
      new.plan_key, v_plan.duration_minutes;
  end if;

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

drop trigger if exists subscription_plan_prices_margin on public.subscription_plan_prices;
create trigger subscription_plan_prices_margin
  before insert or update on public.subscription_plan_prices
  for each row execute function public.subscription_plan_prices_margin_ok();

-- ---------------------------------------------------------------------------
-- A student's live subscription
-- ---------------------------------------------------------------------------
create table if not exists public.user_subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.users(id) on delete cascade,
  plan_key               text not null references public.subscription_plans(plan_key) on delete restrict,
  lessons_per_week       int  not null check (lessons_per_week between 1 and 20),
  term_months            int  not null check (term_months in (1, 3, 12)),

  status text not null default 'active' check (status in (
    'active',
    'past_due',   -- payment failed; grants pause, existing credits still spend
    'canceled',
    'expired'
  )),

  stripe_subscription_id text unique,
  stripe_customer_id     text,

  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,

  -- Monday of the most recent weekly grant, in the student's timezone. The
  -- grant job is idempotent on this: re-running it the same week is a no-op.
  last_grant_week        date,

  started_at             timestamptz not null default now(),
  canceled_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- One live subscription per student. A second one would double-grant.
create unique index if not exists user_subscriptions_one_active_idx
  on public.user_subscriptions (user_id)
  where status in ('active', 'past_due');

create index if not exists user_subscriptions_grant_idx
  on public.user_subscriptions (status, last_grant_week);

-- ---------------------------------------------------------------------------
-- The ledger
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_credits (
  id              bigserial primary key,
  user_id         uuid not null references public.users(id) on delete cascade,
  subscription_id uuid references public.user_subscriptions(id) on delete set null,

  -- +N granted, -N spent or lapsed. Never zero: a zero row means a caller
  -- computed something wrong and we would rather know.
  delta           int not null check (delta <> 0),

  reason text not null check (reason in (
    'weekly_grant',
    'signup_grant',
    'booking',              -- spent on a confirmed booking
    'cancellation_refund',  -- student cancelled outside the 12h window
    'tutor_cancelled',
    'tutor_no_show',        -- refund plus a goodwill credit
    'rollover_expiry',      -- above the plan's rollover cap at grant time
    'subscription_ended',
    'admin_adjustment'
  )),

  booking_id      uuid references public.bookings(id) on delete set null,
  note            text,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

comment on table public.lesson_credits is
  'Append-only. Never UPDATE or DELETE a row -- correct a mistake by writing '
  'an offsetting admin_adjustment so the history stays readable.';

create index if not exists lesson_credits_balance_idx
  on public.lesson_credits (user_id, created_at desc);

-- One booking can never spend twice, whatever the application does.
create unique index if not exists lesson_credits_one_spend_per_booking_idx
  on public.lesson_credits (booking_id)
  where reason = 'booking';

-- Credits do not expire on a per-row timer. Instead the weekly grant clamps
-- the balance to (weekly grant + rollover), writing a rollover_expiry row for
-- the excess. That keeps balance a plain sum(delta) -- a per-row expiry filter
-- goes negative as soon as a lapsed grant is partly spent.
create or replace function public.credit_balance(p_user_id uuid)
returns int language sql stable as $$
  select coalesce(sum(delta), 0)::int
    from public.lesson_credits
   where user_id = p_user_id;
$$;

-- ---------------------------------------------------------------------------
-- Spending, without a double-spend race
-- ---------------------------------------------------------------------------
-- Two concurrent bookings both reading a balance of 1 would both pass an
-- application-level check. The advisory lock serialises spends per student for
-- the length of the transaction, so the second one sees the first.
create or replace function public.spend_credits(
  p_user_id    uuid,
  p_amount     int,
  p_booking_id uuid,
  p_reason     text default 'booking'
) returns bigint language plpgsql as $$
declare
  v_balance int;
  v_id      bigint;
begin
  if p_amount <= 0 then
    raise exception 'spend_credits: amount must be positive, got %', p_amount;
  end if;

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

-- The weekly grant. Idempotent on (subscription, week): the cron may run
-- twice, and a retry must not pay out twice.
create or replace function public.grant_weekly_credits(
  p_subscription_id uuid,
  p_week            date
) returns int language plpgsql as $$
declare
  sub      public.user_subscriptions%rowtype;
  v_plan   public.subscription_plans%rowtype;
  v_cap    int;
  v_excess int;
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

  -- Already granted for this week.
  if sub.last_grant_week is not null and sub.last_grant_week >= p_week then
    return 0;
  end if;

  select * into v_plan from public.subscription_plans where plan_key = sub.plan_key;

  insert into public.lesson_credits (user_id, subscription_id, delta, reason)
  values (sub.user_id, sub.id, sub.lessons_per_week, 'weekly_grant');

  -- Clamp to this week's grant plus the rollover allowance.
  v_cap := ceil(sub.lessons_per_week * (1 + v_plan.rollover_weeks));
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
-- Bookings pay with credits
-- ---------------------------------------------------------------------------
-- price_cents still records the attributed per-lesson value and tutor_pay_cents
-- is untouched, so tutor payout never has to know subscriptions exist.
alter table public.bookings
  add column if not exists paid_with text not null default 'stripe'
    check (paid_with in ('stripe', 'credit')),
  add column if not exists credit_ledger_id bigint
    references public.lesson_credits(id) on delete set null;

comment on column public.bookings.paid_with is
  'How this lesson was paid for. Does not affect tutor_pay_cents.';

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.user_subscriptions_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_subscriptions_touch on public.user_subscriptions;
create trigger user_subscriptions_touch before update on public.user_subscriptions
  for each row execute function public.user_subscriptions_touch();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.subscription_plans        enable row level security;
alter table public.subscription_plan_prices  enable row level security;
alter table public.user_subscriptions        enable row level security;
alter table public.lesson_credits            enable row level security;

-- Plans and prices are public: the website quotes them before anyone logs in.
-- Only active ones, so a plan being configured is not visible.
drop policy if exists "anyone reads active plans" on public.subscription_plans;
create policy "anyone reads active plans" on public.subscription_plans for select
  using (active);

drop policy if exists "anyone reads active plan prices" on public.subscription_plan_prices;
create policy "anyone reads active plan prices" on public.subscription_plan_prices for select
  using (exists (
    select 1 from public.subscription_plans p
     where p.plan_key = subscription_plan_prices.plan_key and p.active
  ));

-- A student reads their own subscription and their own ledger. All writes go
-- through the service role: a client that could insert into lesson_credits
-- could mint itself lessons.
drop policy if exists "student reads own subscription" on public.user_subscriptions;
create policy "student reads own subscription" on public.user_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "student reads own credits" on public.lesson_credits;
create policy "student reads own credits" on public.lesson_credits for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed: the three plans from docs/PLAN-subscriptions.md, all inactive.
-- Prices are seeded per term at 1 lesson/week; the rest of the grid is
-- generated below so the margin trigger vets every combination.
-- ---------------------------------------------------------------------------
insert into public.subscription_plans
  (plan_key, name, description, allowed_tiers, duration_minutes, is_group, per_lesson_cents, sort_order)
values
  ('group_25', 'Group', 'Small group lessons, 2-4 students',
   array['community','certified','professional'], 25, true,  699, 1),
  ('standard_25', 'Standard', 'One-to-one lessons with community and certified tutors',
   array['community','certified'], 25, false, 1299, 2),
  ('pro_25', 'Pro', 'One-to-one lessons with any tutor, including professional',
   array['community','certified','professional'], 25, false, 1599, 3)
on conflict (plan_key) do nothing;

do $$
declare
  p text;
  w int;
  t int;
  d int;
begin
  foreach p in array array['group_25','standard_25','pro_25'] loop
    foreach w in array array[1,2,3,5,10] loop
      foreach t in array array[1,3,12] loop
        d := case t when 1 then 0 when 3 then 1200 else 2500 end;
        insert into public.subscription_plan_prices
          (plan_key, lessons_per_week, term_months, discount_bps)
        values (p, w, t, d)
        on conflict (plan_key, lessons_per_week, term_months) do nothing;
      end loop;
    end loop;
  end loop;
end $$;
