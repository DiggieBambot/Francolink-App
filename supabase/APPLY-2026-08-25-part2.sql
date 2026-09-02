-- ===========================================================================
-- FrancoLink — part 2: the starter pack
-- Paste into the Supabase SQL Editor and Run, AFTER part 1 has committed.
-- ===========================================================================
--
-- Three lessons, one purchase, then a subscription. Replaces both the single
-- discounted trial lesson and the intro month:
--
--   1 trial  @ $14.99  ->  $14.99 in, $13.00 out,  $1.26 net
--   3 trials @ $14.99  ->  $44.97 in, $39.00 out,  $1.16 net  (three Stripe fees)
--   3-pack   @ $18.00  ->  $54.00 in, $39.00 out, $13.13 net  (one fee)
--
-- Prices: professional 3 x $18.00 = $54.00, community 3 x $8.00 = $24.00.
-- Both are exact percentages of list (28% and 20% off), so the offer stays
-- describable in one line.
--
-- REQUIRES PART 1 (APPLY-2026-08-25.sql) TO HAVE COMMITTED FIRST. This file
-- checks that itself and aborts with a clear message if not, so running it
-- early is safe -- it just refuses.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- Refuse to run out of order.
-- ---------------------------------------------------------------------------
-- Part 2 depends on part 1 twice over: the intro_discount_bps column it zeroes
-- (20260831) and the $6.50 community tutor pay the starter-pack margin trigger
-- validates against (20260827). Run out of order, the community pack at $8.00
-- a lesson would be checked against the OLD $5.00 rate and pass for the wrong
-- reason -- which is exactly the kind of thing that passes silently and is
-- found months later in the accounts.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'subscription_plans'
       and column_name  = 'intro_discount_bps'
  ) then
    raise exception
      'Part 1 has not been applied. Run APPLY-2026-08-25.sql first, then this file.';
  end if;

  if not exists (
    select 1 from public.lesson_pricing
     where tier = 'community' and duration_minutes = 50
       and not is_trial and tutor_pay_cents = 650
  ) then
    raise exception
      'Community tutor pay is not $6.50 yet — 20260827 has not been applied. Run APPLY-2026-08-25.sql first.';
  end if;
end $$;


-- ###########################################################################
-- ## 20260901_defer_intro_month.sql
-- ###########################################################################

-- The intro month is switched off, not removed.
--
-- 20260831_intro_offer.sql built a discounted first MONTH and set it live at
-- 40%/30%. It is the right long-run entrance -- it puts the student on a plan
-- from day one, so continuing is the default rather than a second decision --
-- but it commits us to 4.33 lessons per signup and then auto-renews into more.
-- With one founder and a handful of teachers that is a habit we cannot yet
-- staff, and selling a habit we cannot staff is worse than selling a smaller
-- thing we can. The starter pack in 20260902 is that smaller thing: exactly
-- three lessons per signup.
--
-- Re-enabling is one statement, whenever supply catches up:
--
--   update public.subscription_plans set intro_discount_bps = 4000
--    where plan_key = 'professional';
--   update public.subscription_plans set intro_discount_bps = 3000
--    where plan_key = 'community';
--
-- (3000 and not 4000 at community: 40% off $10.00 is $6.00 against $6.50 of
-- tutor pay. The trigger from 20260831 refuses it, which is the point of it.)
--
-- ---------------------------------------------------------------------------
-- Also correcting the record
-- ---------------------------------------------------------------------------
-- 20260831 justifies itself partly by saying the trial "was sold below what we
-- pay the tutor -- $7.99 against $13.00 professional". That is wrong. $7.99 is
-- the 25-MINUTE trial and it pays the 25-minute rate of $6.50, not the
-- 50-minute rate of $13.00. The trial was thin but never a loss:
--
--   professional 25min  $7.99 / $6.50 pay   +$1.49
--   community    25min  $3.99 / $3.25 pay   +$0.74
--
-- The trial is retired anyway, for a different and better reason: three of
-- them sold separately net less than one (see 20260902). The existing is_trial
-- rows are left in lesson_pricing rather than deleted -- nothing reads them
-- now that bookings are credit-only, and dropping priced history buys nothing.

update public.subscription_plans set intro_discount_bps = 0;

-- ###########################################################################
-- ## 20260902_starter_pack.sql
-- ###########################################################################

-- The starter pack: three lessons, one purchase, then a subscription.
--
-- ---------------------------------------------------------------------------
-- Why a pack and not three trials
-- ---------------------------------------------------------------------------
-- Three separately-sold trial lessons net LESS than one. At $14.99 against
-- $13.00 of tutor pay each lesson grosses $1.99, and Stripe's 30c fixed fee
-- lands on all three charges:
--
--   1 trial   @ $14.99   ->  $14.99 in, $13.00 out, $1.26 net
--   3 trials  @ $14.99   ->  $44.97 in, $39.00 out, $1.16 net   (three fees)
--   3-pack    @ $18.00   ->  $54.00 in, $39.00 out, $13.13 net  (one fee)
--
-- Same three lessons of tutor time. Ten times the margin, and one purchase
-- decision instead of three places to drop out.
--
-- ---------------------------------------------------------------------------
-- Why this and not the intro month, yet
-- ---------------------------------------------------------------------------
-- An intro month (20260831_intro_offer.sql, currently switched off) commits us
-- to 4.33 lessons per signup and then auto-renews into more. With one founder
-- and a handful of teachers that is a habit we cannot yet staff. A pack
-- commits us to exactly three lessons per signup, which is the size of the
-- supply we actually have. The intro month stays dormant until that changes.
--
-- ---------------------------------------------------------------------------
-- Entitlement
-- ---------------------------------------------------------------------------
-- Credits are a flat ledger with one balance, deliberately (see
-- 20260825_credit_expiry.sql). What tier that balance may BUY has until now
-- come from the student's subscription plan. A pack has no subscription, so
-- entitlement becomes a union of both sources -- see student_allowed_tiers().

create table if not exists public.starter_packs (
  pack_key    text primary key,
  tier        text not null check (tier in ('community', 'professional')),
  lessons     int  not null check (lessons > 0),
  price_cents int  not null check (price_cents > 0),
  currency    text not null default 'USD',
  active      boolean not null default true,
  sort_order  int not null default 0
);

comment on table public.starter_packs is
  'One-off blocks of lessons sold to students who have no plan yet. Priced by '
  'us, per tier, exactly like lesson_pricing -- tutors do not set these.';

alter table public.starter_packs enable row level security;
drop policy if exists "anyone reads starter packs" on public.starter_packs;
create policy "anyone reads starter packs" on public.starter_packs
  for select using (true);

-- The margin floor, same rule as everywhere else: what we charge per lesson
-- must clear what we pay the tutor for one. A pack that loses money on every
-- lesson is not a marketing decision, it is a bug.
create or replace function public.starter_packs_margin_ok()
returns trigger language plpgsql as $$
declare
  worst_pay_cents int;
  per_lesson      int;
begin
  select max(tutor_pay_cents) into worst_pay_cents
    from public.lesson_pricing
   where tier = new.tier and duration_minutes = 50 and not is_trial;

  per_lesson := new.price_cents / new.lessons;

  if worst_pay_cents is not null and per_lesson <= worst_pay_cents then
    raise exception
      'starter pack % sells a lesson for %c but the tutor is paid %c',
      new.pack_key, per_lesson, worst_pay_cents;
  end if;

  return new;
end;
$$;

drop trigger if exists starter_packs_margin_ok on public.starter_packs;
create trigger starter_packs_margin_ok
  before insert or update on public.starter_packs
  for each row execute function public.starter_packs_margin_ok();

-- $18.00 and $8.00 a lesson. Both are exact percentages of list ($25.00 and
-- $10.00 -> 28% and 20% off), which keeps the offer describable in one line.
-- Community cannot take professional's 28%: $7.20 against $6.50 of pay is 70c
-- a lesson, which is the three-trials problem again.
insert into public.starter_packs (pack_key, tier, lessons, price_cents, sort_order)
values
  ('starter_professional', 'professional', 3, 5400, 2),
  ('starter_community',    'community',    3, 2400, 1)
on conflict (pack_key) do update
  set tier        = excluded.tier,
      lessons     = excluded.lessons,
      price_cents = excluded.price_cents;

-- ---------------------------------------------------------------------------
-- Purchases
-- ---------------------------------------------------------------------------
create table if not exists public.starter_pack_purchases (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  pack_key    text not null references public.starter_packs(pack_key) on delete restrict,
  -- Snapshot, for the same reason bookings snapshot their price: the pack
  -- catalogue will change and a purchase must stay what it was.
  tier        text not null,
  lessons     int  not null,
  price_cents int  not null,
  currency    text not null default 'USD',
  status      text not null default 'pending'
              check (status in ('pending', 'paid', 'abandoned')),
  stripe_checkout_session_id text unique,
  -- Entitlement runs out with the credits, so it carries the same 30 days.
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  paid_at     timestamptz
);

create index if not exists starter_pack_purchases_user_idx
  on public.starter_pack_purchases (user_id, status);

-- A starter pack is a starter. One per person, ever -- otherwise it is just a
-- cheaper way to buy lessons forever and the subscription never happens.
create unique index if not exists starter_pack_purchases_one_paid
  on public.starter_pack_purchases (user_id)
  where status = 'paid';

alter table public.starter_pack_purchases enable row level security;
drop policy if exists "student reads own packs" on public.starter_pack_purchases;
create policy "student reads own packs" on public.starter_pack_purchases
  for select using (auth.uid() = user_id);

-- The ledger needs a reason for where these credits came from.
alter table public.lesson_credits drop constraint if exists lesson_credits_reason_check;
alter table public.lesson_credits add constraint lesson_credits_reason_check
  check (reason in (
    'weekly_grant',
    'signup_grant',
    'starter_pack',
    'booking',
    'cancellation_refund',
    'tutor_cancelled',
    'tutor_no_show',
    'rollover_expiry',
    'lapsed_30_day',
    'subscription_ended',
    'admin_adjustment'
  ));

-- ---------------------------------------------------------------------------
-- Entitlement: which tiers may this student's credits buy?
-- ---------------------------------------------------------------------------
-- Union of every live source. A professional pack buys community tutors too,
-- mirroring subscription_plans.allowed_tiers -- paying the higher rate should
-- never buy you less.
create or replace function public.student_allowed_tiers(p_user_id uuid)
returns text[] language sql stable as $$
  select coalesce(array_agg(distinct t), '{}')
    from (
      -- from a live subscription
      select unnest(p.allowed_tiers) as t
        from public.user_subscriptions s
        join public.subscription_plans p on p.plan_key = s.plan_key
       where s.user_id = p_user_id
         and s.status in ('active', 'past_due')

      union

      -- from a paid starter pack whose entitlement has not run out
      select unnest(
               case when pk.tier = 'professional'
                    then array['community', 'professional']
                    else array['community'] end
             ) as t
        from public.starter_pack_purchases pp
        join public.starter_packs pk on pk.pack_key = pp.pack_key
       where pp.user_id = p_user_id
         and pp.status = 'paid'
         and (pp.expires_at is null or pp.expires_at > now())
    ) sources;
$$;

comment on function public.student_allowed_tiers is
  'Every tutor tier this student may currently spend credits on, from a '
  'subscription or a starter pack. Empty array means they may spend none.';

-- ---------------------------------------------------------------------------
-- Granting the pack
-- ---------------------------------------------------------------------------
-- Called from the Stripe webhook. Idempotent on the session id: Stripe retries
-- deliveries, and a second one must not grant a second pack.
create or replace function public.grant_starter_pack(p_session_id text)
returns numeric language plpgsql as $$
declare
  pp public.starter_pack_purchases%rowtype;
begin
  select * into pp from public.starter_pack_purchases
   where stripe_checkout_session_id = p_session_id
   for update;

  if not found then
    raise exception 'grant_starter_pack: no purchase for session %', p_session_id;
  end if;

  -- Already granted. Returning 0 rather than raising: a retry is normal
  -- traffic, not an error anyone needs to see.
  if pp.status = 'paid' then
    return 0;
  end if;

  update public.starter_pack_purchases
     set status     = 'paid',
         paid_at    = now(),
         expires_at = now() + (public.credit_lifetime_days() || ' days')::interval
   where id = pp.id;

  insert into public.lesson_credits
    (user_id, delta, reason, expires_at, note)
  values (
    pp.user_id, pp.lessons, 'starter_pack',
    now() + (public.credit_lifetime_days() || ' days')::interval,
    pp.pack_key
  );

  return pp.lessons;
end;
$$;

comment on function public.grant_starter_pack is
  'Marks a pack paid and credits the lessons. Idempotent on the Stripe session '
  'id, because Stripe retries webhook deliveries.';

commit;

-- ===========================================================================
-- Check — run separately after the commit succeeds.
-- ===========================================================================
-- select pack_key, tier, lessons, price_cents,
--        price_cents / lessons as per_lesson
--   from public.starter_packs order by sort_order;
-- Expect: starter_community 3 2400 800 | starter_professional 3 5400 1800
--
-- select public.student_allowed_tiers('00000000-0000-0000-0000-000000000000');
-- Expect: {}   (a stranger is entitled to nothing)
