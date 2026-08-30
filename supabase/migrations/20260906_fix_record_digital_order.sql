-- Fix: record_digital_order() threw on every call.
--
--   ERROR 42702: column reference "order_id" is ambiguous
--   It could refer to either a PL/pgSQL variable or a table column.
--
-- RETURNS TABLE (order_id uuid, ...) declares an implicit OUT variable called
-- order_id. Further down, the items loop does
--
--   insert into public.digital_order_items (order_id, product_key, ...)
--
-- and PL/pgSQL cannot tell whether that column-list `order_id` means the
-- column or the OUT variable, so it refuses to run the function at all.
--
-- This was not caught by the type checker or the build, because neither runs
-- SQL. It would have surfaced as: buyer pays, Stripe fires the webhook, the
-- webhook throws, Stripe retries on a backoff forever, and the buyer never
-- receives the delivery email for something they have already been charged
-- for. The worst failure in the funnel, on the happiest path through it.
--
-- `#variable_conflict use_column` tells PL/pgSQL to resolve an ambiguous name
-- to the column. The function's own variables are v_id, v_token and v_key, so
-- nothing else in here changes meaning. The returned shape is untouched, so
-- callers need no change.

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
#variable_conflict use_column
declare
  v_id     uuid;
  v_token  text;
  v_key    text;
begin
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
  returning digital_orders.id, digital_orders.claim_token into v_id, v_token;

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
