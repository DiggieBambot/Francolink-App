-- "Apply to teach" on francolink.net.
--
-- An application is NOT an account. Anyone can submit one without signing up;
-- an admin reviews it, and only on acceptance does a real tutor account and
-- public listing get created. Keeping the two apart means a rejected applicant
-- never leaves a half-made account behind, and we can collect applications
-- before the onboarding flow exists.

create table if not exists public.tutor_applications (
  id            uuid primary key default gen_random_uuid(),

  full_name     text not null,
  email         text not null,
  country       text,
  timezone      text,

  -- Languages they want to teach, e.g. {fr,en}.
  teaches       text[] not null default '{}',
  levels        text[] not null default '{}',
  years_experience int,

  -- Free text: qualifications, where they trained, who they've taught.
  qualifications text,
  about          text,
  -- CV, LinkedIn, a demo video — whatever they want to show.
  link           text,
  -- Roughly how many hours a week they could teach. Drives capacity planning.
  weekly_hours   int,

  -- Which tier we'd place them in if accepted. Set by the reviewer, not the
  -- applicant — the applicant never sees or picks their own pay grade.
  proposed_tier text check (proposed_tier in ('community', 'certified', 'professional')),

  status text not null default 'new' check (status in (
    'new',          -- just submitted
    'reviewing',    -- being looked at
    'interviewing', -- demo lesson scheduled
    'accepted',     -- approved; account + listing to follow
    'rejected',
    'spam'
  )),
  review_notes text,

  -- Set once the application becomes a real tutor, so we can trace a listing
  -- back to the application it came from.
  created_user_id uuid references public.users(id) on delete set null,

  source     text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tutor_applications_status_idx
  on public.tutor_applications (status, created_at desc);

-- One open application per email — stops duplicate submissions from someone
-- clicking twice, without blocking a genuine re-application after rejection.
create unique index if not exists tutor_applications_one_open_per_email
  on public.tutor_applications (lower(email))
  where status in ('new', 'reviewing', 'interviewing');

create or replace function public.tutor_applications_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tutor_applications_touch on public.tutor_applications;
create trigger tutor_applications_touch before update on public.tutor_applications
  for each row execute function public.tutor_applications_touch();

alter table public.tutor_applications enable row level security;

-- Anyone may apply; nobody may read applications back without the service
-- role. Applications contain personal data and reviewer notes.
drop policy if exists "anyone submits an application" on public.tutor_applications;
create policy "anyone submits an application"
  on public.tutor_applications for insert with check (true);
