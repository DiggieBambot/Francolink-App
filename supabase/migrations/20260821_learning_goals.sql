-- Why a learner signed up, captured during onboarding.
--
-- Until now onboarding asked what language, what level and how many minutes a
-- day — everything about the *mechanics* of practising, nothing about what the
-- learner is actually trying to do. "I need French for a job in Douala" and "I
-- want to talk to my in-laws" are different lessons, and the tutor only found
-- out in the first session.
--
-- Stored as a plain text[] of stable slugs rather than a join table: the list
-- is short, it is only ever read back whole (profile, tutor matching, the
-- tutor's view of a new student), and nothing needs to query across learners
-- by a single goal yet. Free text the learner typed under "Other" lands in
-- learning_goal_other, kept separate so the slugs stay a closed set.

alter table public.users
  add column if not exists learning_goals text[] not null default '{}'::text[];

alter table public.users
  add column if not exists learning_goal_other text;

comment on column public.users.learning_goals is
  'Onboarding goal slugs: career, university, exam, fun, travel, family, other.';
comment on column public.users.learning_goal_other is
  'Free text typed when "other" is among learning_goals. Null otherwise.';

-- Finding every learner preparing for an exam should not scan the table once
-- goal-based tutor matching lands.
create index if not exists users_learning_goals_idx
  on public.users using gin (learning_goals);
