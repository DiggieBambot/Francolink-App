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
