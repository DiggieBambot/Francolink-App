-- A secret link for private packs, alongside the email invites.
--
-- 20261001_private_pack.sql sold a private pack only to emails on
-- private_pack_invites. That is the tight option. This adds the loose one: a
-- pack may carry a share_token, and anyone holding /private-rate/<token> may
-- see the price and buy, signed in with any email.
--
-- The trade is deliberate: no list to keep, and the price is visible before
-- sign-up, at the cost that a forwarded link works for whoever it reaches.
-- Rotating the token kills every copy of the old link at once; setting it
-- null turns the link off and leaves the invites working.
--
-- The token is never readable by anon: the "anyone reads starter packs"
-- policy already hides private packs entirely, so a token can only be
-- matched server-side, never listed.

alter table public.starter_packs
  add column if not exists share_token text unique
    check (share_token is null or length(share_token) >= 20);

comment on column public.starter_packs.share_token is
  'Private packs only. Anyone with /private-rate/<share_token> may buy. '
  'Null = link off; invites still work.';

-- 32 hex characters from a v4 uuid: 122 random bits, nothing to guess.
update public.starter_packs
   set share_token = replace(gen_random_uuid()::text, '-', '')
 where pack_key = 'private_professional_10'
   and share_token is null;
