// src/types/commission.ts
//
// Tutor referral commission rows, as the tables actually are (read from the
// live schema 2026-10-14). The previous version described columns that never
// existed -- commission_amount, gross_amount, currency, notes -- and code
// written against it summed and inserted those, which is how the earnings page
// showed NaN and admin payouts failed.

export interface CommissionLedgerEntry {
  id: string;
  tutor_id: string;
  student_id: string | null;
  subscription_id: string | null;
  /** Dollars. Negative for a reversal (refund). */
  amount: number;
  /** Null for flat lesson-plan bounties. */
  commission_rate: number | null;
  period_start: string | null;
  period_end: string | null;
  status: string;
  kind: 'subscription_share' | 'lesson_plan_bounty';
  booking_id: string | null;
  created_at: string;
}

export interface CommissionPayout {
  id: string;
  tutor_id: string;
  amount: number;
  ledger_ids: string[] | null;
  payout_method: string | null;
  payout_reference: string | null;
  status: 'requested' | 'completed';
  processed_at: string | null;
  created_at: string;
}
