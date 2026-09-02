-- Ledger of lesson reminders already sent.
--
-- The reminder cron runs every 15 minutes and asks "which lessons start soon".
-- Without a record of what has gone out, a lesson sitting inside the window
-- would be reminded about on every run — four pushes an hour until it starts.
--
-- One row per (booking, kind), with the primary key doing the work: the insert
-- is attempted BEFORE the send, so two overlapping cron runs cannot both win.
-- A send that then fails is not retried, which is the right trade for a
-- reminder: a missed one is a small disappointment, a duplicated one is spam.

create table if not exists public.booking_reminders (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  -- '24h' the day before, '15m' just before the lesson starts.
  kind text not null check (kind in ('24h', '15m')),
  sent_at timestamptz not null default now(),
  primary key (booking_id, kind)
);

-- The cron sweeps by time, not by booking, so it needs to answer "what has
-- already been sent for these bookings" in one go.
create index if not exists booking_reminders_sent_at_idx
  on public.booking_reminders (sent_at desc);

alter table public.booking_reminders enable row level security;

-- Written and read only by the reminder cron under the service role. No policy
-- is defined deliberately: with RLS on and no policy, anon and authenticated
-- see nothing, and nobody can infer another user's schedule from it.

comment on table public.booking_reminders is
  'Idempotency ledger for lesson reminders. A row means that reminder has '
  'already gone out; the cron inserts before sending so a retry is a no-op.';
