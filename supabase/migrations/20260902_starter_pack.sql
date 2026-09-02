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
