-- Public marketing site (francolink.net) data model.
--
-- The app lives at app.francolink.net; francolink.net is the front-facing
-- website. These tables back the parts of that site that must be editable
-- without a deploy: tutor directory + profiles, availability, testimonials,
-- FAQs, and inbound contact messages.
--
-- Tutor profiles are OPT-IN by the tutor and then APPROVED by an admin. Only
-- rows with is_public = true AND approval_status = 'approved' are readable by
-- anonymous visitors — RLS enforces this, not application code.

-- ---------------------------------------------------------------------------
-- Tutor public profiles
-- ---------------------------------------------------------------------------
create table if not exists public.tutor_public_profiles (
  user_id           uuid primary key references public.users(id) on delete cascade,
  slug              text unique not null,
  headline          text,
  bio               text,
  -- Languages the tutor TEACHES (e.g. {fr,en}) and those they also speak.
  teaches           text[] not null default '{}',
  speaks            text[] not null default '{}',
  -- CEFR levels covered, e.g. {A1,A2,B1}.
  levels            text[] not null default '{}',
  specialties       text[] not null default '{}',
  -- [{ "title": "DELF examiner", "issuer": "...", "year": 2021 }]
  qualifications    jsonb  not null default '[]'::jsonb,
  years_experience  int,
  photo_url         text,
  intro_video_url   text,
  country           text,
  timezone          text,
  hourly_rate_cents int,
  currency          text default 'EUR',
  trial_available   boolean not null default true,
  is_public         boolean not null default false,
  approval_status   text    not null default 'pending'
                    check (approval_status in ('pending', 'approved', 'rejected')),
  rejection_reason  text,
  display_order     int     not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.tutor_public_profiles is
  'Opt-in, admin-approved public tutor profiles shown on francolink.net/tutors.';

create index if not exists tutor_public_profiles_live_idx
  on public.tutor_public_profiles (display_order, created_at)
  where is_public and approval_status = 'approved';

create index if not exists tutor_public_profiles_teaches_idx
  on public.tutor_public_profiles using gin (teaches);

-- ---------------------------------------------------------------------------
-- Weekly recurring availability (the "schedule" shown on a profile)
-- ---------------------------------------------------------------------------
create table if not exists public.tutor_availability (
  id           uuid primary key default gen_random_uuid(),
  tutor_id     uuid not null references public.users(id) on delete cascade,
  -- 0 = Sunday … 6 = Saturday, matching JS getDay().
  weekday      int  not null check (weekday between 0 and 6),
  -- Minutes from midnight in the tutor's own timezone (see profile.timezone).
  start_minute int  not null check (start_minute between 0 and 1440),
  end_minute   int  not null check (end_minute between 0 and 1440),
  created_at   timestamptz not null default now(),
  check (end_minute > start_minute)
);

create index if not exists tutor_availability_tutor_idx
  on public.tutor_availability (tutor_id, weekday, start_minute);

-- ---------------------------------------------------------------------------
-- Testimonials
-- ---------------------------------------------------------------------------
create table if not exists public.testimonials (
  id             uuid primary key default gen_random_uuid(),
  author_name    text not null,
  author_role    text,
  author_photo   text,
  author_country text,
  quote          text not null,
  rating         int check (rating between 1 and 5),
  -- Optional attribution to a specific tutor (shown on their profile too).
  tutor_id       uuid references public.users(id) on delete set null,
  is_published   boolean not null default false,
  display_order  int not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists testimonials_published_idx
  on public.testimonials (display_order, created_at) where is_published;

-- ---------------------------------------------------------------------------
-- FAQs
-- ---------------------------------------------------------------------------
create table if not exists public.site_faqs (
  id            uuid primary key default gen_random_uuid(),
  category      text not null default 'general',
  question      text not null,
  answer        text not null,
  is_published  boolean not null default true,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists site_faqs_published_idx
  on public.site_faqs (category, display_order) where is_published;

-- ---------------------------------------------------------------------------
-- Contact form submissions
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  topic      text,
  message    text not null,
  -- Light spam/attribution context; never shown publicly.
  source     text,
  user_agent text,
  status     text not null default 'new' check (status in ('new', 'read', 'replied', 'spam')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.tutor_public_profiles enable row level security;
alter table public.tutor_availability    enable row level security;
alter table public.testimonials          enable row level security;
alter table public.site_faqs             enable row level security;
alter table public.contact_messages      enable row level security;

-- Anyone (incl. anon) may read approved, opted-in profiles.
drop policy if exists "public read live tutor profiles" on public.tutor_public_profiles;
create policy "public read live tutor profiles"
  on public.tutor_public_profiles for select
  using (is_public and approval_status = 'approved');

-- A tutor may always read and edit their own profile row, live or not.
drop policy if exists "tutor reads own profile" on public.tutor_public_profiles;
create policy "tutor reads own profile"
  on public.tutor_public_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "tutor writes own profile" on public.tutor_public_profiles;
create policy "tutor writes own profile"
  on public.tutor_public_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "tutor updates own profile" on public.tutor_public_profiles;
create policy "tutor updates own profile"
  on public.tutor_public_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Availability is public for tutors whose profile is live.
drop policy if exists "public read availability of live tutors" on public.tutor_availability;
create policy "public read availability of live tutors"
  on public.tutor_availability for select
  using (
    exists (
      select 1 from public.tutor_public_profiles p
      where p.user_id = tutor_availability.tutor_id
        and p.is_public and p.approval_status = 'approved'
    )
  );

drop policy if exists "tutor manages own availability" on public.tutor_availability;
create policy "tutor manages own availability"
  on public.tutor_availability for all
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);

drop policy if exists "public read published testimonials" on public.testimonials;
create policy "public read published testimonials"
  on public.testimonials for select using (is_published);

drop policy if exists "public read published faqs" on public.site_faqs;
create policy "public read published faqs"
  on public.site_faqs for select using (is_published);

-- Contact form: anyone may submit, nobody may read back without service role.
drop policy if exists "anyone submits contact message" on public.contact_messages;
create policy "anyone submits contact message"
  on public.contact_messages for insert with check (true);

-- ---------------------------------------------------------------------------
-- Slug helper: keeps /tutors/<slug> stable and unique.
-- ---------------------------------------------------------------------------
create or replace function public.tutor_profile_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tutor_public_profiles_touch on public.tutor_public_profiles;
create trigger tutor_public_profiles_touch
  before update on public.tutor_public_profiles
  for each row execute function public.tutor_profile_touch();
