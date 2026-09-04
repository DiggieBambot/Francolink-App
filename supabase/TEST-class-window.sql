-- =============================================================================
-- Set up a live Classroom you can test, without paying through Stripe.
--
-- WHY THIS FILE EXISTS
-- The schedule gate and the 30/60-minute cap only engage on a room that a
-- CONFIRMED BOOKING points at. Without one, every room resolves as
-- "unscheduled" and behaves exactly as it did before — which is correct, and
-- also means none of the new class behaviour can be reached by simply opening
-- a room. So: insert a lesson.
--
-- HOW TO RUN
--   1. Select STEP 1 alone and Run it, to get two real emails.
--   2. Paste them into the two marked lines in STEP 2.
--   3. Run the rest of the file.
--
-- STEP 1 has to go first and alone: while the emails are placeholders STEP 2
-- raises, an error aborts the entire run, and the dashboard then renders no
-- results — so you would see the error and never the list that fixes it.
--
-- STEP 2 creates the pair's room if they have never met in one, and prints the
-- URL to open. Safe to re-run: it replaces its own previous test booking.
-- =============================================================================


-- --- STEP 1. Find two real emails ------------------------------------------
--
-- RUN THIS QUERY BY ITSELF FIRST — select just these lines and press Run.
--
-- It has to be on its own because STEP 2 aborts the whole run while the emails
-- are still placeholders, and an aborted run renders no results at all: you
-- would get the error and never see the list you need to fix it.
--
-- `gets_the_classroom` is the single predicate deciding which room a tutor's
-- students get. Pick one tutor with true (Classroom: video, countdown, hard
-- stop) and, later, one with false or null (Study Space: no call at all).

select u.email,
       u.role,
       (p.approval_status = 'approved' and p.is_public and p.accepts_bookings)
         as gets_the_classroom,
       p.slug,
       p.approval_status,
       p.is_public,
       p.accepts_bookings
from public.users u
left join public.tutor_public_profiles p on p.user_id = u.id
where upper(coalesce(u.role, '')) in ('TUTOR', 'STUDENT')
order by u.role, gets_the_classroom desc nulls last, u.email
limit 60;


-- --- STEP 2. Make a class that is happening RIGHT NOW -----------------------
-- ↓↓↓ EDIT THESE TWO LINES ↓↓↓

do $$
declare
  v_tutor_email   text := 'TUTOR@EXAMPLE.COM';     -- <-- edit
  v_student_email text := 'STUDENT@EXAMPLE.COM';   -- <-- edit

  -- 25 → 30 minutes of room, 50 → 60. Starting five minutes ago leaves ~25
  -- minutes on the clock, enough to watch it go amber (5:00) and red (1:00).
  v_minutes int := 25;
  v_offset  interval := interval '5 minutes';      -- how long ago it started
                                                   -- use a NEGATIVE-sounding
                                                   -- future test via STEP 3

  v_tutor uuid;
  v_student uuid;
  v_room uuid;
  v_tier text;
  v_booking uuid;
begin
  select id into v_tutor   from public.users where lower(email) = lower(v_tutor_email);
  select id into v_student from public.users where lower(email) = lower(v_student_email);

  if v_tutor is null then
    raise exception
      'No user with email "%". Check STEP 1 output for real tutor emails.', v_tutor_email;
  end if;
  if v_student is null then
    raise exception
      'No user with email "%".', v_student_email;
  end if;
  if v_tutor = v_student then
    raise exception 'Tutor and student must be different people.';
  end if;

  -- The pair's permanent room. One per pair, reused for every lesson they ever
  -- have — created here if they have never met in one.
  select s.id into v_room
  from public.tutor_lesson_sessions s
  where s.tutor_id = v_tutor and s.student_id = v_student
  order by s.created_at
  limit 1;

  if v_room is null then
    insert into public.tutor_lesson_sessions (tutor_id, student_id, status, started_at)
    values (v_tutor, v_student, 'active', now())
    returning id into v_room;
    raise notice 'Created a room for this pair.';
  end if;

  -- The pair must be connected or the room's tutor tools do nothing.
  insert into public.tutor_students (tutor_id, student_id, status)
  values (v_tutor, v_student, 'active')
  on conflict (tutor_id, student_id) do nothing;

  select tier into v_tier
  from public.tutor_public_profiles where user_id = v_tutor;

  -- Clear this file's previous test lesson for the pair. bookings has an
  -- exclusion constraint against overlapping live bookings for one tutor, so
  -- without this a second run fails with "conflicting key value".
  delete from public.bookings
  where tutor_id = v_tutor
    and price_cents = 0
    and tutor_pay_cents = 0;

  insert into public.bookings (
    tutor_id, student_id, room_session_id,
    starts_at, ends_at, duration_minutes,
    status, price_cents, tutor_pay_cents, currency, tier, is_trial
  )
  values (
    v_tutor, v_student, v_room,
    now() - v_offset,
    now() - v_offset + (v_minutes || ' minutes')::interval,
    v_minutes,
    'confirmed', 0, 0, 'USD', coalesce(v_tier, 'standard'), false
  )
  returning id into v_booking;

  raise notice '--------------------------------------------------------';
  raise notice 'Open this as either person:  /room/%', v_room;
  raise notice 'Booking % — % min, cap % min', v_booking, v_minutes,
    case v_minutes when 25 then 30 when 50 then 60 else v_minutes end;
  raise notice '--------------------------------------------------------';
end $$;


-- --- STEP 3. The room to open ----------------------------------------------
-- The URL is also printed in the NOTICE above; this repeats it as a row you
-- can copy. Edit the tutor email to match STEP 2.

select 'https://app.francolink.net/room/' || b.room_session_id as open_this,
       b.starts_at,
       b.duration_minutes,
       b.duration_minutes
         + case b.duration_minutes when 25 then 5 when 50 then 10 else 0 end
         as room_minutes_total,
       b.starts_at
         + ((case b.duration_minutes when 25 then 30 when 50 then 60
                  else b.duration_minutes end) || ' minutes')::interval
         as call_is_cut_at
from public.bookings b
join public.users tu on tu.id = b.tutor_id
where lower(tu.email) = lower('TUTOR@EXAMPLE.COM')   -- <-- edit
  and b.price_cents = 0
order by b.created_at desc
limit 1;


-- =============================================================================
-- WHAT TO EXPECT
--
--   * countdown pill in the control bar, falling
--   * amber at 5:00 left, red at 1:00
--   * at 0:00 the call is cut and the after-class screen appears
--   * the cut is enforced by the Daily token's `exp`, so a tab left open past
--     the deadline should NOT stay connected — that is the claim worth trying
--     hardest to break
--
-- To test the LOBBY instead (class not started yet), change STEP 2's
--     v_offset := interval '5 minutes';
-- to
--     v_offset := interval '-30 minutes';
-- which starts the class 30 minutes from now. Video unlocks 10 minutes before,
-- so for 20 minutes you should see the next-class state and a locked Join
-- button that unlocks by itself.
-- =============================================================================


-- --- Did the student's rating save? ----------------------------------------
-- lesson_reviews has existed since August with nothing ever writing to it.
-- After rating a finished lesson this should return a row.

select r.rating, r.comment, r.created_at, su.email as student, tu.email as tutor
from public.lesson_reviews r
join public.users su on su.id = r.student_id
join public.users tu on tu.id = r.tutor_id
order by r.created_at desc
limit 10;


-- --- Clean up ---------------------------------------------------------------
-- Uncomment and run when you are done. Only ever touches rows this file made.

-- delete from public.bookings where price_cents = 0 and tutor_pay_cents = 0;
