-- Community tutors get a raise, out of take rather than out of the student.
--
-- $5.00 per 50-minute lesson is $6.00 an hour. That is below Cambly (~$10.20)
-- and below any realistic Preply floor, which means the only tutors who accept
-- it are tutors with no alternative -- adverse selection on the tier a new
-- student is most likely to try FIRST. The cheap tier being the bad tier is
-- the fastest way to lose someone in their first week.
--
-- The student price does not move. $10.00 for 50 minutes stays cheap and
-- competitive; the raise comes out of the take rate, which is where the slack
-- was:
--
--   community    take 50% -> 35%
--   professional unchanged at 48% for now -- see PLAN-tutor-supply.md stage 6,
--                which targets ~35% once there are 20+ tutors and blended
--                margin has absorbed it.
--
-- Pay is SNAPSHOT onto each booking at creation (20260805_bookings.sql), so
-- this applies to future bookings only and nothing historical is restated.
-- That is the correct behaviour and it is why the snapshot exists.

update public.lesson_pricing
   set tutor_pay_cents = 650
 where tier = 'community' and duration_minutes = 50 and not is_trial;

update public.lesson_pricing
   set tutor_pay_cents = 325
 where tier = 'community' and duration_minutes = 25 and not is_trial;

-- The trial rows are updated for consistency while they still exist. They are
-- retired entirely in the marketplace-funnel work -- a taster sold below tutor
-- pay ($3.99 against $3.25 here, $7.99 against $13.00 at professional) is
-- replaced by a discounted first MONTH, which stays profitable. See
-- PLAN-marketplace-funnel.md.
update public.lesson_pricing
   set tutor_pay_cents = 325
 where tier = 'community' and duration_minutes = 25 and is_trial;

-- Guard: a raise must never cross the price it is paid out of. The $14.50 cap
-- from 20260823 still applies on top of this.
alter table public.lesson_pricing drop constraint if exists lesson_pricing_pay_under_price;
alter table public.lesson_pricing add constraint lesson_pricing_pay_under_price
  check (tutor_pay_cents < price_cents);
