-- ============================================
-- Migration: student "book a class" requests
--
-- A connected student asks their tutor for a class. The tutor is notified
-- (in-app + email) and sees pending requests on their Students page.
-- ============================================

create table if not exists public.class_requests (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.users(id) on delete cascade,
  tutor_id       uuid not null references public.users(id) on delete cascade,
  message        text,
  preferred_time text,                       -- free text, e.g. "weekday evenings"
  status         text not null default 'open', -- 'open' | 'done' | 'declined'
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists class_requests_tutor_idx  on public.class_requests (tutor_id, status);
create index if not exists class_requests_student_idx on public.class_requests (student_id);

create or replace function public.class_requests_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists class_requests_updated_at on public.class_requests;
create trigger class_requests_updated_at
  before update on public.class_requests
  for each row execute function public.class_requests_set_updated_at();

alter table public.class_requests enable row level security;

create policy "class_requests_student_own"
  on public.class_requests for select
  to authenticated
  using (student_id = auth.uid());

create policy "class_requests_tutor_read"
  on public.class_requests for select
  to authenticated
  using (
    tutor_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'ADMIN')
  );

create policy "class_requests_tutor_update"
  on public.class_requests for update
  to authenticated
  using (tutor_id = auth.uid())
  with check (tutor_id = auth.uid());

-- Rollback:
--   drop table if exists public.class_requests cascade;
--   drop function if exists public.class_requests_set_updated_at();
