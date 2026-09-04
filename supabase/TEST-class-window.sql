-- =============================================================================
-- Test helpers for the scheduled Classroom.
--
-- The schedule gate and the 30/60-minute cap only engage on a room that a
-- CONFIRMED BOOKING points at. Without one, every room resolves as
-- "unscheduled" and behaves exactly as it did before — which is correct, and
-- also means you cannot test any of the new behaviour by simply opening a room.
--
-- Rather than paying through Stripe to get a test lesson, insert one. Run the
-- queries top to bottom; each block says what to do with its output.
-- =============================================================================


-- --- A. Who is a listed FrancoLink tutor? -----------------------------------
-- This single predicate decides Classroom vs Study Space. You want at least
-- one row here (to test the Classroom) and at least one tutor NOT here (to
-- test the Study Space).

select u.email,
       p.user_id,
       p.slug,
       p.approval_status,
       p.is_public,
       p.accepts_bookings,
       (p.approval_status = 'approved' and p.is_public and p.accepts_bookings)
         as gets_the_classroom
from public.tutor_public_profiles p
join public.users u on u.id = p.user_id
order by gets_the_classroom desc, u.email;


-- --- B. Find the room for a tutor/student pair ------------------------------
-- Rooms are permanent: one row per pair, reused for every lesson they have.
-- Put the two emails in and note the id — that is the /room/<id> URL.

select s.id as room_id,
       tu.email as tutor,
       su.email as student,
       s.status,
       s.current_booking_id,
       s.hard_ends_at
from public.tutor_lesson_sessions s
join public.users tu on tu.id = s.tutor_id
left join public.users su on su.id = s.student_id
where tu.email = 'TUTOR@EXAMPLE.COM'          -- <-- edit
order by s.created_at desc;


-- --- C. Make a class that is happening RIGHT NOW ----------------------------
-- Sets starts_at to five minutes ago, so you land mid-lesson with ~20 minutes
-- on the clock for a 25-minute booking (cap is 30).
--
-- Edit the three values at the top. The room must already exist — get its id
-- from block B, or just open /room/<id> once as the tutor to create it.
--
-- NOTE: bookings has an exclusion constraint against overlapping live bookings
-- for one tutor. If this errors with "conflicting key value", that tutor
-- already has a booking covering this window — cancel it or shift the time.

insert into public.bookings (
  tutor_id, student_id, room_session_id,
  starts_at, ends_at, duration_minutes,
  status, price_cents, tutor_pay_cents, currency, tier, is_trial
)
select
  s.tutor_id,
  s.student_id,
  s.id,
  now() - interval '5 minutes',
  now() + interval '20 minutes',
  25,
  'confirmed',
  0, 0, 'USD',
  coalesce((select tier from public.tutor_public_profiles where user_id = s.tutor_id), 'standard'),
  false
from public.tutor_lesson_sessions s
where s.id = 'ROOM_ID_FROM_BLOCK_B'           -- <-- edit
returning id, starts_at, ends_at, duration_minutes;

-- What to expect in the room after this:
--   * countdown pill in the control bar, ~25:00 and falling
--   * amber at 5:00 left, red at 1:00
--   * at 0:00 the call is cut and the after-class screen appears
--   * the cut is enforced by the Daily token's exp, so leaving a tab open
--     past the deadline should NOT keep you connected


-- --- D. Make a class that has NOT started yet -------------------------------
-- Starts in 30 minutes. Video opens 10 minutes before, so for the first 20
-- minutes you should see the "next class" state and a locked Join button that
-- unlocks by itself.
--
-- Run C or D, not both — they would overlap and the constraint will refuse.

-- insert into public.bookings (
--   tutor_id, student_id, room_session_id,
--   starts_at, ends_at, duration_minutes,
--   status, price_cents, tutor_pay_cents, currency, tier, is_trial
-- )
-- select s.tutor_id, s.student_id, s.id,
--        now() + interval '30 minutes',
--        now() + interval '55 minutes',
--        25, 'confirmed', 0, 0, 'USD',
--        coalesce((select tier from public.tutor_public_profiles where user_id = s.tutor_id), 'standard'),
--        false
-- from public.tutor_lesson_sessions s
-- where s.id = 'ROOM_ID_FROM_BLOCK_B';


-- --- E. Did the student's rating save? --------------------------------------
-- lesson_reviews has existed since August with nothing ever writing to it.
-- After rating a finished lesson, this should return a row.

select r.rating, r.comment, r.created_at, su.email as student, tu.email as tutor
from public.lesson_reviews r
join public.users su on su.id = r.student_id
join public.users tu on tu.id = r.tutor_id
order by r.created_at desc
limit 10;


-- --- F. Clean up the test bookings ------------------------------------------
-- Only ever deletes rows this file created (price_cents = 0).

-- delete from public.bookings where price_cents = 0 and tutor_pay_cents = 0;
