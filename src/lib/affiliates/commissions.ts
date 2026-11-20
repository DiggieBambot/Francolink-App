// Creator commission: the money side of the affiliate program.
//
// One ledger, two payment sources:
//
//   stripe  a self-study subscription invoice paid on the web
//   play    a Google Play purchase reported by RevenueCat
//
// Each payment writes at most one 'sale' row (a unique index on
// (source, source_id) makes webhook retries harmless). Refunds and chargebacks
// write a 'reversal' row against it, or void the sale if it was never paid out.
//
// Everything here is called from webhooks and never throws: a commission
// failing must not fail the webhook that grants the customer their access.

import { createServiceClient } from "@/lib/supabase/service";
import { HOLD_DAYS, WINDOW_MONTHS, type Affiliate } from "./index";

const DAY_MS = 24 * 60 * 60 * 1000;

export type CommissionSource = "stripe" | "play";

export interface SaleInput {
  userId: string;
  source: CommissionSource;
  sourceId: string;
  /** What the commission is a percentage of, in minor units: after tax and store fees. */
  baseCents: number;
  currency: string;
  paidAt: Date;
}

/**
 * Has this customer's commission window closed?
 *
 * The window opens at their first commissionable payment. The 3-day margin is
 * for monthly plans: payment 13 lands exactly 12 months after payment 1, and
 * Stripe's clock can run a few seconds either side of that, so "inside 12
 * months" has to mean "clearly before the anniversary". Annual plans earn on
 * their first payment only, for the same reason.
 */
async function windowClosed(userId: string, affiliateId: string, paidAt: Date): Promise<boolean> {
  const { data: first } = await createServiceClient()
    .from("affiliate_commissions")
    .select("created_at")
    .eq("user_id", userId)
    .eq("affiliate_id", affiliateId)
    .eq("kind", "sale")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!first) return false;

  const closes = new Date(first.created_at);
  closes.setUTCMonth(closes.getUTCMonth() + WINDOW_MONTHS);
  return paidAt.getTime() >= closes.getTime() - 3 * DAY_MS;
}

/** Record a creator's share of one payment, if the customer has a creator. */
export async function recordSale(input: SaleInput): Promise<void> {
  try {
    if (input.baseCents <= 0) return;
    const db = createServiceClient();

    const { data: user } = await db
      .from("users")
      .select("referred_by_affiliate_id")
      .eq("id", input.userId)
      .maybeSingle();
    if (!user?.referred_by_affiliate_id) return;

    const { data: affiliate } = await db
      .from("affiliates")
      .select("id, commission_rate, status")
      .eq("id", user.referred_by_affiliate_id)
      .maybeSingle<Pick<Affiliate, "id" | "commission_rate" | "status">>();
    // Pausing a creator stops their earnings, not just new sign-ups: it is the
    // lever for a creator found gaming the program.
    if (!affiliate || affiliate.status !== "active") return;

    if (await windowClosed(input.userId, affiliate.id, input.paidAt)) return;

    const rate = Number(affiliate.commission_rate);
    const amountCents = Math.round(input.baseCents * rate);
    if (amountCents <= 0) return;

    const { error } = await db.from("affiliate_commissions").insert({
      affiliate_id: affiliate.id,
      user_id: input.userId,
      kind: "sale",
      source: input.source,
      source_id: input.sourceId,
      base_cents: input.baseCents,
      rate,
      amount_cents: amountCents,
      currency: input.currency.toLowerCase(),
      status: "pending",
      available_at: new Date(input.paidAt.getTime() + HOLD_DAYS * DAY_MS).toISOString(),
    });

    // 23505: this payment was already recorded by an earlier delivery.
    if (error && error.code !== "23505") {
      console.error("[affiliates] recording sale failed", input.source, input.sourceId, error.message);
    }
  } catch (e) {
    console.error("[affiliates] recordSale threw", e);
  }
}

/**
 * Take back the commission on (part of) a refunded payment.
 *
 * `fraction` is the share of the payment refunded so far, cumulative -- Stripe
 * reports a second partial refund as the new total, not the increment -- so
 * this computes what should have been reversed in total and writes only the
 * difference. Calling it twice with the same fraction does nothing.
 */
export async function reverseSale(source: CommissionSource, sourceId: string, fraction: number): Promise<void> {
  try {
    const share = Math.min(Math.max(fraction, 0), 1);
    if (share === 0) return;
    const db = createServiceClient();

    const { data: sale } = await db
      .from("affiliate_commissions")
      .select("id, affiliate_id, user_id, base_cents, rate, amount_cents, currency, status, available_at")
      .eq("source", source)
      .eq("source_id", sourceId)
      .eq("kind", "sale")
      .maybeSingle();
    if (!sale || sale.status === "void") return;

    // Never paid and refunded in full: the sale simply never happened.
    if (sale.status === "pending" && share === 1) {
      const { count } = await db
        .from("affiliate_commissions")
        .select("id", { count: "exact", head: true })
        .eq("reverses_id", sale.id);
      if (!count) {
        await db.from("affiliate_commissions").update({ status: "void" }).eq("id", sale.id).eq("status", "pending");
        return;
      }
    }

    const { data: prior } = await db
      .from("affiliate_commissions")
      .select("amount_cents")
      .eq("reverses_id", sale.id);
    const alreadyReversed = -(prior ?? []).reduce((sum, r) => sum + r.amount_cents, 0);
    const shouldBeReversed = Math.round(sale.amount_cents * share);
    const delta = shouldBeReversed - alreadyReversed;
    if (delta <= 0) return;

    // While the sale is still held, its reversal is held to the same date so
    // the two net out together instead of showing a negative payable balance.
    const availableAt =
      sale.status === "pending" && new Date(sale.available_at).getTime() > Date.now()
        ? sale.available_at
        : new Date().toISOString();

    const { error } = await db.from("affiliate_commissions").insert({
      affiliate_id: sale.affiliate_id,
      user_id: sale.user_id,
      kind: "reversal",
      source,
      source_id: sourceId,
      reverses_id: sale.id,
      base_cents: -Math.round(sale.base_cents * share),
      rate: sale.rate,
      amount_cents: -delta,
      currency: sale.currency,
      status: "pending",
      available_at: availableAt,
    });
    if (error) console.error("[affiliates] recording reversal failed", source, sourceId, error.message);
  } catch (e) {
    console.error("[affiliates] reverseSale threw", e);
  }
}

// ---------------------------------------------------------------------------
// Reporting: shared by the admin pages and the creator dashboard.
// ---------------------------------------------------------------------------

export interface CommissionRow {
  id: string;
  affiliate_id: string;
  user_id: string | null;
  kind: "sale" | "reversal";
  source: CommissionSource;
  source_id: string;
  base_cents: number;
  rate: number;
  amount_cents: number;
  currency: string;
  status: "pending" | "paid" | "void";
  available_at: string;
  payout_id: string | null;
  created_at: string;
}

export interface Balance {
  currency: string;
  /** Earned but still inside the refund hold. */
  heldCents: number;
  /** Ready to pay out now (may be negative after a refund on paid commission). */
  payableCents: number;
  paidCents: number;
}

/** Totals per currency. Commission is never converted between currencies. */
export function balances(rows: CommissionRow[], now = Date.now()): Balance[] {
  const by = new Map<string, Balance>();
  for (const r of rows) {
    if (r.status === "void") continue;
    const b = by.get(r.currency) ?? { currency: r.currency, heldCents: 0, payableCents: 0, paidCents: 0 };
    if (r.status === "paid") b.paidCents += r.amount_cents;
    else if (new Date(r.available_at).getTime() <= now) b.payableCents += r.amount_cents;
    else b.heldCents += r.amount_cents;
    by.set(r.currency, b);
  }
  return [...by.values()];
}

export function formatCents(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}
