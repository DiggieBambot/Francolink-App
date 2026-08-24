-- Allow 'pending' in tutor_students.status.
--
-- The approval path has been half-built for a while: /api/tutor/students/respond
-- accepts and declines pending requests, and components/tutor/pending-requests
-- renders them — but a check constraint on this column only ever permitted the
-- statuses the auto-join path writes, so a pending row could not be inserted.
-- That is why tutor/students/page.tsx carried a hardcoded empty list with the
-- comment "there is no manual approval step".
--
-- The signup risk gate (20260821_signup_risk.sql) needs that path to work:
-- a suspected spam signup is routed to 'pending' so the tutor decides, instead
-- of being auto-connected and emailed about. Without this migration those
-- writes fail the constraint and the join errors out.
--
-- Values allowed after this runs:
--   active   — confirmed student, appears in class lists and homework flows
--   pending  — awaiting the tutor's decision (risk gate, or a manual request)
--   declined — tutor said no; kept rather than deleted so a bot cannot simply
--              re-request its way back into the queue
--   inactive — connection ended, retained for history

do $$
declare
  con_name text;
begin
  -- The constraint was created outside these migrations, so find it by what it
  -- constrains rather than by a name we are guessing at.
  select conname into con_name
  from pg_constraint
  where conrelid = 'public.tutor_students'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%'
  limit 1;

  if con_name is not null then
    execute format('alter table public.tutor_students drop constraint %I', con_name);
    raise notice 'dropped old status constraint: %', con_name;
  end if;
end $$;

-- Anything already in the table that we don't recognise becomes 'active', so
-- adding the constraint can't fail on legacy data. Today every row is 'active',
-- so in practice this updates nothing.
update public.tutor_students
set status = 'active'
where status is null
   or status not in ('active', 'pending', 'declined', 'inactive');

alter table public.tutor_students
  add constraint tutor_students_status_check
  check (status in ('active', 'pending', 'declined', 'inactive'));

-- Pending queues are read per tutor on every Students page load.
create index if not exists tutor_students_pending_idx
  on public.tutor_students (tutor_id)
  where status = 'pending';
