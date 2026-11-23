-- AI tutoring classes follow the live-class curriculum.
--
-- Each class now opens by offering the student a few published live-tutor
-- lessons (tutor_lessons) that fit their level and goals; the one they pick is
-- taught section by section. Two facts per conversation make that work:
--   offered_lesson_ids  — what Léon offered at the start of this class, so a
--                         spoken answer ("the weather one") can be matched to
--                         a lesson on the next turn
--   lesson_completed_at — when the student reached the end of the lesson, so
--                         finished lessons are not offered again and an
--                         unfinished one can be resumed next class

alter table public.ai_tutor_conversations
  add column if not exists offered_lesson_ids uuid[] not null default '{}'::uuid[],
  add column if not exists lesson_completed_at timestamptz;

create index if not exists ai_tutor_conversations_lesson_idx
  on public.ai_tutor_conversations (user_id, tutor_lesson_id)
  where tutor_lesson_id is not null;

-- Rollback:
--   drop index if exists ai_tutor_conversations_lesson_idx;
--   alter table public.ai_tutor_conversations
--     drop column if exists offered_lesson_ids,
--     drop column if exists lesson_completed_at;
