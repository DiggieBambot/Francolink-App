-- AI tutoring time: daily + monthly caps per plan, and extra hours to buy.
--
-- The AI tutor allowance moves from "messages per month" to minutes of active
-- tutoring time, capped per day and per month (like Claude's plans). When a
-- cap is reached, hours the student bought are drawn down instead.
--
-- Time is counted in seconds, per UTC day. All writes go through the service
-- role (the chat route and the Stripe webhook). Safe to run twice.

-- ── Daily ledger ──────────────────────────────────────────────────────────────
create table if not exists public.ai_tutor_time_usage (
  user_id        uuid not null references public.users(id) on delete cascade,
  day            date not null,
  -- Time charged against the plan's allowance.
  plan_seconds   int not null default 0,
  -- Time charged against purchased extra hours.
  extra_seconds  int not null default 0,
  primary key (user_id, day)
);

-- ── Extra hours balance ───────────────────────────────────────────────────────
create table if not exists public.ai_tutor_time_balance (
  user_id        uuid primary key references public.users(id) on delete cascade,
  extra_seconds  int not null default 0 check (extra_seconds >= 0),
  updated_at     timestamptz not null default now()
);

-- ── Purchases ─────────────────────────────────────────────────────────────────
create table if not exists public.ai_tutor_hour_purchases (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid not null references public.users(id) on delete cascade,
  pack_key                   text not null,
  seconds                    int not null check (seconds > 0),
  price_cents                int not null,
  currency                   text not null default 'USD',
  status                     text not null default 'pending'
                               check (status in ('pending', 'paid', 'abandoned')),
  stripe_checkout_session_id text unique,
  created_at                 timestamptz not null default now(),
  paid_at                    timestamptz
);

create index if not exists ai_tutor_hour_purchases_user_idx
  on public.ai_tutor_hour_purchases (user_id, created_at desc);

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Students read their own rows; admins read all. No client writes.
alter table public.ai_tutor_time_usage enable row level security;
alter table public.ai_tutor_time_balance enable row level security;
alter table public.ai_tutor_hour_purchases enable row level security;

drop policy if exists "Read own tutoring time" on public.ai_tutor_time_usage;
create policy "Read own tutoring time" on public.ai_tutor_time_usage for select to authenticated
  using (user_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN'));

drop policy if exists "Read own tutoring balance" on public.ai_tutor_time_balance;
create policy "Read own tutoring balance" on public.ai_tutor_time_balance for select to authenticated
  using (user_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN'));

drop policy if exists "Read own hour purchases" on public.ai_tutor_hour_purchases;
create policy "Read own hour purchases" on public.ai_tutor_hour_purchases for select to authenticated
  using (user_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN'));

-- ── Record tutoring time ──────────────────────────────────────────────────────
-- Charges p_seconds to the student: first to the plan (as far as today's and
-- this month's caps allow), the rest to purchased extra hours. Null caps mean
-- unlimited (admins and testers). Atomic, so two quick turns cannot both slip
-- through the same remaining minute.
create or replace function public.record_ai_tutor_time(
  p_user uuid,
  p_seconds int,
  p_daily_cap int,     -- seconds, or null for unlimited
  p_monthly_cap int    -- seconds, or null for unlimited
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_month_start date := date_trunc('month', v_today)::date;
  v_used_today int;
  v_used_month int;
  v_room int;
  v_plan int;
  v_extra int;
  v_balance int;
begin
  if p_seconds is null or p_seconds <= 0 then
    return jsonb_build_object('plan_seconds', 0, 'extra_seconds', 0);
  end if;

  -- Serialise this student's charges.
  perform pg_advisory_xact_lock(hashtext('ai_tutor_time:' || p_user::text));

  select coalesce(sum(plan_seconds) filter (where day = v_today), 0),
         coalesce(sum(plan_seconds), 0)
    into v_used_today, v_used_month
    from public.ai_tutor_time_usage
   where user_id = p_user and day >= v_month_start;

  v_room := p_seconds;
  if p_daily_cap is not null then v_room := least(v_room, p_daily_cap - v_used_today); end if;
  if p_monthly_cap is not null then v_room := least(v_room, p_monthly_cap - v_used_month); end if;
  v_plan := greatest(v_room, 0);

  select coalesce(extra_seconds, 0) into v_balance
    from public.ai_tutor_time_balance where user_id = p_user for update;
  v_extra := least(p_seconds - v_plan, coalesce(v_balance, 0));

  insert into public.ai_tutor_time_usage (user_id, day, plan_seconds, extra_seconds)
  values (p_user, v_today, v_plan, v_extra)
  on conflict (user_id, day) do update
     set plan_seconds  = ai_tutor_time_usage.plan_seconds + excluded.plan_seconds,
         extra_seconds = ai_tutor_time_usage.extra_seconds + excluded.extra_seconds;

  if v_extra > 0 then
    update public.ai_tutor_time_balance
       set extra_seconds = extra_seconds - v_extra, updated_at = now()
     where user_id = p_user;
  end if;

  return jsonb_build_object('plan_seconds', v_plan, 'extra_seconds', v_extra);
end;
$$;

-- ── Grant purchased hours ─────────────────────────────────────────────────────
-- Called by the Stripe webhook. Idempotent on the checkout session: Stripe
-- retries deliveries, and a second delivery must not grant the hours twice.
-- Returns the seconds granted (0 if already granted or not found).
create or replace function public.grant_ai_tutor_hours(p_session_id text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_seconds int;
begin
  update public.ai_tutor_hour_purchases
     set status = 'paid', paid_at = now()
   where stripe_checkout_session_id = p_session_id
     and status = 'pending'
  returning user_id, seconds into v_user, v_seconds;

  if v_user is null then
    return 0;
  end if;

  insert into public.ai_tutor_time_balance (user_id, extra_seconds)
  values (v_user, v_seconds)
  on conflict (user_id) do update
     set extra_seconds = ai_tutor_time_balance.extra_seconds + excluded.extra_seconds,
         updated_at = now();

  return v_seconds;
end;
$$;

revoke all on function public.record_ai_tutor_time(uuid, int, int, int) from public, anon, authenticated;
revoke all on function public.grant_ai_tutor_hours(text) from public, anon, authenticated;

-- ── Admin settings for the new caps ───────────────────────────────────────────
insert into public.app_settings (category, key, value, value_type, description, is_secret)
select v.category, v.key, v.value, v.value_type, v.description, false
  from (values
    ('ai', 'free_ai_daily_minutes', '0', 'number', 'AI tutoring minutes per day for free users (0 = no access).'),
    ('ai', 'free_ai_monthly_minutes', '0', 'number', 'AI tutoring minutes per month for free users (0 = no access).'),
    ('ai', 'premium_ai_daily_minutes', '15', 'number', 'AI tutoring minutes per day for Premium.'),
    ('ai', 'premium_ai_monthly_minutes', '180', 'number', 'AI tutoring minutes per month for Premium (180 = 3 h).'),
    ('ai', 'premium_plus_ai_daily_minutes', '45', 'number', 'AI tutoring minutes per day for Premium+.'),
    ('ai', 'premium_plus_ai_monthly_minutes', '600', 'number', 'AI tutoring minutes per month for Premium+ (600 = 10 h).')
  ) as v(category, key, value, value_type, description)
 where not exists (select 1 from public.app_settings s where s.key = v.key);
