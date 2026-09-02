-- The audio pack's own description overclaimed.
--
-- "Every dialogue and pronunciation drill, read at natural speed and again
-- slowly" is half true. Every dialogue does carry both speeds — 25 of 25 —
-- but one of the twelve drills is normal-only, and the survival phrases are
-- single-speed by design: a slow reading of "Bonjour" is not a lesson.
--
-- This string is what Stripe shows on the checkout line item, so it is the
-- one sentence a buyer reads with their card in hand. It should be true.

update public.digital_products
   set description = 'Every dialogue read at natural speed and again slowly, '
                     'plus the pronunciation drills and the survival phrases.'
 where product_key = 'audio_fpp';
