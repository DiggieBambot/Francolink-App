-- What a tutor is paid stops being public.
--
-- Two leaks, both one query away from anybody who wanted to look:
--
--   1. lesson_pricing carried price_cents AND tutor_pay_cents in the same row
--      under `anyone reads pricing ... using (true)` (20260805_bookings.sql).
--      The anon key ships in the browser bundle, so the take rate was readable
--      by anyone, logged in or not.
--
--   2. `participants read bookings` gives a tutor select on the whole booking
--      row, price_cents included -- so a tutor could see what the student paid
--      for the lesson they had just taught.
--
-- Neither number was ever RENDERED to a tutor, but that was a UI accident and
-- not a boundary. The take rate is a thing to discuss with a tutor honestly
-- and deliberately, in a recruiting conversation where the cancellation pay,
-- the supplied curriculum and the zero acquisition burden are on the table
-- too. It is not a thing to have discovered.
--
-- The pattern below is column masking through a view. RLS is row-level and
-- cannot say "this column, but only for the student on the row", and column
-- GRANTs are per-ROLE -- student and tutor are both `authenticated`, so a
-- grant cannot separate them either. A view can, because it can read
-- auth.uid() per row.
--
-- The views are deliberately NOT security_invoker: they run as owner and do
-- their own filtering in an explicit where clause. security_invoker would
-- check privileges as the caller, and the caller is exactly who we are about
-- to revoke from.

-- ---------------------------------------------------------------------------
-- 1. Lesson prices: public price, private pay
-- ---------------------------------------------------------------------------

drop policy if exists "anyone reads pricing" on public.lesson_pricing;

create or replace view public.lesson_prices_public
  with (security_barrier = true) as
  select tier, duration_minutes, is_trial, price_cents, currency
    from public.lesson_pricing;

comment on view public.lesson_prices_public is
  'What a lesson SELLS for. The only price surface anon and authenticated may '
  'read -- tutor_pay_cents lives on lesson_pricing and is service-role only.';

revoke all on public.lesson_pricing from anon, authenticated;
grant select on public.lesson_prices_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Bookings: each side sees its own half of the money
-- ---------------------------------------------------------------------------
-- The student sees what they paid. The tutor sees what they earn. Neither
-- sees the other, so the take rate is not derivable from a row either party
-- holds.

create or replace view public.booking_details
  with (security_barrier = true) as
  select
    b.id,
    b.tutor_id,
    b.student_id,
    b.starts_at,
    b.ends_at,
    b.duration_minutes,
    b.status,
    b.tier,
    b.is_trial,
    b.currency,
    b.room_session_id,
    b.expires_at,
    b.cancelled_at,
    b.cancelled_by,
    b.student_note,
    b.refund_status,
    b.created_at,
    b.updated_at,
    -- The money, masked per viewer.
    case when auth.uid() = b.student_id then b.price_cents     end as price_cents,
    case when auth.uid() = b.tutor_id   then b.tutor_pay_cents end as tutor_pay_cents
  from public.bookings b
  where auth.uid() = b.student_id
     or auth.uid() = b.tutor_id;

comment on view public.booking_details is
  'Participant-facing bookings. Money columns are masked to the side they '
  'belong to: a student never sees tutor pay, a tutor never sees the student '
  'price. Read this from the app; the base table is service-role only.';

-- The row policy stays as documentation of intent, but the grant is what
-- actually closes the door -- a policy without a privilege grants nothing.
revoke all on public.bookings from anon, authenticated;
grant select on public.booking_details to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Nothing here touches service_role
-- ---------------------------------------------------------------------------
-- /api/booking/create, /api/booking/cancel, the completion sweeper and the
-- credit ledger all use the service client, which bypasses both RLS and these
-- grants. Pricing a lesson and paying a tutor are unaffected.
