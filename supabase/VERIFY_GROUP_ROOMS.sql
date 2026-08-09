-- Run this in the Supabase SQL Editor AFTER applying
-- migrations/20260806_lesson_room_participants.sql.
--
-- Everything reports into ONE result table at the bottom — the SQL Editor only
-- displays the last result set, and RAISE NOTICE output hides in a separate
-- pane that is easy to miss. Nothing here leaves permanent data behind.

create temp table if not exists _verify (
  ord        int,
  check_name text,
  result     text,
  detail     text
);

delete from _verify;

-- 1. Structure ---------------------------------------------------------------
insert into _verify
select 1, 'table exists',
  case when count(*) = 1 then 'PASS' else 'FAIL' end,
  'public.lesson_room_participants'
from information_schema.tables
where table_schema = 'public' and table_name = 'lesson_room_participants';

insert into _verify
select 2, 'is_group column',
  case when count(*) = 1 then 'PASS' else 'FAIL' end,
  'tutor_lesson_sessions.is_group'
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tutor_lesson_sessions'
  and column_name = 'is_group';

-- 2. The legacy scheduling table must be untouched by all this ---------------
insert into _verify
select 3, 'legacy table intact',
  case when count(*) = 3 then 'PASS' else 'FAIL' end,
  'session_participants still has ' || count(*) || ' of its 3 original columns'
from information_schema.columns
where table_schema = 'public' and table_name = 'session_participants'
  and column_name in ('session_id', 'student_id', 'joined_at');

-- 3. Backfill ----------------------------------------------------------------
insert into _verify
select 4, 'backfill complete',
  case when count(*) = 0 then 'PASS' else 'FAIL' end,
  count(*) || ' existing session(s) missing a tutor participant row'
from public.tutor_lesson_sessions s
where not exists (
  select 1 from public.lesson_room_participants p
  where p.session_id = s.id and p.user_id = s.tutor_id
);

-- 4. Triggers: seeding on insert, and the cap at 5 ---------------------------
do $$
declare
  t_id     uuid;
  learners uuid[];
  s_id     uuid;
  seeded   int;
  fitted   int := 0;
  blocked  boolean := false;
begin
  select id into t_id from public.users limit 1;
  select array_agg(id) into learners
  from (select id from public.users where id <> t_id limit 6) x;

  if t_id is null or coalesce(array_length(learners, 1), 0) < 6 then
    insert into _verify values
      (5, 'seeding trigger', 'SKIP', 'needs >= 7 rows in public.users'),
      (6, 'capacity cap',    'SKIP', 'needs >= 7 rows in public.users');
    return;
  end if;

  insert into public.tutor_lesson_sessions (tutor_id, student_id, status, is_group)
  values (t_id, t_id, 'active', true)
  returning id into s_id;

  select count(*) into seeded
  from public.lesson_room_participants where session_id = s_id;

  insert into _verify values
    (5, 'seeding trigger',
     case when seeded = 1 then 'PASS' else 'FAIL' end,
     'auto-added ' || seeded || ' row(s) on insert, expected 1 (the tutor)');

  -- Five learners must fit.
  begin
    for i in 1..5 loop
      insert into public.lesson_room_participants (session_id, user_id, role)
      values (s_id, learners[i], 'student');
      fitted := fitted + 1;
    end loop;
  exception when others then
    null;
  end;

  -- The sixth must be refused.
  begin
    insert into public.lesson_room_participants (session_id, user_id, role)
    values (s_id, learners[6], 'student');
  exception when others then
    blocked := true;
  end;

  insert into _verify values
    (6, 'capacity cap',
     case when fitted = 5 and blocked then 'PASS' else 'FAIL' end,
     fitted || ' of 5 learners accepted; 6th was ' ||
     case when blocked then 'rejected' else 'ACCEPTED — cap not enforced' end);

  -- Clean up (cascades to lesson_room_participants).
  delete from public.tutor_lesson_sessions where id = s_id;
end $$;

-- 5. No policy recursion -----------------------------------------------------
insert into _verify
select 7, 'no policy recursion', 'PASS',
  'select on lesson_room_participants completed (' || count(*) || ' row(s))'
from public.lesson_room_participants;

-- Results --------------------------------------------------------------------
select check_name, result, detail from _verify order by ord;

drop table _verify;
