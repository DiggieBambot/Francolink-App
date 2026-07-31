-- Tutor payout details (manual payouts for now; payment-provider API comes later).
-- A single flexible JSONB holds the chosen method and its fields:
--   {
--     "method": "paypal" | "skrill" | "bank" | "mobile_money",
--     "paypal_email": "...",
--     "skrill_email": "...",
--     "bank": { "account_name", "account_number", "bank_name", "swift_iban", "country" },
--     "mobile_money": { "country", "number", "provider" },
--     "updated_at": "ISO"
--   }
alter table public.users
  add column if not exists payout_details jsonb;

comment on column public.users.payout_details is
  'Tutor payout destination (manual payouts). See 20260731_tutor_payout_details.sql for shape.';
