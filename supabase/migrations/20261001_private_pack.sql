-- The private pack: ten professional lessons at $18, for invited students only.
--
-- Built for students who already pay $18 a lesson elsewhere and are moving to
-- FrancoLink. The public 3-pack gets them in the door at that price; this is
-- what keeps them at it afterwards, instead of stepping up to $25 list.
--
-- It is a row in starter_packs rather than a table of its own, so everything
-- downstream -- the Stripe webhook, grant_starter_pack(), student_allowed_tiers()
-- -- already understands it. What differs from a starter pack:
--
--   visibility  'private' packs are never listed, never readable by anon, and
--               sold only to an email on private_pack_invites.
--   repeatable  the one-paid-pack-per-person index now covers PUBLIC packs
--               only. A private student buys the ten again when they run out.
--   credit_days ten lessons do not fit in 30 days at one a week, so a pack may
--               carry its own lifetime. Null means the platform default.
--
-- Margin: $18.00 a lesson against $13.00 of professional pay clears the
-- starter_packs_margin_ok() floor, and one Stripe fee is spread over ten.

-- ---------------------------------------------------------------------------
-- 1. The catalogue
-- ---------------------------------------------------------------------------
alter table public.starter_packs
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'private')),
  add column if not exists credit_days int
    check (credit_days is null or credit_days > 0);

comment on column public.starter_packs.visibility is
  'public: listed and sold to anyone, once. private: unlisted, sold only to '
  'emails on private_pack_invites, repeatable.';
comment on column public.starter_packs.credit_days is
  'How long this pack''s lessons last. Null = credit_lifetime_days().';

-- The price of a private pack is nobody's business but the invitee's.
drop policy if exists "anyone reads starter packs" on public.starter_packs;
create policy "anyone reads starter packs" on public.starter_packs
  for select using (visibility = 'public');

-- ---------------------------------------------------------------------------
-- 2. Purchases snapshot both, like they snapshot the price
-- ---------------------------------------------------------------------------
alter table public.starter_pack_purchases
  add column if not exists pack_visibility text not null default 'public'
    check (pack_visibility in ('public', 'private')),
  add column if not exists credit_days int;

-- One PUBLIC pack per person, ever. Private packs repeat.
drop index if exists public.starter_pack_purchases_one_paid;
create unique index if not exists starter_pack_purchases_one_paid
  on public.starter_pack_purchases (user_id)
  where status = 'paid' and pack_visibility = 'public';

-- ---------------------------------------------------------------------------
-- 3. Who may buy a private pack
-- ---------------------------------------------------------------------------
-- Keyed on email, not user id: the student is invited before they have an
-- account. Checkout matches it against the signed-in user's email.
create table if not exists public.private_pack_invites (
  id          uuid primary key default gen_random_uuid(),
  pack_key    text not null references public.starter_packs(pack_key) on delete restrict,
  email       text not null check (email = lower(trim(email)) and email like '%@%'),
  note        text,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);

create unique index if not exists private_pack_invites_live
  on public.private_pack_invites (pack_key, email)
  where revoked_at is null;

-- Service role only. No policies: students never read the list.
alter table public.private_pack_invites enable row level security;

-- ---------------------------------------------------------------------------
-- 4. Granting honours the pack's own lifetime
-- ---------------------------------------------------------------------------
create or replace function public.grant_starter_pack(p_session_id text)
returns numeric language plpgsql as $$
declare
  pp public.starter_pack_purchases%rowtype;
  lifetime interval;
begin
  select * into pp from public.starter_pack_purchases
   where stripe_checkout_session_id = p_session_id
   for update;

  if not found then
    raise exception 'grant_starter_pack: no purchase for session %', p_session_id;
  end if;

  if pp.status = 'paid' then
    return 0;
  end if;

  lifetime := (coalesce(pp.credit_days, public.credit_lifetime_days()) || ' days')::interval;

  update public.starter_pack_purchases
     set status     = 'paid',
         paid_at    = now(),
         expires_at = now() + lifetime
   where id = pp.id;

  insert into public.lesson_credits
    (user_id, delta, reason, expires_at, note)
  values (pp.user_id, pp.lessons, 'starter_pack', now() + lifetime, pp.pack_key);

  return pp.lessons;
end;
$$;

create or replace function public.grant_starter_pack_by_id(p_purchase_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  pp public.starter_pack_purchases%rowtype;
  lifetime interval;
begin
  select * into pp from public.starter_pack_purchases
   where id = p_purchase_id
   for update;

  if not found then
    raise exception 'grant_starter_pack_by_id: no purchase %', p_purchase_id;
  end if;

  if pp.status = 'paid' then
    return 0;
  end if;

  lifetime := (coalesce(pp.credit_days, public.credit_lifetime_days()) || ' days')::interval;

  update public.starter_pack_purchases
     set status     = 'paid',
         paid_at    = now(),
         expires_at = now() + lifetime
   where id = pp.id;

  insert into public.lesson_credits
    (user_id, delta, reason, expires_at, note)
  values (pp.user_id, pp.lessons, 'starter_pack', now() + lifetime, pp.pack_key);

  return pp.lessons;
end;
$$;

revoke all on function public.grant_starter_pack_by_id(uuid) from public, anon;

-- ---------------------------------------------------------------------------
-- 5. The pack itself
-- ---------------------------------------------------------------------------
-- 120 days: ten lessons at one a week, with a month of slack for holidays.
-- sort_order is irrelevant while it is private but kept clear of the public two.
insert into public.starter_packs
  (pack_key, tier, lessons, price_cents, visibility, credit_days, sort_order)
values
  ('private_professional_10', 'professional', 10, 18000, 'private', 120, 10)
on conflict (pack_key) do update
  set tier        = excluded.tier,
      lessons     = excluded.lessons,
      price_cents = excluded.price_cents,
      visibility  = excluded.visibility,
      credit_days = excluded.credit_days;
