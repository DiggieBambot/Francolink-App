-- The private pack's lessons last 30 days, not 120.
--
-- 20261001_private_pack.sql gave it 120 days. Back to the platform-wide
-- 30, the same rule every other credit follows. Only future purchases change:
-- grant_starter_pack() reads credit_days from the purchase row, which
-- snapshots it at checkout, so lessons already bought keep the expiry they
-- were sold with.
update public.starter_packs
   set credit_days = 30
 where pack_key = 'private_professional_10';
