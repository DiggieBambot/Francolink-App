-- Where a self-study subscription was bought: the website (Stripe) or the
-- Android app (Google Play, via RevenueCat).
--
-- Both write the same users.subscription_plan, which is what gates lessons, so
-- each side must only ever change subscriptions it owns: a Stripe webhook must
-- not downgrade someone who pays through Google Play, and vice versa.
-- NULL = no paid subscription (or one that predates this column, see backfill).

alter table public.users
  add column if not exists subscription_source text
    check (subscription_source in ('stripe', 'google_play'));

-- Every paid self-study subscription so far came through Stripe.
update public.users
   set subscription_source = 'stripe'
 where subscription_source is null
   and stripe_subscription_id is not null;
