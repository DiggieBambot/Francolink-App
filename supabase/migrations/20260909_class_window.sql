-- Bind a live room to the class it is actually for.
--
-- Until now a room had no idea a booking existed. getOrCreateLessonSpace()
-- creates ONE permanent tutor_lesson_sessions row per tutor/student pair and
-- every booking they ever make points room_session_id at that same row, so the
-- room was open every day, at every hour, to anyone in it — and the 25/50
-- minute duration the student paid for was priced, billed, and then ignored.
--
-- Two columns close that. They are a CACHE of what bookings already say, not a
-- second source of truth: the resolver recomputes the window from bookings on
-- every room entry and writes the answer here, so a booking that moves or is
-- cancelled simply resolves differently next time.

alter table public.tutor_lesson_sessions
  add column if not exists current_booking_id uuid
    references public.bookings(id) on delete set null,
  add column if not exists hard_ends_at timestamptz;

comment on column public.tutor_lesson_sessions.current_booking_id is
  'The booking whose window is currently open on this room. Recomputed on entry.';
comment on column public.tutor_lesson_sessions.hard_ends_at is
  'Instant the call is cut: booking.starts_at + the cap for its duration (25->30, 50->60). Mirrored into the Daily token exp, which is the real enforcement.';

-- The resolver looks a room up by room_session_id and orders by starts_at.
-- Without this it is a sequential scan of every booking on every room entry.
create index if not exists bookings_room_session_idx
  on public.bookings (room_session_id, starts_at)
  where room_session_id is not null;
