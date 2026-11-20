-- Which exam a learner is preparing for, and roughly when (mobile PRD §5.4.7).
--
-- learning_goals already says *that* someone is here for an exam; it doesn't
-- say which one or when. The app asks both during onboarding and uses them to
-- frame the daily habit ("TCF Canada · 5 months to go") rather than points.
--
-- exam_date is month-precise: onboarding offers the next twelve months, and
-- the app stores the first day of the chosen month. Null = not booked yet.
-- Both columns are written by the learner themselves under the existing
-- users RLS, like daily_goal_minutes.

alter table public.users
  add column if not exists exam_type text
    check (exam_type in ('tcf_canada', 'tef_canada', 'delf_dalf', 'tcf_tp', 'other'));

alter table public.users
  add column if not exists exam_date date;

comment on column public.users.exam_type is
  'Exam the learner is preparing for (onboarding): tcf_canada, tef_canada, delf_dalf, tcf_tp, other. Null = none.';
comment on column public.users.exam_date is
  'First day of the month the exam is booked for. Null = not booked or no exam.';
