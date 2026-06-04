-- tutor_lessons: structured French lessons converted from Google Docs.
-- content JSONB matches the v2 Gemini converter schema:
--   { slug, title, language, level, duration_minutes, topic_tags[], objectives[],
--     tutor_overview{}, sections[{ kind, number, ... }] }

create type tutor_lesson_status as enum ('draft', 'review', 'published', 'rejected');

create table public.tutor_lessons (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  language        text not null default 'fr',
  level           text not null,                         -- A1/A2/B1/B2/C1/C2
  duration_minutes int,
  topic_tags      text[] not null default '{}',
  source_doc_id   text,                                  -- Google Doc ID
  source_url      text,
  status          tutor_lesson_status not null default 'review',
  content         jsonb not null,                        -- full converted lesson
  conversion_notes text,                                 -- warnings/issues from converter
  created_by      uuid references auth.users(id) on delete set null,
  reviewed_by     uuid references auth.users(id) on delete set null,
  reviewed_at     timestamptz,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index tutor_lessons_status_idx       on public.tutor_lessons (status);
create index tutor_lessons_level_idx        on public.tutor_lessons (language, level);
create index tutor_lessons_topic_tags_idx   on public.tutor_lessons using gin (topic_tags);
create index tutor_lessons_content_gin_idx  on public.tutor_lessons using gin (content jsonb_path_ops);

create or replace function public.tutor_lessons_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger tutor_lessons_updated_at
before update on public.tutor_lessons
for each row execute function public.tutor_lessons_set_updated_at();

alter table public.tutor_lessons enable row level security;

-- Anyone authenticated can read published lessons.
create policy "tutor_lessons_read_published"
  on public.tutor_lessons for select
  to authenticated
  using (status = 'published');

-- Admins can do anything.
create policy "tutor_lessons_admin_all"
  on public.tutor_lessons for all
  to authenticated
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
  )
  with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
  );

-- Tutors can read their own draft/review lessons.
create policy "tutor_lessons_read_own"
  on public.tutor_lessons for select
  to authenticated
  using (created_by = auth.uid());
