-- ============================================
-- Migration: email drip campaigns
-- Tracks which automated campaign emails each user has received (idempotency
-- for the daily cron) and lets users opt out of marketing email.
-- ============================================

-- 1. Per-(user, campaign, step) send ledger.
--    UNIQUE(user_id, campaign, step) is what makes the daily cron safe to run
--    repeatedly: a second attempt to record the same step hits the conflict
--    and we skip the send.
CREATE TABLE IF NOT EXISTS email_campaign_sends (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign    text NOT NULL,          -- e.g. 'learning-tips'
  step        int  NOT NULL,          -- 1-based position in the sequence
  resend_id   text,                   -- Resend message id (for support/debug)
  sent_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, campaign, step)
);

CREATE INDEX IF NOT EXISTS idx_email_campaign_sends_user
  ON email_campaign_sends (user_id, campaign);

-- 2. Marketing opt-out flag on users.
--    Transactional email (welcome, receipts) ignores this; only drip /
--    re-engagement campaigns must honour it.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_marketing_opt_out boolean NOT NULL DEFAULT false;

-- 3. RLS: the ledger is service-role only. No policies are defined, so with RLS
--    enabled every anon/authenticated read is denied while the service role
--    (used by the cron + unsubscribe routes) bypasses RLS entirely.
ALTER TABLE email_campaign_sends ENABLE ROW LEVEL SECURITY;
