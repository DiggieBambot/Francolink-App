-- lesson_coverage: the durable record of which lessons a tutor and student
-- actually worked through together, and when.
--
-- Why a new table rather than reading tutor_lesson_sessions: a "lesson space" is
-- ONE reusable row per tutor↔student pair whose tutor_lesson_id is overwritten
-- every time they switch lessons (see lib/lessons/lesson-space.ts and
-- /api/space/[id]/lesson). That row therefore only ever names the most recent
-- lesson — the history is destroyed as it's made. This table is append-only.
--
-- Revisiting a lesson on a later day is a real event and gets its own row; the
-- unique index only collapses repeats within the same calendar day, which is
-- what makes the recorder safely idempotent (it can fire on every dwell tick).

create table if not exists public.lesson_coverage (
  id              uuid primary key default gen_random_uuid(),
  tutor_id        uuid not null references public.users(id) on delete cascade,
  student_id      uuid not null references public.users(id) on delete cascade,
  tutor_lesson_id uuid not null references public.tutor_lessons(id) on delete cascade,
  session_id      uuid references public.tutor_lesson_sessions(id) on delete set null,
  -- Denormalised so history survives a lesson being unpublished or renamed.
  lesson_title    text,
  covered_on      date not null default (now() at time zone 'utc')::date,
  minutes         int,
  created_at      timestamptz not null default now()
);

create unique index if not exists lesson_coverage_unique_per_day
  on public.lesson_coverage (tutor_id, student_id, tutor_lesson_id, covered_on);

create index if not exists lesson_coverage_student_idx
  on public.lesson_coverage (student_id, covered_on desc);
create index if not exists lesson_coverage_tutor_idx
  on public.lesson_coverage (tutor_id, covered_on desc);

alter table public.lesson_coverage enable row level security;

-- Both sides of the pair read their own history. Writes go through the
-- service-role API route (/api/space/[id]/covered), which is what decides
-- whether a lesson counts as covered — never the client directly.
create policy "lesson_coverage_read_own"
  on public.lesson_coverage for select
  to authenticated
  using (
    student_id = auth.uid()
    or tutor_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
  );
