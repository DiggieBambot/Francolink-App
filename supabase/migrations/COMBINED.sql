-- FrancoLink lesson + session schema (idempotent — safe to re-run).
-- Paste into Supabase Dashboard → SQL Editor → Run.

-- ─────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────

do $$ begin
  create type tutor_lesson_status as enum ('draft', 'review', 'published', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tutor_lesson_session_status as enum ('scheduled', 'active', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────────────
-- SHARED HELPERS
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.tutor_lessons_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────────────
-- TABLE: tutor_lessons
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.tutor_lessons (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  language        text not null default 'fr',
  level           text not null,
  duration_minutes int,
  topic_tags      text[] not null default '{}',
  source_doc_id   text,
  source_url      text,
  status          tutor_lesson_status not null default 'review',
  content         jsonb not null,
  conversion_notes text,
  created_by      uuid references auth.users(id) on delete set null,
  reviewed_by     uuid references auth.users(id) on delete set null,
  reviewed_at     timestamptz,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists tutor_lessons_status_idx       on public.tutor_lessons (status);
create index if not exists tutor_lessons_level_idx        on public.tutor_lessons (language, level);
create index if not exists tutor_lessons_topic_tags_idx   on public.tutor_lessons using gin (topic_tags);
create index if not exists tutor_lessons_content_gin_idx  on public.tutor_lessons using gin (content jsonb_path_ops);

drop trigger if exists tutor_lessons_updated_at on public.tutor_lessons;
create trigger tutor_lessons_updated_at
before update on public.tutor_lessons
for each row execute function public.tutor_lessons_set_updated_at();

alter table public.tutor_lessons enable row level security;

drop policy if exists "tutor_lessons_read_published" on public.tutor_lessons;
create policy "tutor_lessons_read_published"
  on public.tutor_lessons for select
  to authenticated
  using (status = 'published');

drop policy if exists "tutor_lessons_admin_all" on public.tutor_lessons;
create policy "tutor_lessons_admin_all"
  on public.tutor_lessons for all
  to authenticated
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
  )
  with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
  );

drop policy if exists "tutor_lessons_read_own" on public.tutor_lessons;
create policy "tutor_lessons_read_own"
  on public.tutor_lessons for select
  to authenticated
  using (created_by = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- TABLE: tutor_lesson_sessions
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.tutor_lesson_sessions (
  id                   uuid primary key default gen_random_uuid(),
  tutor_id             uuid not null references auth.users(id) on delete cascade,
  student_id           uuid not null references auth.users(id) on delete cascade,
  tutor_lesson_id      uuid references public.tutor_lessons(id) on delete set null,
  title                text,
  status               tutor_lesson_session_status not null default 'scheduled',
  scheduled_at         timestamptz,
  started_at           timestamptz,
  ended_at             timestamptz,
  current_section_idx  int default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists tutor_lesson_sessions_tutor_idx
  on public.tutor_lesson_sessions (tutor_id, status);
create index if not exists tutor_lesson_sessions_student_idx
  on public.tutor_lesson_sessions (student_id, status);

drop trigger if exists tutor_lesson_sessions_updated_at on public.tutor_lesson_sessions;
create trigger tutor_lesson_sessions_updated_at
before update on public.tutor_lesson_sessions
for each row execute function public.tutor_lessons_set_updated_at();

alter table public.tutor_lesson_sessions enable row level security;

drop policy if exists "tls_read_own" on public.tutor_lesson_sessions;
create policy "tls_read_own"
  on public.tutor_lesson_sessions for select
  to authenticated
  using (tutor_id = auth.uid() or student_id = auth.uid());

drop policy if exists "tls_insert_as_tutor" on public.tutor_lesson_sessions;
create policy "tls_insert_as_tutor"
  on public.tutor_lesson_sessions for insert
  to authenticated
  with check (tutor_id = auth.uid());

drop policy if exists "tls_update_as_tutor" on public.tutor_lesson_sessions;
create policy "tls_update_as_tutor"
  on public.tutor_lesson_sessions for update
  to authenticated
  using (tutor_id = auth.uid())
  with check (tutor_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────
-- TABLE: tutor_lesson_highlights
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.tutor_lesson_highlights (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.tutor_lesson_sessions(id) on delete cascade,
  section_idx   int not null,
  anchor_id     text not null,
  text          text,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists tutor_lesson_highlights_session_idx
  on public.tutor_lesson_highlights (session_id, section_idx);

create unique index if not exists tutor_lesson_highlights_unique
  on public.tutor_lesson_highlights (session_id, anchor_id);

alter table public.tutor_lesson_highlights enable row level security;

drop policy if exists "tlh_read_session_member" on public.tutor_lesson_highlights;
create policy "tlh_read_session_member"
  on public.tutor_lesson_highlights for select
  to authenticated
  using (
    exists (
      select 1 from public.tutor_lesson_sessions s
      where s.id = session_id
        and (s.tutor_id = auth.uid() or s.student_id = auth.uid())
    )
  );

drop policy if exists "tlh_write_session_member" on public.tutor_lesson_highlights;
create policy "tlh_write_session_member"
  on public.tutor_lesson_highlights for insert
  to authenticated
  with check (
    exists (
      select 1 from public.tutor_lesson_sessions s
      where s.id = session_id
        and (s.tutor_id = auth.uid() or s.student_id = auth.uid())
    )
  );

drop policy if exists "tlh_delete_session_member" on public.tutor_lesson_highlights;
create policy "tlh_delete_session_member"
  on public.tutor_lesson_highlights for delete
  to authenticated
  using (created_by = auth.uid());
