-- tutor_lesson_sessions: live sessions between a tutor and a student, working
-- through one tutor_lessons row together. Presence + highlights + chat run on
-- Supabase Realtime broadcast (no persistent table needed for ephemeral events).

create type tutor_lesson_session_status as enum ('scheduled', 'active', 'completed', 'cancelled');

create table public.tutor_lesson_sessions (
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

create index tutor_lesson_sessions_tutor_idx   on public.tutor_lesson_sessions (tutor_id, status);
create index tutor_lesson_sessions_student_idx on public.tutor_lesson_sessions (student_id, status);

create trigger tutor_lesson_sessions_updated_at
before update on public.tutor_lesson_sessions
for each row execute function public.tutor_lessons_set_updated_at();

alter table public.tutor_lesson_sessions enable row level security;

-- Both tutor and student in the session can read it.
create policy "tls_read_own"
  on public.tutor_lesson_sessions for select
  to authenticated
  using (tutor_id = auth.uid() or student_id = auth.uid());

-- Tutor creates the session.
create policy "tls_insert_as_tutor"
  on public.tutor_lesson_sessions for insert
  to authenticated
  with check (tutor_id = auth.uid());

-- Tutor updates session state (start/end, current section).
create policy "tls_update_as_tutor"
  on public.tutor_lesson_sessions for update
  to authenticated
  using (tutor_id = auth.uid())
  with check (tutor_id = auth.uid());

-- Optional persistence layer for highlights that survive a refresh.
-- Ephemeral highlights still go through Realtime broadcast; this table is for
-- "tutor pinned this word" semantics that the student can re-load.

create table public.tutor_lesson_highlights (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.tutor_lesson_sessions(id) on delete cascade,
  section_idx   int not null,
  anchor_id     text not null,         -- data-highlight-id of the marked element
  text          text,                  -- the phrase, for display in sidebar
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index tutor_lesson_highlights_session_idx
  on public.tutor_lesson_highlights (session_id, section_idx);

create unique index tutor_lesson_highlights_unique
  on public.tutor_lesson_highlights (session_id, anchor_id);

alter table public.tutor_lesson_highlights enable row level security;

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

create policy "tlh_delete_session_member"
  on public.tutor_lesson_highlights for delete
  to authenticated
  using (created_by = auth.uid());
