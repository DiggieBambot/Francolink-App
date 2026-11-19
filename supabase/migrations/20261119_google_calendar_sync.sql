-- Two-way Google Calendar sync for tutors.
--
--   * Push: every confirmed lesson is written to the tutor's primary Google
--     calendar the moment it is confirmed, and removed when it is cancelled.
--     (The ICS feed in 20260813_calendar_feed.sql still exists for students
--     and for anyone who prefers it, but Google polls feeds every few hours.)
--   * Pull: the tutor's Google free/busy times are treated like blackouts, so a
--     student can't book a slot the tutor has already filled elsewhere.
--
-- Both tables are service-role only. The refresh token is a long-lived
-- credential to someone's whole calendar, so it is stored encrypted
-- (AES-256-GCM, key in GOOGLE_TOKEN_ENCRYPTION_KEY) and RLS is on with no
-- policies, meaning no client can ever read it.

create table if not exists public.google_calendar_connections (
  user_id                  uuid primary key references public.users(id) on delete cascade,
  google_email             text,
  -- iv.tag.ciphertext, base64url. See src/lib/google-calendar/crypto.ts.
  refresh_token_enc        text not null,
  calendar_id              text not null default 'primary',
  -- Turn off without disconnecting.
  push_enabled             boolean not null default true,
  block_busy               boolean not null default true,
  -- Set when Google rejects the refresh token (revoked, password change).
  -- The UI then asks the tutor to reconnect; nothing else is attempted.
  broken_at                timestamptz,
  last_error               text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.google_calendar_connections enable row level security;

-- What we last wrote to Google for each lesson, so the reconcile job only
-- touches lessons whose state actually changed.
create table if not exists public.google_calendar_events (
  booking_id      uuid not null references public.bookings(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  google_event_id text not null,
  -- 'present' (event exists in Google) or 'removed'.
  state           text not null check (state in ('present', 'removed')),
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  synced_at       timestamptz not null default now(),
  primary key (booking_id, user_id)
);

alter table public.google_calendar_events enable row level security;

comment on table public.google_calendar_connections is
  'Tutor Google Calendar OAuth connections. Refresh token is encrypted; service role only.';
