-- Replace the unsubstantiated default title/description in app_settings.
--
-- These rows are the fallback <title> and meta description for every app page
-- that does not set its own. In production they still read
-- "Franco Link - #1 Best Online Language Learning Platform" and
-- "Join 5,000+ students ...", claims the business cannot substantiate (there
-- are no reviews and no such learner count; see site-brief.md).
--
-- Only rows still holding the old claims are touched, so a value an admin has
-- since rewritten by hand is left alone.

update app_settings
set value = 'Learn French, English & Spanish Online with Certified Tutors | FrancoLink'
where category = 'seo'
  and key = 'meta_title'
  and (value ilike '%#1%' or value ilike '%best online%');

update app_settings
set value = 'Learn a language with structured CEFR lessons, live certified tutors and daily practice. Start free with a 90-second placement test.'
where category = 'seo'
  and key = 'meta_description'
  and (value ilike '%5,000%' or value ilike '%#1%');

-- The tagline printed in the marketing-site footer on every page.
update app_settings
set value = 'Learn · Speak · Connect'
where key = 'app_tagline'
  and (value ilike '%#1%' or value ilike '%best online%');
