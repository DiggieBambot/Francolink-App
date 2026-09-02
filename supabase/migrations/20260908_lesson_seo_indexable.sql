-- ============================================
-- Migration: SEO index gate for the public lesson catalogue
--
-- ~645 published lessons are crawlable at /library/lesson/<slug>. An audit
-- found that a large share carry template artefacts rather than teaching
-- content: objectives rendered as a bare "Vous", and an identical filler
-- vocabulary block (routine / schedule / habit / manage) pasted into lessons
-- whose topic has nothing to do with those words.
--
-- Indexing pages like that at scale is a sitewide quality risk, so the
-- catalogue needs a per-lesson verdict that the sitemap and the page's robots
-- meta can honour. `scripts/lint-lessons.mjs --apply` computes it.
--
-- Deliberately NOT a generated column: the rules live in the lint script and
-- will be tuned as the content is repaired, and one of them (cross-lesson
-- vocabulary overlap) cannot be expressed per-row in SQL at all.
--
-- Defaults to true so nothing changes until the lint is applied — this
-- migration on its own is a no-op for what is currently indexed.
-- ============================================

alter table public.tutor_lessons
  add column if not exists seo_indexable boolean not null default true;

comment on column public.tutor_lessons.seo_indexable is
  'False when scripts/lint-lessons.mjs judges the lesson too thin or too '
  'templated to index. Drives sitemap inclusion and the page robots meta. '
  'Does not affect in-app visibility — students still see the lesson.';

-- The sitemap scans published + indexable.
create index if not exists tutor_lessons_published_indexable_idx
  on public.tutor_lessons (status, seo_indexable);

-- Rollback:
--   drop index if exists tutor_lessons_published_indexable_idx;
--   alter table public.tutor_lessons drop column if exists seo_indexable;
