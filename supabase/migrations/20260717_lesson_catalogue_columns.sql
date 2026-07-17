-- ============================================
-- Migration: catalogue projection columns for tutor_lessons
--
-- The /library catalogue only needs a thumbnail, a subtitle and a step count
-- from each lesson — but the old query pulled the ENTIRE `content` JSON of all
-- ~558 published lessons (a 6+ MB payload, ~5s query) just to read those three
-- fields. These STORED generated columns compute them once on write so the
-- catalogue can select tiny scalar columns instead of the whole blob.
-- ============================================

alter table public.tutor_lessons
  add column if not exists hero_image_url text
    generated always as (content->>'hero_image_url') stored;

alter table public.tutor_lessons
  add column if not exists title_translation text
    generated always as (content->>'title_translation') stored;

alter table public.tutor_lessons
  add column if not exists section_count int
    generated always as (
      case
        when jsonb_typeof(content->'sections') = 'array'
        then jsonb_array_length(content->'sections')
        else 0
      end
    ) stored;

-- Speeds up the "published, ordered by title" catalogue scan.
create index if not exists tutor_lessons_published_title_idx
  on public.tutor_lessons (status, title);

-- Rollback:
--   drop index if exists tutor_lessons_published_title_idx;
--   alter table public.tutor_lessons
--     drop column if exists hero_image_url,
--     drop column if exists title_translation,
--     drop column if exists section_count;
