-- Turning lesson plans on.
--
-- Everything else is built; this is the switch. Run it only after the Stripe
-- Price objects exist, because a plan that is `active` with no stripe_price_id
-- shows a student a checkout button that returns an error.
--
-- ===========================================================================
-- STEP 1 — create SIX Prices in the Stripe dashboard
-- ===========================================================================
-- One per (plan, term). lessons_per_week is the QUANTITY at checkout, not a
-- separate Price -- which is why this is six objects and not thirty.
--
-- Create each as a RECURRING price on a product of your choosing:
--
--   Community    monthly    $10.00  billing period: monthly
--   Community    3 months   $ 9.00  billing period: every 3 months
--   Community    annual     $ 8.00  billing period: yearly
--   Professional monthly    $25.00  billing period: monthly
--   Professional 3 months   $22.50  billing period: every 3 months
--   Professional annual     $20.00  billing period: yearly
--
-- IMPORTANT: the unit amount is the price of ONE LESSON, and Stripe multiplies
-- by the quantity. But a term price must also cover the whole term, so set the
-- unit amount to the per-lesson price x 4.33 x the months in the term:
--
--   Community    monthly    $  43.30   (10.00 x 4.33 x 1)
--   Community    3 months   $ 116.91   ( 9.00 x 4.33 x 3)
--   Community    annual     $ 415.68   ( 8.00 x 4.33 x 12)
--   Professional monthly    $ 108.25   (25.00 x 4.33 x 1)
--   Professional 3 months   $ 292.28   (22.50 x 4.33 x 3)
--   Professional annual     $1039.20   (20.00 x 4.33 x 12)
--
-- Cross-check against subscription_plan_prices.total_cents for
-- lessons_per_week = 1, which is exactly these figures:
--
--   select plan_key, term_months, total_cents / 100.0 as one_per_week
--     from public.subscription_plan_prices
--    where lessons_per_week = 1
--    order by plan_key, term_months;

-- ===========================================================================
-- STEP 2 — paste the six price IDs here and run
-- ===========================================================================
update public.subscription_plan_prices set stripe_price_id = 'price_XXX_community_monthly'
 where plan_key = 'community'    and term_months = 1;
update public.subscription_plan_prices set stripe_price_id = 'price_XXX_community_quarterly'
 where plan_key = 'community'    and term_months = 3;
update public.subscription_plan_prices set stripe_price_id = 'price_XXX_community_annual'
 where plan_key = 'community'    and term_months = 12;
update public.subscription_plan_prices set stripe_price_id = 'price_XXX_professional_monthly'
 where plan_key = 'professional' and term_months = 1;
update public.subscription_plan_prices set stripe_price_id = 'price_XXX_professional_quarterly'
 where plan_key = 'professional' and term_months = 3;
update public.subscription_plan_prices set stripe_price_id = 'price_XXX_professional_annual'
 where plan_key = 'professional' and term_months = 12;

-- ===========================================================================
-- STEP 3 — refuse to go live with a gap
-- ===========================================================================
do $$
declare missing int;
begin
  select count(*) into missing
    from public.subscription_plan_prices
   where stripe_price_id is null or stripe_price_id like 'price_XXX%';

  if missing > 0 then
    raise exception
      '% price row(s) still have no real Stripe price id - fix step 2 first', missing;
  end if;
end $$;

-- ===========================================================================
-- STEP 4 — open the doors
-- ===========================================================================
update public.subscription_plans set active = true
 where plan_key in ('community', 'professional');

-- ===========================================================================
-- STEP 5 — check a tutor is actually bookable
-- ===========================================================================
-- A plan with nobody to book is worse than no plan. Every row here must have
-- accepts_bookings = true, approval_status = 'approved' and is_public = true,
-- and the tutor needs availability for slots to appear.
select
  p.slug,
  p.tier,
  p.accepts_bookings,
  p.approval_status,
  p.is_public
from public.tutor_public_profiles p
order by p.slug;
