-- ============================================
-- Migration: homework assignments + in-app notifications
--
-- Delivery model: homework CONTENT lives in lesson_homework (generated in
-- batches). A tutor then ASSIGNS a lesson's homework to specific students; only
-- then does the student see it (assignment-gated) and get a notification.
-- ============================================

-- 1. Assignments: a tutor sends a lesson's homework to a student.
create table if not exists public.homework_assignments (
  id           uuid primary key default gen_random_uuid(),
  homework_id  uuid not null references public.lesson_homework(id) on delete cascade,
  lesson_id    uuid not null references public.tutor_lessons(id) on delete cascade,
  lesson_slug  text not null,
  student_id   uuid not null references public.users(id) on delete cascade,
  tutor_id     uuid not null references public.users(id) on delete cascade,
  assigned_at  timestamptz not null default now(),
  unique (homework_id, student_id)
);

create index if not exists homework_assignments_student_idx
  on public.homework_assignments (student_id);
create index if not exists homework_assignments_tutor_idx
  on public.homework_assignments (tutor_id);

-- 2. Generic in-app notification inbox (reusable beyond homework).
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null,                 -- 'homework_assigned' | 'homework_reviewed' | ...
  title      text not null,
  body       text,
  url        text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at);

-- 3. RLS. Writes go through service-role API routes; these policies guard any
--    direct client access.
alter table public.homework_assignments enable row level security;
alter table public.notifications enable row level security;

-- Students see assignments made to them; tutors see assignments they made.
create policy "homework_assignments_student_read"
  on public.homework_assignments for select
  to authenticated
  using (student_id = auth.uid());

create policy "homework_assignments_tutor_read"
  on public.homework_assignments for select
  to authenticated
  using (
    tutor_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
  );

-- Users read + update (mark read) only their own notifications.
create policy "notifications_own_read"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_own_update"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Rollback:
--   drop table if exists public.homework_assignments cascade;
--   drop table if exists public.notifications cascade;
