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
--   1. Put a tutor's email in STEP 2 (one already listed there is yours).
--   2. Run the rest of the file. The student is picked automatically from the
--      tutor's active students; override it only if you want a specific pair.
--
-- STEP 1 is only there when you need to look up who is who.
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
  v_tutor_email   text := 'forexbillionaire24@gmail.com';  -- <-- edit

  -- Leave this empty and the script picks a student the tutor already
  -- teaches. Hunting for a student email in a 60-row list ordered by role,
  -- with every tutor above them, is not a thing anyone should have to do.
  v_student_email text := '';                              -- optional

  -- 25 → 30 minutes of room, 50 → 60. Starting five minutes ago leaves ~25
  -- minutes on the clock, enough to watch it go amber (5:00) and red (1:00).
  v_minutes int := 25;

  -- HOW LONG AGO THE CLASS STARTED. Everything is derived from this, so it is
  -- the one dial worth understanding:
  --
  --   '5 minutes'   a class in progress — ~20 min of lesson, cut at 30
  --   '28 minutes'  TWO MINUTES BEFORE THE HARD STOP. Use this to test the
  --                 cut without sitting through half an hour: the cap is
  --                 measured from starts_at, not from when you join, so a
  --                 class that "started" 28 minutes ago ends in 2.
  --   '26 minutes'  just past the lesson end, to see the pill flip to
  --                 "Lesson ended · closes in 4:00"
  --   '-30 minutes' starts in 30 min — the locked lobby, unlocking itself
  --                 10 minutes before
  v_offset  interval := interval '5 minutes';

  v_tutor uuid;
  v_student uuid;
  v_room uuid;
  v_tier text;
  v_booking uuid;
begin
  select id into v_tutor from public.users where lower(email) = lower(v_tutor_email);
  if v_tutor is null then
    raise exception
      'No user with email "%". Run STEP 1 on its own to list real emails.', v_tutor_email;
  end if;

  if coalesce(v_student_email, '') = '' then
    -- Prefer a student this tutor ALREADY has a room with: that room is real,
    -- has their history in it, and is the closest thing to an actual lesson.
    --
    -- Ordered by the SESSION's created_at, not the relationship's. This script
    -- must not assume anything about tutor_students beyond the three columns
    -- the app itself writes (tutor_id, student_id, status) — that table
    -- predates the migrations in this repo, so its shape is not knowable from
    -- here, and guessing at created_at is exactly what broke the last run.
    select s.student_id into v_student
    from public.tutor_lesson_sessions s
    join public.tutor_students ts
      on ts.tutor_id = s.tutor_id and ts.student_id = s.student_id
    where s.tutor_id = v_tutor
      and s.student_id <> v_tutor          -- the "no claimed student" sentinel
      and ts.status = 'active'
    order by s.created_at desc
    limit 1;

    -- Otherwise any student they teach; the room gets created below.
    if v_student is null then
      select ts.student_id into v_student
      from public.tutor_students ts
      where ts.tutor_id = v_tutor
        and ts.status = 'active'
        and ts.student_id <> v_tutor
      limit 1;
    end if;

    if v_student is null then
      raise exception
        'Tutor % has no active students. Put a student email in v_student_email — '
        'this finds one: select email from public.users where upper(role) = ''STUDENT'' limit 20;',
        v_tutor_email;
    end if;
  else
    select id into v_student from public.users where lower(email) = lower(v_student_email);
    if v_student is null then
      raise exception 'No user with email "%".', v_student_email;
    end if;
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
  raise notice 'Tutor:   %', v_tutor_email;
  raise notice 'Student: %', (select email from public.users where id = v_student);
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
where lower(tu.email) = lower('forexbillionaire24@gmail.com')   -- <-- edit
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
-- See v_offset in STEP 2 for the other states — the locked lobby, the
-- "lesson ended" pill, and a two-minute run at the hard stop.
--
-- TESTING WITH TWO PEOPLE
-- The room admits its booked tutor and its booked student, nobody else. So put
-- a student account YOU CAN LOG IN AS in v_student_email — otherwise the
-- script picks whichever real student the tutor already teaches, and you will
-- not have their password. Both sides open the same /room/<id>.
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
