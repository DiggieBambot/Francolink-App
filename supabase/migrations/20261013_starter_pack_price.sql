-- Starter pack repriced: 3 lessons for $29 (community) and $59 (professional),
-- up from $24 and $54. That is $9.67 and $19.67 a lesson, still above the
-- 50-minute tutor pay, so starter_packs_margin_ok() accepts both.
--
-- Checkout, the OTO page and the /start picker all read price_cents from this
-- table, so nothing else has to change for the new price to be charged.

update public.starter_packs set price_cents = 2900 where pack_key = 'starter_community';
update public.starter_packs set price_cents = 5900 where pack_key = 'starter_professional';
