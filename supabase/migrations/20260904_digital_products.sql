-- Digital products: the $27 workbook and the $17 audio pack.
--
-- ---------------------------------------------------------------------------
-- Why this is not modelled like starter_packs
-- ---------------------------------------------------------------------------
-- Every other sale on the platform belongs to a signed-in user before Stripe
-- is ever called: /api/checkout/starter-pack 401s without a session, and the
-- purchase row carries user_id from the first insert. This one cannot.
--
-- The workbook is the top of a cold funnel. Making a stranger create an
-- account before paying costs more conversions than it saves, so checkout is
-- open to guests and the ACCOUNT IS CREATED AT DELIVERY instead. That inverts
-- the ownership model: a purchase exists first, and acquires a user later.
--
-- Hence two things that look unusual next to starter_pack_purchases:
--
--   * user_id is nullable. It stays null between payment and the moment the
--     buyer clicks the link in their delivery email.
--   * email is not null, and is the real identity of the row until then. It
--     comes from Stripe, never from the client.
--
-- ---------------------------------------------------------------------------
-- Why orders and items, rather than one row per purchase
-- ---------------------------------------------------------------------------
-- One Stripe session can sell TWO products: the workbook, plus the audio pack
-- if the buyer takes the order bump. A flat purchases table would either need
-- a non-unique session id -- losing the thing that makes webhook delivery
-- idempotent -- or a nullable "and also bought audio" column that stops being
-- true the moment a third product exists. An order with items costs one extra
-- table and keeps the session id unique, which is what the retry safety rests
-- on.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- The catalogue
-- ---------------------------------------------------------------------------

create table if not exists public.digital_products (
  product_key     text primary key,
  name            text not null,
  description     text,
  kind            text not null check (kind in ('workbook', 'audio')),
  price_cents     int  not null check (price_cents > 0),
  currency        text not null default 'USD',
  -- Required only to be sold as an ORDER BUMP. Stripe's checkout
  -- `optional_items` accepts a Price id and nothing else -- unlike line_items,
  -- it will not take inline price_data -- so the audio pack cannot be offered
  -- at checkout until this is filled in from the Stripe dashboard. The base
  -- product is priced inline and does not need one.
  stripe_price_id text,
  active          boolean not null default true,
  sort_order      int not null default 0
);

comment on table public.digital_products is
  'One-off digital goods sold at the top of the funnel. Priced here and '
  're-derived server-side at checkout; the client only ever names a key.';

alter table public.digital_products enable row level security;
drop policy if exists "anyone reads digital products" on public.digital_products;
create policy "anyone reads digital products" on public.digital_products
  for select using (active);

insert into public.digital_products
  (product_key, name, description, kind, price_cents, sort_order)
values
  ('workbook_fpp',
   'Le Français Pas à Pas',
   'The complete A0–B2 grammar workbook — PDF plus the interactive online version.',
   'workbook', 2700, 1),
  ('audio_fpp',
   'Le Français Pas à Pas — audio pack',
   'Every dialogue and pronunciation drill, read at natural speed and again slowly.',
   'audio', 1700, 2)
on conflict (product_key) do update
  set name        = excluded.name,
      description = excluded.description,
      kind        = excluded.kind,
      price_cents = excluded.price_cents;

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table if not exists public.digital_orders (
  id            uuid primary key default gen_random_uuid(),

  -- Null until the buyer claims the order by signing in from the delivery
  -- email. `on delete set null` deliberately: if the account is later removed
  -- the ORDER still happened, and we need the row for refunds and accounting.
  user_id       uuid references auth.users(id) on delete set null,

  -- Stripe's email, captured at checkout. The claim key while user_id is null,
  -- and the address the delivery mail goes to. Never read from the request
  -- body -- a client that could name the email could claim someone else's
  -- order.
  email         text not null,

  status        text not null default 'pending'
                  check (status in ('pending', 'paid', 'refunded', 'abandoned')),

  -- What makes webhook delivery idempotent. Stripe retries, and a second
  -- delivery of the same session must not create a second order or send a
  -- second delivery email.
  stripe_checkout_session_id text unique,

  -- Opaque, single-purpose delivery credential. Generated at insert so the
  -- webhook never has to mint one, and unguessable so the delivery URL can be
  -- emailed. Claiming it binds the order to an account; after that it is inert.
  claim_token   text not null unique default encode(gen_random_bytes(24), 'base64'),
  claimed_at    timestamptz,

  total_cents   int not null default 0 check (total_cents >= 0),
  currency      text not null default 'USD',

  created_at    timestamptz not null default now(),
  paid_at       timestamptz
);

create index if not exists digital_orders_user_idx  on public.digital_orders(user_id);
create index if not exists digital_orders_email_idx on public.digital_orders(lower(email));

comment on column public.digital_orders.claim_token is
  'Delivery credential emailed to the buyer. Binds the order to whichever '
  'account signs in from that link. Inert once claimed_at is set.';

alter table public.digital_orders enable row level security;

-- A buyer reads their own orders once claimed, and never anybody else's. The
-- unclaimed window is served by the service role only, through the claim route.
drop policy if exists "own digital orders" on public.digital_orders;
create policy "own digital orders" on public.digital_orders
  for select using (auth.uid() = user_id);

create table if not exists public.digital_order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.digital_orders(id) on delete cascade,
  product_key text not null references public.digital_products(product_key),

  -- Snapshot, for the same reason bookings snapshot their price: what the
  -- buyer paid must survive us changing the catalogue tomorrow.
  price_cents int  not null check (price_cents >= 0),
  currency    text not null default 'USD',

  unique (order_id, product_key)
);

create index if not exists digital_order_items_order_idx on public.digital_order_items(order_id);

alter table public.digital_order_items enable row level security;
drop policy if exists "own digital order items" on public.digital_order_items;
create policy "own digital order items" on public.digital_order_items
  for select using (
    exists (
      select 1 from public.digital_orders o
      where o.id = digital_order_items.order_id
        and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Claiming
-- ---------------------------------------------------------------------------
-- Idempotent on purpose: the delivery link gets clicked more than once, from
-- more than one device, and the second click must be a no-op rather than an
-- error page. Re-claiming by the SAME user succeeds silently; a DIFFERENT user
-- is refused, because a forwarded email must not hand the workbook to whoever
-- opened it second.

create or replace function public.claim_digital_order(
  p_token   text,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.digital_orders%rowtype;
begin
  select * into o from public.digital_orders where claim_token = p_token;

  if not found then
    raise exception 'no such order' using errcode = 'no_data_found';
  end if;

  if o.status <> 'paid' then
    raise exception 'order not paid' using errcode = 'check_violation';
  end if;

  if o.user_id is not null then
    if o.user_id = p_user_id then
      return o.id;                      -- already claimed by this person
    end if;
    raise exception 'order already claimed' using errcode = 'unique_violation';
  end if;

  update public.digital_orders
     set user_id = p_user_id, claimed_at = now()
   where id = o.id;

  return o.id;
end;
$$;

revoke all on function public.claim_digital_order(text, uuid) from public, anon;

-- ---------------------------------------------------------------------------
-- Entitlement
-- ---------------------------------------------------------------------------
-- "Does this person own the audio pack?" -- asked by the library page on every
-- render, so it is a function rather than a join spelled out in six places.

create or replace function public.owns_digital_product(
  p_user_id uuid,
  p_product_key text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.digital_orders o
      join public.digital_order_items i on i.order_id = o.id
     where o.user_id = p_user_id
       and o.status = 'paid'
       and i.product_key = p_product_key
  );
$$;

grant execute on function public.owns_digital_product(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Recording a paid order
-- ---------------------------------------------------------------------------
-- Called by the Stripe webhook, and the reason the checkout route does NOT
-- pre-create a row the way /api/checkout/starter-pack does.
--
-- That route can write its row first because it already knows who is buying.
-- Here nobody is signed in, so the two facts that define the order -- the
-- buyer's email, and whether they took the audio bump -- are both decided
-- inside Stripe's checkout, after we have handed control away. There is
-- nothing truthful to write until the session comes back.
--
-- Returns the order id, and whether this call created it. The webhook sends
-- the delivery email only on a true `created`, so Stripe's retries cost the
-- buyer nothing more than a duplicate no-op.

create or replace function public.record_digital_order(
  p_session_id   text,
  p_email        text,
  p_product_keys text[],
  p_total_cents  int,
  p_currency     text default 'USD'
)
returns table (order_id uuid, created boolean, claim_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id     uuid;
  v_token  text;
  v_key    text;
begin
  -- The unique index on stripe_checkout_session_id is what makes this safe
  -- under concurrent retries, not the select below.
  select o.id, o.claim_token into v_id, v_token
    from public.digital_orders o
   where o.stripe_checkout_session_id = p_session_id;

  if found then
    return query select v_id, false, v_token;
    return;
  end if;

  insert into public.digital_orders
    (email, status, stripe_checkout_session_id, total_cents, currency, paid_at)
  values
    (p_email, 'paid', p_session_id, p_total_cents, coalesce(p_currency, 'USD'), now())
  on conflict (stripe_checkout_session_id) do nothing
  returning id, digital_orders.claim_token into v_id, v_token;

  -- Lost the race with a concurrent retry: the other call created it.
  if v_id is null then
    select o.id, o.claim_token into v_id, v_token
      from public.digital_orders o
     where o.stripe_checkout_session_id = p_session_id;
    return query select v_id, false, v_token;
    return;
  end if;

  foreach v_key in array p_product_keys loop
    insert into public.digital_order_items (order_id, product_key, price_cents, currency)
    select v_id, d.product_key, d.price_cents, d.currency
      from public.digital_products d
     where d.product_key = v_key
    on conflict (order_id, product_key) do nothing;
  end loop;

  return query select v_id, true, v_token;
end;
$$;

revoke all on function public.record_digital_order(text, text, text[], int, text) from public, anon;
