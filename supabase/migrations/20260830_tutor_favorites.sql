-- Favouriting a tutor.
--
-- Small table, but it earns its place twice over: it is the lightest possible
-- commitment a visitor can make, and it is a filter people actually use on a
-- directory ("show me the four I liked" beats re-deriving them).
--
-- Note the spelling. The product is British-English elsewhere, but every
-- identifier here is 'favorite' to match the rest of the codebase and the
-- route path. One spelling, consistently, beats the right one inconsistently.

create table if not exists public.tutor_favorites (
  student_id uuid not null references public.users(id) on delete cascade,
  tutor_id   uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, tutor_id)
);

-- The directory asks "which of these has this student favourited", so the
-- lookup is by student. The reverse (how many people favourited this tutor)
-- rides the primary key.
create index if not exists tutor_favorites_student_idx
  on public.tutor_favorites (student_id, created_at desc);

alter table public.tutor_favorites enable row level security;

-- Strictly the student's own rows. A tutor cannot see who favourited them --
-- it would be a popularity signal we have not decided how to use, and
-- exposing it by default forecloses that decision.
drop policy if exists "student manages own favorites" on public.tutor_favorites;
create policy "student manages own favorites" on public.tutor_favorites
  for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);
