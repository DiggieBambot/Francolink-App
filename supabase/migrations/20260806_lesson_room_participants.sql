-- ============================================
-- Migration: group classrooms for premium tutors
--
-- Until now a live room was strictly one tutor ↔ one student, encoded as
-- tutor_lesson_sessions.student_id. This adds a membership table so a room can
-- hold up to MAX_GROUP_LEARNERS students, and gates group rooms to tutors whose
-- tutor_public_profiles.tier is 'professional'.
--
-- student_id is kept and still written for 1:1 sessions: existing rows, the
-- booking flow (bookings.room_session_id) and the tutor's in-room Ring button
-- all read it. It is now a *denormalised convenience* for the pair case, not
-- the source of truth for access. Access is this table.
-- ============================================

-- Preflight. An earlier draft of this migration called the table
-- `session_participants`, which already exists in this database and belongs to
-- the legacy tutor_sessions scheduling system. `create table if not exists`
-- no-op'd against it and the migration then failed halfway through on a column
-- that wasn't there. This guard turns that class of mistake into an immediate,
-- readable error instead of a partial apply.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'lesson_room_participants'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lesson_room_participants'
      and column_name = 'user_id'
  ) then
    raise exception
      'lesson_room_participants already exists with a different shape — resolve before applying';
  end if;
end $$;

create table if not exists public.lesson_room_participants (
  session_id  uuid not null references public.tutor_lesson_sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('tutor', 'student')),
  joined_at   timestamptz not null default now(),
  primary key (session_id, user_id)
);

create index if not exists lesson_room_participants_user_idx
  on public.lesson_room_participants (user_id, joined_at desc);

comment on table public.lesson_room_participants is
  'Who may enter a live room. Replaces the tutor_id/student_id pair as the access check.';

-- ---------------------------------------------------------------------------
-- Capacity: at most 5 students per room (the tutor does not count against it).
-- Enforced in the database because the join path is racy by nature — five
-- students can click a shared link in the same instant.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_lesson_room_capacity()
returns trigger
language plpgsql
as $$
declare
  learner_count int;
begin
  if new.role <> 'student' then
    return new;
  end if;

  -- Lock the session row so concurrent joins serialise behind each other.
  perform 1 from public.tutor_lesson_sessions where id = new.session_id for update;

  select count(*) into learner_count
  from public.lesson_room_participants
  where session_id = new.session_id and role = 'student';

  if learner_count >= 5 then
    raise exception 'session_full' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists lesson_room_participants_capacity on public.lesson_room_participants;
create trigger lesson_room_participants_capacity
before insert on public.lesson_room_participants
for each row execute function public.enforce_lesson_room_capacity();

-- ---------------------------------------------------------------------------
-- Backfill: every existing session becomes a two-row membership, so the 1:1
-- path runs through exactly the same code as a group from here on.
-- The student_id = tutor_id sentinel ("open classroom") is not a real learner.
-- ---------------------------------------------------------------------------
insert into public.lesson_room_participants (session_id, user_id, role, joined_at)
select id, tutor_id, 'tutor', created_at
from public.tutor_lesson_sessions
on conflict do nothing;

insert into public.lesson_room_participants (session_id, user_id, role, joined_at)
select id, student_id, 'student', created_at
from public.tutor_lesson_sessions
where student_id is not null and student_id <> tutor_id
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Keep membership in sync automatically. Sessions are created from several
-- places (the new-session form, /api/tutor/start-room, the student live-invite
-- flow, booking confirmation), and a room whose rows were never written would
-- lock its own student out. Doing it in a trigger means no creation path can
-- forget, now or later.
-- ---------------------------------------------------------------------------
create or replace function public.seed_lesson_room_participants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.lesson_room_participants (session_id, user_id, role)
  values (new.id, new.tutor_id, 'tutor')
  on conflict do nothing;

  -- student_id = tutor_id is the "no claimed student yet" sentinel, not a learner.
  if new.student_id is not null and new.student_id <> new.tutor_id then
    insert into public.lesson_room_participants (session_id, user_id, role)
    values (new.id, new.student_id, 'student')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists tutor_lesson_sessions_seed_participants on public.tutor_lesson_sessions;
create trigger tutor_lesson_sessions_seed_participants
after insert on public.tutor_lesson_sessions
for each row execute function public.seed_lesson_room_participants();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.lesson_room_participants enable row level security;

-- A member can see who else is in a room they belong to. Phrased against
-- tutor_lesson_sessions rather than lesson_room_participants itself to avoid a
-- recursive policy evaluation.
drop policy if exists "sp_read_own_rooms" on public.lesson_room_participants;
create policy "sp_read_own_rooms"
  on public.lesson_room_participants for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.tutor_lesson_sessions s
      where s.id = session_id
        and (s.tutor_id = auth.uid() or s.student_id = auth.uid())
    )
  );

-- The owning tutor adds anyone; a student may add only themselves (link join).
drop policy if exists "sp_insert" on public.lesson_room_participants;
create policy "sp_insert"
  on public.lesson_room_participants for insert
  to authenticated
  with check (
    exists (
      select 1 from public.tutor_lesson_sessions s
      where s.id = session_id
        and (s.tutor_id = auth.uid() or (user_id = auth.uid() and role = 'student'))
    )
  );

-- Leaving, or the tutor removing someone.
drop policy if exists "sp_delete" on public.lesson_room_participants;
create policy "sp_delete"
  on public.lesson_room_participants for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.tutor_lesson_sessions s
      where s.id = session_id and s.tutor_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Widen the existing session/highlight policies to any participant. Each keeps
-- its old pair check as an OR branch so nothing regresses if a backfill row is
-- ever missing.
-- ---------------------------------------------------------------------------
create or replace function public.is_lesson_room_member(sid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.lesson_room_participants p
    where p.session_id = sid and p.user_id = auth.uid()
  ) or exists (
    select 1 from public.tutor_lesson_sessions s
    where s.id = sid and (s.tutor_id = auth.uid() or s.student_id = auth.uid())
  );
$$;

drop policy if exists "tls_read_own" on public.tutor_lesson_sessions;
create policy "tls_read_own"
  on public.tutor_lesson_sessions for select
  to authenticated
  using (tutor_id = auth.uid() or student_id = auth.uid() or public.is_lesson_room_member(id));

drop policy if exists "tlh_read_session_member" on public.tutor_lesson_highlights;
create policy "tlh_read_session_member"
  on public.tutor_lesson_highlights for select
  to authenticated
  using (public.is_lesson_room_member(session_id));

drop policy if exists "tlh_write_session_member" on public.tutor_lesson_highlights;
create policy "tlh_write_session_member"
  on public.tutor_lesson_highlights for insert
  to authenticated
  with check (public.is_lesson_room_member(session_id));

-- ---------------------------------------------------------------------------
-- Group rooms are a premium feature: mark the session so the room can enforce
-- it without re-deriving the tutor's tier on every entry.
-- ---------------------------------------------------------------------------
alter table public.tutor_lesson_sessions
  add column if not exists is_group boolean not null default false;

comment on column public.tutor_lesson_sessions.is_group is
  'True for a multi-learner classroom. Only tutors on the professional tier may create one.';
