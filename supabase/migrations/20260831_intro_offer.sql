-- The discounted first month, which replaces the discounted first lesson.
--
-- The old trial was sold below what we pay the tutor -- $7.99 against $13.00
-- professional, $3.99 against $5.00 community -- so every taster was a loss we
-- hoped to earn back later. An intro MONTH does the same job (lower the bar to
-- starting) while staying profitable, and it puts the student on a
-- subscription from day one, which makes continuing the default instead of a
-- second decision.
--
-- ---------------------------------------------------------------------------
-- Why the rate is per plan and not one number
-- ---------------------------------------------------------------------------
-- The floor is tutor pay, because credits are granted weekly and every granted
-- lesson is a real payout. After the community raise in 20260827:
--
--   community     $10.00 list / $6.50 pay  -> ceiling 35%, we take 30%
--   professional  $25.00 list / $13.00 pay -> ceiling 48%, we take 40%
--
-- A single 40% would have sold community lessons at $6.00 against $6.50 of
-- pay. The trigger below makes that configuration impossible rather than
-- leaving it to whoever edits the table next.
--
-- ---------------------------------------------------------------------------
-- Why only the monthly term
-- ---------------------------------------------------------------------------
-- "40% off your first month" and a twelve-month term do not compose: the first
-- invoice on an annual plan IS the twelve months, so a once-only coupon would
-- discount the whole year. Discounting a twelfth of it instead is arithmetic
-- nobody can read off the page.
--
-- The 3- and 12-month terms already carry 10% and 20% off EVERY lesson for the
-- whole term, which is worth far more in absolute money than 40% of one month.
-- So the offer reads as a genuine ladder rather than a trick:
--
--     start monthly, 40% off month one  ->  or commit for a year, 20% off all of it
--
-- and the intro is restricted to term_months = 1, enforced in the checkout
-- route.

alter table public.subscription_plans
  add column if not exists intro_discount_bps int not null default 0
    check (intro_discount_bps between 0 and 5000);

comment on column public.subscription_plans.intro_discount_bps is
  'Discount on the FIRST month only, for new subscribers on the 1-month term. '
  'Floored by tutor pay -- see subscription_plans_intro_ok().';

-- The same margin floor as subscription_plan_prices_margin_ok, applied to the
-- intro rate. Written as a trigger for the same reason: a CHECK cannot run the
-- subquery into lesson_pricing that this needs.
create or replace function public.subscription_plans_intro_ok()
returns trigger language plpgsql as $$
declare
  worst_pay_cents int;
  effective_cents int;
begin
  if new.intro_discount_bps = 0 then
    return new;
  end if;

  -- 50 minutes, hardcoded, exactly as subscription_plan_prices_margin_ok does
  -- it. 20260823_credits_simplify.sql dropped subscription_plans.duration_minutes
  -- when it settled that a lesson IS 50 minutes and a 25-minute one is half a
  -- lesson; per_lesson_cents is denominated in that unit.
  select max(tutor_pay_cents) into worst_pay_cents
    from public.lesson_pricing
   where tier = any(new.allowed_tiers)
     and duration_minutes = 50
     and not is_trial;

  effective_cents := round(new.per_lesson_cents * (10000 - new.intro_discount_bps) / 10000.0);

  if worst_pay_cents is not null and effective_cents <= worst_pay_cents then
    raise exception
      'plan % intro of %bps sells a lesson for %c but the tutor is paid %c',
      new.plan_key, new.intro_discount_bps, effective_cents, worst_pay_cents;
  end if;

  return new;
end;
$$;

drop trigger if exists subscription_plans_intro_ok on public.subscription_plans;
create trigger subscription_plans_intro_ok
  before insert or update on public.subscription_plans
  for each row execute function public.subscription_plans_intro_ok();

update public.subscription_plans set intro_discount_bps = 3000 where plan_key = 'community';
update public.subscription_plans set intro_discount_bps = 4000 where plan_key = 'professional';

-- ---------------------------------------------------------------------------
-- Has this student ever had a plan?
-- ---------------------------------------------------------------------------
-- The intro is once per person, not once per subscription. Cancelling and
-- resubscribing must not buy another discounted month.
create or replace function public.intro_offer_available(p_user_id uuid)
returns boolean language sql stable as $$
  select not exists (
    select 1 from public.user_subscriptions where user_id = p_user_id
  );
$$;

comment on function public.intro_offer_available is
  'True only for a student who has never held a lesson plan of any status. '
  'Deliberately not "has no ACTIVE plan" -- that would make the intro month '
  'repeatable by cancelling.';
