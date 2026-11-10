// Per-creator numbers, shared by the admin pages and the creator's own dashboard.

import { createServiceClient } from "@/lib/supabase/service";
import { balances, type Balance, type CommissionRow } from "./commissions";

export interface AffiliateStats {
  clicks: number;
  signups: number;
  /** Referred customers with at least one commissioned payment. */
  customers: number;
  balances: Balance[];
  commissions: CommissionRow[];
  payouts: { id: string; amount_cents: number; currency: string; method: string | null; reference: string | null; paid_at: string }[];
}

export async function getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  const db = createServiceClient();
  const [clicks, signups, commissions, payouts] = await Promise.all([
    db.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliateId),
    db.from("users").select("id", { count: "exact", head: true }).eq("referred_by_affiliate_id", affiliateId),
    db
      .from("affiliate_commissions")
      .select("*")
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false })
      // PostgREST's row cap. Balances are summed here, so past ~1,000 ledger
      // rows for one creator this should move to a SQL sum.
      .limit(1000),
    db
      .from("affiliate_payouts")
      .select("id, amount_cents, currency, method, reference, paid_at")
      .eq("affiliate_id", affiliateId)
      .order("paid_at", { ascending: false }),
  ]);

  const rows = (commissions.data ?? []) as CommissionRow[];
  const customers = new Set(rows.filter((r) => r.kind === "sale" && r.status !== "void").map((r) => r.user_id)).size;

  return {
    clicks: clicks.count ?? 0,
    signups: signups.count ?? 0,
    customers,
    balances: balances(rows),
    commissions: rows,
    payouts: payouts.data ?? [],
  };
}
