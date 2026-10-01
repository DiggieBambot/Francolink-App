-- Editable words for a private pack's page.
--
-- /private-rate/<token> shows a welcome, four steps, a "where lessons happen"
-- section and an FAQ. Until now that text lived in code
-- (src/lib/credits/private-rate-copy.ts). This lets admin rewrite it per pack,
-- per language, from /admin/pricing/private-rate/<pack>.
--
-- Shape: { "en": PageContent, "fr": PageContent }. A missing language means
-- "use the defaults in code", so '{}' is a pack that has never been edited.
-- Like the share_token, it is never readable by anon: private packs are
-- hidden by the "anyone reads starter packs" policy, and the page reads them
-- server-side.

alter table public.starter_packs
  add column if not exists page_copy jsonb not null default '{}'::jsonb
    check (jsonb_typeof(page_copy) = 'object');

comment on column public.starter_packs.page_copy is
  'Private packs: the page''s editable words, {en, fr}. Missing language = '
  'code defaults. May use {lessons} and {days}.';
