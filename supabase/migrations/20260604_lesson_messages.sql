-- Chat messages for live lesson rooms. Realtime broadcast carries live chat;
-- this table persists history so a refresh restores the conversation.

create table if not exists public.tutor_lesson_messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.tutor_lesson_sessions(id) on delete cascade,
  sender_id    uuid references auth.users(id) on delete set null,
  sender_name  text,
  sender_role  text,
  text         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists tutor_lesson_messages_session_idx
  on public.tutor_lesson_messages (session_id, created_at);

alter table public.tutor_lesson_messages enable row level security;

drop policy if exists "tlm_read_session_member" on public.tutor_lesson_messages;
create policy "tlm_read_session_member"
  on public.tutor_lesson_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.tutor_lesson_sessions s
      where s.id = session_id and (s.tutor_id = auth.uid() or s.student_id = auth.uid())
    )
  );

drop policy if exists "tlm_write_session_member" on public.tutor_lesson_messages;
create policy "tlm_write_session_member"
  on public.tutor_lesson_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid() and exists (
      select 1 from public.tutor_lesson_sessions s
      where s.id = session_id and (s.tutor_id = auth.uid() or s.student_id = auth.uid())
    )
  );
