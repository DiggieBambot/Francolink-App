-- Allow the TESTER role.
--
-- The app already treats TESTER as privileged (unlimited AI tutor, access while
-- the tutor is switched off, lesson limits lifted — see lib/ai/tutor-access.ts,
-- lib/utils/lesson-limits.ts and the student layouts), but the role check from
-- 20260717_roles_support.sql never listed it, so no account could hold it.
--
-- Applied by hand in the SQL editor on 2026-11-23; kept here so the repo
-- matches the database.

alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('USER', 'TUTOR', 'ADMIN', 'COMMUNITY_MANAGER', 'TESTER'));
