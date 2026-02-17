// src/types/commission.ts

export interface CommissionSettings {
  id: string;
  commission_rate: number;
  min_payout_amount: number;
  payout_schedule: 'weekly' | 'monthly' | 'on_request';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommissionLedgerEntry {
  id: string;
  tutor_id: string;
  student_id: string | null;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  description: string | null;
  created_at: string;
  paid_at: string | null;
  // Joined data
  student?: {
    full_name: string;
    email: string;
  };
}

export interface CommissionPayout {
  id: string;
  tutor_id: string;
  amount: number;
  currency: string;
  status: 'requested' | 'processing' | 'completed' | 'failed';
  payout_method: 'stripe' | 'paypal' | 'bank_transfer';
  stripe_transfer_id: string | null;
  notes: string | null;
  requested_at: string;
  processed_at: string | null;
  completed_at: string | null;
}

export interface CommissionSummary {
  total_earned: number;
  total_pending: number;
  total_paid: number;
  available_balance: number;
  referred_students: number;
  this_month: number;
}