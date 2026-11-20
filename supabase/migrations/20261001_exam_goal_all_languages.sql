-- Exams for every language the app teaches, not just French.
--
-- 20261001_exam_goal.sql only allowed the French exams, but onboarding asks
-- "which exam?" after any language: a Spanish learner was offered TCF and TEF.
-- The app now shows each language's own exams (mobile src/lib/onboarding.ts,
-- EXAMS_BY_LANGUAGE); this widens the check to match.

alter table public.users drop constraint if exists users_exam_type_check;

alter table public.users
  add constraint users_exam_type_check check (
    exam_type in (
      -- French
      'tcf_canada', 'tef_canada', 'delf_dalf', 'tcf_tp',
      -- Spanish
      'dele', 'siele',
      -- English
      'ielts', 'celpip', 'toefl', 'cambridge', 'pte',
      -- German
      'goethe', 'testdaf', 'telc', 'osd',
      'other'
    )
  );

comment on column public.users.exam_type is
  'Exam the learner is preparing for (onboarding), e.g. tcf_canada, dele, ielts, goethe; other. Null = none.';
