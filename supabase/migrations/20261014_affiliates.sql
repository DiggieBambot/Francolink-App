-- Creator affiliate program.
--
-- Outside creators (YouTubers, TikTokers, teachers with an audience) promote
-- FrancoLink and earn a share of what their referrals pay. This is deliberately
-- separate from the tutor referral system (users.referred_by_tutor_id):
--
--   * referred_by_tutor_id is not just "who referred you" -- it also puts the
--     student on that tutor's roster and unlocks self-study for free
--     (lib/access.ts). Pointing it at a creator would hand every creator's
--     audience free Premium.
--   * Creators are paid a percentage for a bounded window, not the tutor model.
--
-- The rules this schema supports (decided 2026-10-14):
--
--   * 20% (per-creator rate) of each self-study subscription payment, web
--     (Stripe) and mobile (Google Play via RevenueCat), for the first 12 months
--     after the customer's first commissionable payment.
--   * The customer gets 5% off their first payment with the creator's code.
--   * Commission is held 30 days before it is payable, so refunds inside the
--     window just cancel it. A refund after payout becomes a negative row that
--     nets against the next payout.
--   * Payouts are manual (PayPal / Wise); this records them, it moves no money.
--
-- Every table here is service-role only: RLS on, no policies. The creator
-- dashboard and admin pages authorize in the server and read with the service
-- client.

-- ---------------------------------------------------------------------------
-- Creators
-- ---------------------------------------------------------------------------
create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  -- What goes in the link (?ref=marie) and, uppercased, the Stripe promo code
  -- (MARIE). Stored lowercase; letters and digits only, because that is all a
  -- Stripe promotion code accepts.
  code text not null unique check (code ~ '^[a-z0-9]{3,24}$'),
  name text not null,
  email text not null,
  -- Their own FrancoLink account, if they have one. It is what lets them open
  -- the creator dashboard, and what blocks them from referring themselves.
  user_id uuid references public.users(id) on delete set null,
  commission_rate numeric(5,4) not null default 0.20
    check (commission_rate > 0 and commission_rate <= 0.5),
  discount_percent integer not null default 5
    check (discount_percent between 0 and 50),
  stripe_coupon_id text,
  stripe_promotion_code_id text,
  payout_method text check (payout_method in ('paypal', 'wise', 'bank', 'other')),
  payout_details text,
  status text not null default 'active' check (status in ('active', 'paused')),
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists affiliates_user_id_idx
  on public.affiliates (user_id) where user_id is not null;

-- ---------------------------------------------------------------------------
-- Who each customer belongs to. One creator per customer, set once.
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists referred_by_affiliate_id uuid
    references public.affiliates(id) on delete set null,
  add column if not exists affiliate_attributed_at timestamptz,
  add column if not exists affiliate_attributed_via text
    check (affiliate_attributed_via in ('link', 'code', 'claim', 'admin'));

create index if not exists users_referred_by_affiliate_idx
  on public.users (referred_by_affiliate_id) where referred_by_affiliate_id is not null;

-- The users table's own UPDATE policies predate this repo's migrations, so we
-- cannot be sure a signed-in user is barred from writing these columns. They
-- decide who gets paid, so a signed-in or anonymous API caller may not change
-- them (the service role and direct SQL can). Such an update keeps the old
-- values rather than failing, so a profile save that happens to send the whole
-- row still works.
create or replace function public.guard_affiliate_attribution()
returns trigger
language plpgsql
as $$
begin
  if auth.role() in ('authenticated', 'anon') then
    new.referred_by_affiliate_id := old.referred_by_affiliate_id;
    new.affiliate_attributed_at := old.affiliate_attributed_at;
    new.affiliate_attributed_via := old.affiliate_attributed_via;
  end if;
  return new;
end;
$$;

drop trigger if exists users_guard_affiliate_attribution on public.users;
create trigger users_guard_affiliate_attribution
  before update of referred_by_affiliate_id, affiliate_attributed_at, affiliate_attributed_via
  on public.users
  for each row execute function public.guard_affiliate_attribution();

-- ---------------------------------------------------------------------------
-- Link clicks. Only counted for creators that exist (see the function below),
-- so a bot hammering ?ref=random does not grow this table.
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_clicks (
  id bigserial primary key,
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  landing_path text,
  referrer_host text,
  created_at timestamptz not null default now()
);

create index if not exists affiliate_clicks_affiliate_idx
  on public.affiliate_clicks (affiliate_id, created_at desc);

create or replace function public.record_affiliate_click(
  p_code text,
  p_landing_path text default null,
  p_referrer_host text default null
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.affiliate_clicks (affiliate_id, landing_path, referrer_host)
  select id, left(p_landing_path, 300), left(p_referrer_host, 200)
  from public.affiliates
  where code = lower(p_code) and status = 'active';
$$;

revoke all on function public.record_affiliate_click(text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Payouts (bookkeeping for money sent by hand)
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null,
  method text,
  reference text,
  paid_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null
);

create index if not exists affiliate_payouts_affiliate_idx
  on public.affiliate_payouts (affiliate_id, paid_at desc);

-- ---------------------------------------------------------------------------
-- Commission ledger. Append-only apart from status/payout_id.
--
--   kind = 'sale'      one row per customer payment, positive amount
--   kind = 'reversal'  a refund or chargeback, negative amount, points at the
--                      sale it reverses
--
-- status: 'pending' until paid out ('payable' is derived: pending and
-- available_at has passed), 'paid' once included in a payout, 'void' when a
-- refund cancelled it before it was ever paid.
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  user_id uuid references public.users(id) on delete set null,
  kind text not null check (kind in ('sale', 'reversal')),
  source text not null check (source in ('stripe', 'play')),
  -- Stripe invoice id, or the RevenueCat/Play transaction id.
  source_id text not null,
  reverses_id uuid references public.affiliate_commissions(id) on delete restrict,
  base_cents integer not null,
  rate numeric(5,4) not null,
  amount_cents integer not null,
  currency text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'void')),
  available_at timestamptz not null,
  payout_id uuid references public.affiliate_payouts(id) on delete set null,
  created_at timestamptz not null default now()
);

-- A payment earns commission once, however many times its webhook arrives.
create unique index if not exists affiliate_commissions_one_sale_idx
  on public.affiliate_commissions (source, source_id) where kind = 'sale';

create index if not exists affiliate_commissions_affiliate_idx
  on public.affiliate_commissions (affiliate_id, created_at desc);

create index if not exists affiliate_commissions_user_idx
  on public.affiliate_commissions (user_id, created_at);

create index if not exists affiliate_commissions_reverses_idx
  on public.affiliate_commissions (reverses_id) where reverses_id is not null;

-- ---------------------------------------------------------------------------
-- Service role only.
-- ---------------------------------------------------------------------------
alter table public.affiliates enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.affiliate_payouts enable row level security;
alter table public.affiliate_commissions enable row level security;
