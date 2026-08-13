-- Personal calendar feed tokens.
--
-- A tutor or student subscribes Google/Apple/Outlook to a URL like
--   https://app.francolink.net/api/calendar/<token>.ics
-- and their lessons appear automatically.
--
-- The token IS the credential: calendar clients can't send an Authorization
-- header, so the secret has to live in the URL. That means it must be
-- unguessable, must not be the user's id, and must be revocable — hence a
-- separate random column the user can regenerate, rather than reusing anything
-- already known.

alter table public.users
  add column if not exists calendar_feed_token text;

-- Generated on first use rather than backfilled: a token nobody has subscribed
-- to is just an unnecessary secret sitting in the database.
create unique index if not exists users_calendar_feed_token_idx
  on public.users (calendar_feed_token)
  where calendar_feed_token is not null;

comment on column public.users.calendar_feed_token is
  'Bearer secret embedded in the ICS feed URL. Unguessable and revocable by '
  'regenerating. Never expose it anywhere the user has not asked for it.';
