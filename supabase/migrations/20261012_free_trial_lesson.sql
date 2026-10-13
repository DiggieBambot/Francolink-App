-- A free 25-minute first lesson for students on a 2+ lessons-a-week plan.
--
-- The trial comes back, but no longer sold on its own: it is a reward for
-- subscribing at two or more lessons a week, so it acquires a subscriber
-- rather than a $3.99 taster. Starter packs do not include it.
--
-- The student pays nothing and spends no credit. The tutor is still paid the
-- trial row's tutor_pay_cents (via tutor_pay_cents(p_is_trial => true)) -- the
-- free lesson is FrancoLink's cost of acquisition, never the tutor's.
--
-- Eligibility (plan size, tier, one per student) is decided in
-- lib/booking/confirm.ts freeTrialEligibility(); the unique index below is the
-- backstop that makes "one per student" hold under races.

-- 1. A booking can now be paid by the free trial.
alter table public.bookings drop constraint if exists bookings_paid_with_check;
alter table public.bookings add constraint bookings_paid_with_check
  check (paid_with in ('stripe', 'credit', 'free_trial'));

-- 2. The trial lesson is free to the student. Tutor pay is left as it is.
--    That deliberately puts pay above price on the trial rows, so the guard
--    from 20260827_community_pay.sql exempts trials -- as
--    lesson_pricing_margin_ok always has. Normal lessons are still held to it.
alter table public.lesson_pricing drop constraint if exists lesson_pricing_pay_under_price;
alter table public.lesson_pricing add constraint lesson_pricing_pay_under_price
  check (is_trial or tutor_pay_cents < price_cents);

update public.lesson_pricing
   set price_cents = 0
 where is_trial and duration_minutes = 25;

-- 3. One trial per student. A trial gives itself back when the lesson never
--    happened through no fault of the student's: an abandoned hold, a tutor
--    cancellation or no-show, or a student cancelling in time (refund 'full').
--    A LATE student cancellation still pays the tutor, so it uses the trial.
drop index if exists public.bookings_one_trial_per_student;
create unique index bookings_one_trial_per_student
  on public.bookings (student_id)
  where is_trial
    and status not in ('expired', 'cancelled_by_tutor', 'no_show_tutor')
    and not (status = 'cancelled_by_student' and refund_status = 'full');
