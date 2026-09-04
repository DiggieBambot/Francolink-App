-- =============================================================================
-- APPLY 2026-09-09 — bind the live room to its booking
--
-- Paste this whole file into the Supabase dashboard SQL editor and Run.
-- (The CLI is not linked in this repo — see APPLY_DB.md.)
--
-- Safe to run twice: every statement is IF NOT EXISTS.
-- =============================================================================

-- --- 1. The migration -------------------------------------------------------

alter table public.tutor_lesson_sessions
  add column if not exists current_booking_id uuid
    references public.bookings(id) on delete set null,
  add column if not exists hard_ends_at timestamptz;

comment on column public.tutor_lesson_sessions.current_booking_id is
  'The booking whose window is currently open on this room. Recomputed on entry.';
comment on column public.tutor_lesson_sessions.hard_ends_at is
  'Instant the call is cut: booking.starts_at + the cap for its duration (25->30, 50->60). Mirrored into the Daily token exp, which is the real enforcement.';

create index if not exists bookings_room_session_idx
  on public.bookings (room_session_id, starts_at)
  where room_session_id is not null;


-- --- 2. Verify --------------------------------------------------------------
-- Expect two rows: current_booking_id, hard_ends_at.

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tutor_lesson_sessions'
  and column_name in ('current_booking_id', 'hard_ends_at')
order by column_name;
