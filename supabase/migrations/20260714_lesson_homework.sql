-- ============================================
-- Migration: optional homework for /library lessons
--
-- Homework attaches to a published library lesson (public.tutor_lessons — the
-- v2 JSON lessons shown at /library/<category>/... , NOT the legacy
-- lessons/units/courses "learning resources" at /learn).
--
-- Rollout is per-lesson and gated by `enabled`, so we can turn homework on for
-- one small batch of lessons at a time. A lesson with no lesson_homework row —
-- or a row with enabled = false — shows no homework panel to students.
-- ============================================

-- 1. Homework definition: at most one per lesson.
--    `questions` is an ordered array of:
--      { "prompt": text, "prompt_translation"?: text, "hint"?: text,
--        "type": "short" | "long" }
--    `status`:
--      'draft'     — AI-generated, awaiting tutor edit/approval (not shown)
--      'published' — live to students (still requires enabled = true)
create table if not exists public.lesson_homework (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid not null unique references public.tutor_lessons(id) on delete cascade,
  lesson_slug   text not null,                 -- denormalised: student page routes by slug
  title         text not null default 'Homework',
  instructions  text,
  questions     jsonb not null default '[]'::jsonb,
  status        text not null default 'draft', -- 'draft' | 'published'
  enabled       boolean not null default false,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists lesson_homework_slug_idx
  on public.lesson_homework (lesson_slug);
create index if not exists lesson_homework_live_idx
  on public.lesson_homework (enabled, status);

-- 2. One submission per (homework, student). Students may re-submit until a
--    tutor reviews it, so we upsert on this pair.
--    `answers` is an array aligned to the homework's questions:
--      [ { "answer": text }, ... ]
--    `tutor_id` is captured at submit time from users.referred_by_tutor_id so a
--    tutor's review dashboard can filter to their own students cheaply.
create table if not exists public.homework_submissions (
  id             uuid primary key default gen_random_uuid(),
  homework_id    uuid not null references public.lesson_homework(id) on delete cascade,
  lesson_id      uuid not null references public.tutor_lessons(id) on delete cascade,
  student_id     uuid not null references public.users(id) on delete cascade,
  tutor_id       uuid references public.users(id) on delete set null,
  answers        jsonb not null default '[]'::jsonb,
  status         text not null default 'submitted', -- 'submitted' | 'reviewed'
  tutor_feedback text,
  reviewed_at    timestamptz,
  submitted_at   timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (homework_id, student_id)
);

create index if not exists homework_submissions_tutor_idx
  on public.homework_submissions (tutor_id, status);
create index if not exists homework_submissions_student_idx
  on public.homework_submissions (student_id);

-- 3. updated_at triggers (reuse a shared touch function).
create or replace function public.homework_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists lesson_homework_updated_at on public.lesson_homework;
create trigger lesson_homework_updated_at
  before update on public.lesson_homework
  for each row execute function public.homework_set_updated_at();

drop trigger if exists homework_submissions_updated_at on public.homework_submissions;
create trigger homework_submissions_updated_at
  before update on public.homework_submissions
  for each row execute function public.homework_set_updated_at();

-- 4. RLS. The app's write paths go through API routes using the service role
--    (which bypasses RLS), so these policies are the safety net for any direct
--    client access.
alter table public.lesson_homework enable row level security;
alter table public.homework_submissions enable row level security;

-- Anyone authenticated may read live homework (enabled + published).
create policy "lesson_homework_read_live"
  on public.lesson_homework for select
  to authenticated
  using (enabled = true and status = 'published');

-- Tutors/admins may read all homework (to author/preview drafts).
create policy "lesson_homework_staff_read"
  on public.lesson_homework for select
  to authenticated
  using (
    exists (select 1 from public.users u
            where u.id = auth.uid() and u.role in ('TUTOR', 'ADMIN'))
  );

-- Students read/write only their own submissions.
create policy "homework_submissions_own_select"
  on public.homework_submissions for select
  to authenticated
  using (student_id = auth.uid());

create policy "homework_submissions_own_insert"
  on public.homework_submissions for insert
  to authenticated
  with check (student_id = auth.uid());

create policy "homework_submissions_own_update"
  on public.homework_submissions for update
  to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- Tutors read submissions from their own students; admins read all.
create policy "homework_submissions_tutor_select"
  on public.homework_submissions for select
  to authenticated
  using (
    tutor_id = auth.uid()
    or exists (select 1 from public.users u
               where u.id = auth.uid() and u.role = 'ADMIN')
  );

-- Rollback:
--   drop table if exists public.homework_submissions cascade;
--   drop table if exists public.lesson_homework cascade;
--   drop function if exists public.homework_set_updated_at();
