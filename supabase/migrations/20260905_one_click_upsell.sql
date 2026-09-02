-- One-click upsell: charging the card the buyer already gave us.
--
-- ---------------------------------------------------------------------------
-- Why this exists
-- ---------------------------------------------------------------------------
-- The post-purchase offer is the whole reason the $27 workbook exists: it is
-- how a book buyer becomes a lesson buyer. But an offer that asks for card
-- details a second time converts at a small fraction of one that does not --
-- the friction, not the price, is what loses it.
--
-- So the workbook checkout now saves the payment method (with consent, via
-- Stripe's setup_future_usage), and the upsell charges it off-session with a
-- single click. Nothing new is asked of the buyer.
--
-- Two columns on digital_orders carry what is needed to do that, and one
-- column plus one function let a starter pack be granted from a PaymentIntent
-- rather than from a Checkout session.

-- ---------------------------------------------------------------------------
-- Where the saved card lives
-- ---------------------------------------------------------------------------

alter table public.digital_orders
  add column if not exists stripe_customer_id       text,
  add column if not exists stripe_payment_method_id text;

comment on column public.digital_orders.stripe_payment_method_id is
  'The card the buyer used for the workbook, saved with setup_future_usage so '
  'the post-purchase offer can be one click. Never exposed to the client -- '
  'the upsell route charges it server-side and returns only an outcome.';

-- Deliberately NOT readable by the buyer's own RLS policy: the existing
-- "own digital orders" policy grants select on the whole row, which would put
-- a payment-method id in the browser. Revoke those two columns from the
-- authenticated role so the policy cannot hand them out.
revoke select (stripe_customer_id, stripe_payment_method_id)
  on public.digital_orders from authenticated, anon;

-- ---------------------------------------------------------------------------
-- Granting a pack bought off-session
-- ---------------------------------------------------------------------------
-- grant_starter_pack() keys on stripe_checkout_session_id, because that is
-- what a Checkout purchase has. A one-click upsell has a PaymentIntent and no
-- session, so it needs its own key. Reusing the session column for a pi_ id
-- would work and would also be a lie in the column name.

alter table public.starter_pack_purchases
  add column if not exists stripe_payment_intent_id text;

create unique index if not exists starter_pack_purchases_pi
  on public.starter_pack_purchases (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- Same work as grant_starter_pack, keyed by the purchase row instead.
--
-- Idempotency rests on the status check here and, underneath it, on the
-- partial unique index that already allows one paid pack per person ever. A
-- double-clicked upsell button therefore cannot grant twice, and the second
-- call returns 0 rather than raising -- a retry is normal traffic.
create or replace function public.grant_starter_pack_by_id(p_purchase_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  pp public.starter_pack_purchases%rowtype;
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

comment on function public.grant_starter_pack_by_id is
  'Marks a pack paid and credits the lessons, keyed by purchase id. For packs '
  'bought through the one-click upsell, which has a PaymentIntent and no '
  'Checkout session.';

revoke all on function public.grant_starter_pack_by_id(uuid) from public, anon;
