-- "Tell me when tutors are available" signups from francolink.net/tutors.
--
-- The directory advertises French, English and Spanish whether or not a tutor
-- is live for each one yet. Rather than showing an empty page for a language
-- we can't staff today, we capture demand — which also tells us which language
-- to recruit for first, and gives us someone to email when we do.

create table if not exists public.tutor_waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  -- Language they want a tutor for, e.g. 'fr'. Null means "any".
  language   text,
  -- Optional context: level they're at, what they want to work on.
  level      text,
  note       text,
  source     text,
  user_agent text,
  -- Stamped when we actually email them, so a later recruit-and-notify pass
  -- can find who hasn't heard from us yet.
  notified_at timestamptz,
  created_at  timestamptz not null default now()
);

-- One signup per email per language: someone clicking twice shouldn't create
-- two rows, but wanting both French and Spanish is legitimate.
create unique index if not exists tutor_waitlist_email_language_idx
  on public.tutor_waitlist (lower(email), coalesce(language, 'any'));

create index if not exists tutor_waitlist_pending_idx
  on public.tutor_waitlist (language, created_at) where notified_at is null;

alter table public.tutor_waitlist enable row level security;

-- Anyone may join; only the service role may read the list back. These are
-- email addresses, so nothing about them is publicly readable.
drop policy if exists "anyone joins the waitlist" on public.tutor_waitlist;
create policy "anyone joins the waitlist"
  on public.tutor_waitlist for insert with check (true);
