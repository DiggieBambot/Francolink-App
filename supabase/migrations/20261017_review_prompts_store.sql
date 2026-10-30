-- Store review requests from the mobile app, and an end to review gating.
--
-- The web card used to send only "happy" answers to Trustpilot. Trustpilot
-- forbids selective invitations, so the card now offers the Trustpilot link to
-- everyone it asks, with private feedback as a side option. 'positive' now
-- means "clicked through to Trustpilot" and 'negative' means "sent us private
-- feedback"; the old names stay so existing rows keep their meaning close
-- enough and the check constraint needs no rewrite.
--
-- The app asks through the store's own review sheet. The store never says
-- whether the sheet appeared, so we count requests and space them out.

alter table public.review_prompts
  add column if not exists store_review_count   int not null default 0,
  add column if not exists store_review_last_at timestamptz;
