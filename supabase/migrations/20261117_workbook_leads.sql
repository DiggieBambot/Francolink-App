-- Free-sample signups for the workbook (decided 2026-11-17).
--
-- Cold ad traffic that is not ready to pay $27 leaves an email and gets
-- Partie 0 as a PDF, then a short sequence about the full book. These are
-- people with NO account, so they cannot live in public.users, and the
-- learning-tips opt-out flag does not reach them -- hence their own table and
-- their own unsubscribe.
--
-- Written only by the service role (the signup route and the sequence cron);
-- RLS is on with no policies, so the browser can read nothing here.

create table if not exists public.workbook_leads (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  -- Which form: 'sales-page' or 'sample-page'. Plus the ad's UTM tags, so a
  -- campaign can be judged on signups as well as sales.
  source          text,
  utm             jsonb,
  created_at      timestamptz not null default now(),
  -- How many sequence emails have gone out. 1 = the sample itself.
  step            int not null default 0,
  last_sent_at    timestamptz,
  unsubscribed_at timestamptz,
  -- Set by the sequence cron when a paid workbook order exists for the email.
  -- The sequence stops there: nobody should be sold a book they own.
  converted_at    timestamptz
);

create unique index if not exists workbook_leads_email_key
  on public.workbook_leads (lower(email));
create index if not exists workbook_leads_due_idx
  on public.workbook_leads (last_sent_at)
  where unsubscribed_at is null and converted_at is null;

alter table public.workbook_leads enable row level security;
