-- Lessons expire 30 days after they are added.
--
-- This REPLACES the rollover cap. The cap held a balance at two weeks' worth
-- and silently burned anything above it at the moment of the next grant, which
-- is both harsher and harder to say out loud than "your lessons are good for
-- 30 days". One rule, one sentence, and a student can check it themselves.
--
-- ---------------------------------------------------------------------------
-- Why this is not simply `where expires_at > now()` on the balance
-- ---------------------------------------------------------------------------
-- That was the obvious design and it is wrong. Consider a grant of 3 that
-- lapses, and a spend of 1 taken from it while it was live:
--
--     +3 (lapsed)   -1 (spend)     filtered balance = -1
--
-- The spend survives the filter and the grant it came from does not, so the
-- balance goes negative and stays there. Spends are not attached to the grant
-- that funded them, and making them so would mean lot-tracking on every row.
--
-- Instead the ledger stays flat, balance stays a plain sum(delta), and a sweep
-- works out what actually lapsed:
--
--     expired_granted  = everything granted with expires_at <= now
--     consumed         = every negative row ever (spends AND past expiries)
--     still_unspent    = max(0, expired_granted - consumed)
--     to_expire        = min(still_unspent, current balance)
--
-- Because consumption is counted against the oldest grants first, this IS
-- FIFO -- the arithmetic does the lot-tracking without the bookkeeping. Past
-- expiry rows count as consumption, so nothing is ever expired twice.

-- ---------------------------------------------------------------------------
-- 1. Grants carry an expiry date
-- ---------------------------------------------------------------------------
alter table public.lesson_credits
  add column if not exists expires_at timestamptz;

comment on column public.lesson_credits.expires_at is
  'Set on grant rows only. Informational for the ledger and the date shown to '
  'the student -- the BALANCE is never filtered on it (see expire_stale_credits).';

create index if not exists lesson_credits_expiry_idx
  on public.lesson_credits (user_id, expires_at)
  where expires_at is not null and delta > 0;

-- A distinct reason, so "your 30 days ran out" reads differently from
-- "your plan ended" in the student's history.
alter table public.lesson_credits drop constraint if exists lesson_credits_reason_check;
alter table public.lesson_credits add constraint lesson_credits_reason_check
  check (reason in (
    'weekly_grant',
    'signup_grant',
    'booking',
    'cancellation_refund',
    'tutor_cancelled',
    'tutor_no_show',
    'rollover_expiry',   -- retired; kept so existing rows stay valid
    'lapsed_30_day',
    'subscription_ended',
    'admin_adjustment'
  ));

-- How long a granted lesson stays usable.
create or replace function public.credit_lifetime_days() returns int
  language sql immutable as $$ select 30 $$;

-- ---------------------------------------------------------------------------
-- 2. Grant weekly, with an expiry, and no cap
-- ---------------------------------------------------------------------------
create or replace function public.grant_weekly_credits(
  p_subscription_id uuid,
  p_week            date
) returns numeric language plpgsql as $$
declare
  sub public.user_subscriptions%rowtype;
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

  insert into public.lesson_credits
    (user_id, subscription_id, delta, reason, expires_at)
  values (
    sub.user_id, sub.id, sub.lessons_per_week, 'weekly_grant',
    now() + (public.credit_lifetime_days() || ' days')::interval
  );

  update public.user_subscriptions
     set last_grant_week = p_week, updated_at = now()
   where id = sub.id;

  return sub.lessons_per_week;
end;
$$;

-- rollover_weeks no longer does anything. Left on the table rather than
-- dropped so a rollback of this migration does not lose the column, but
-- nothing reads it.
comment on column public.subscription_plans.rollover_weeks is
  'RETIRED. Superseded by the 30-day expiry in 20260825_credit_expiry.sql. '
  'Nothing reads this.';

-- ---------------------------------------------------------------------------
-- 3. The sweep
-- ---------------------------------------------------------------------------
-- Expire one student's lapsed lessons. Returns how many were taken.
create or replace function public.expire_stale_credits(p_user_id uuid)
returns numeric language plpgsql as $$
declare
  expired_granted numeric;
  consumed        numeric;
  still_unspent   numeric;
  balance         numeric;
  to_expire       numeric;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select coalesce(sum(delta), 0) into expired_granted
    from public.lesson_credits
   where user_id = p_user_id
     and delta > 0
     and expires_at is not null
     and expires_at <= now();

  -- Every negative row, spends and previous expiries alike. Counting past
  -- expiries here is what stops the same lapsed grant being taken twice.
  select coalesce(-sum(delta), 0) into consumed
    from public.lesson_credits
   where user_id = p_user_id and delta < 0;

  still_unspent := greatest(0, expired_granted - consumed);
  if still_unspent <= 0 then
    return 0;
  end if;

  balance := public.credit_balance(p_user_id);
  to_expire := least(still_unspent, balance);

  if to_expire <= 0 then
    return 0;
  end if;

  insert into public.lesson_credits (user_id, delta, reason, note)
  values (
    p_user_id, -to_expire, 'lapsed_30_day',
    format('unused for %s days', public.credit_lifetime_days())
  );

  return to_expire;
end;
$$;

comment on function public.expire_stale_credits is
  'Expires one student''s lapsed lessons, FIFO. Safe to run repeatedly: past '
  'expiry rows count as consumption, so nothing is taken twice.';

-- Who currently has something to expire. The cron reads this rather than
-- sweeping every user on the platform every hour.
create or replace function public.users_with_stale_credits()
returns table (user_id uuid) language sql stable as $$
  select c.user_id
    from public.lesson_credits c
   group by c.user_id
  having coalesce(sum(c.delta), 0) > 0
     and greatest(
           0,
           coalesce(sum(c.delta) filter (
             where c.delta > 0 and c.expires_at is not null and c.expires_at <= now()
           ), 0)
           - coalesce(-sum(c.delta) filter (where c.delta < 0), 0)
         ) > 0;
$$;

-- ---------------------------------------------------------------------------
-- 4. Backfill: credits granted before this migration had no expiry date
-- ---------------------------------------------------------------------------
-- Give them the full 30 days from now rather than from when they were granted.
-- Expiring someone's balance the instant a migration lands is not a thing to
-- do to a paying student.
update public.lesson_credits
   set expires_at = now() + (public.credit_lifetime_days() || ' days')::interval
 where delta > 0
   and expires_at is null
   and reason in ('weekly_grant', 'signup_grant', 'admin_adjustment');
