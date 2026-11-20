// Stripe side of the creator program: the creator's discount code, and turning
// paid invoices and refunds into ledger rows.
//
// Webhook payload shapes follow the endpoint's pinned API version (2024-04-10,
// see the Stripe webhook route), where invoice.subscription and charge.invoice
// are plain ids. Outbound calls use the shared client, pinned to
// 2024-12-18.acacia. The SDK's types describe the newest API, hence the narrow
// local types below instead of Stripe.Invoice.

import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { isLessonPlanSubscription } from "@/lib/credits/referral";
import { attributeUser, findAffiliateByPromotionCode, type Affiliate } from "./index";
import { recordSale, reverseSale } from "./commissions";

/**
 * Create the creator's Stripe promotion code (MARIE) on the shared
 * "N% off the first payment" coupon. Restricted to first-time customers, which
 * is also what lets the webhook trust a redeemed code as a NEW customer.
 */
export async function createPromotionCode(
  affiliate: Pick<Affiliate, "id" | "code" | "discount_percent">,
): Promise<{ couponId: string; promotionCodeId: string } | { error: string }> {
  if (!stripe) return { error: "Stripe isn't configured." };
  if (affiliate.discount_percent <= 0) return { error: "No discount to create a code for." };

  const couponId = `fl-creator-${affiliate.discount_percent}`;
  try {
    await stripe.coupons.retrieve(couponId);
  } catch {
    try {
      await stripe.coupons.create({
        id: couponId,
        percent_off: affiliate.discount_percent,
        duration: "once",
        name: `Creator code: ${affiliate.discount_percent}% off first payment`,
      });
    } catch (e) {
      // Another request may have created it first; retrieve proves it either way.
      try {
        await stripe.coupons.retrieve(couponId);
      } catch {
        return { error: `Couldn't create the Stripe coupon: ${(e as Error).message}` };
      }
    }
  }

  try {
    // `coupon` is the acacia-era parameter our client is pinned to; the SDK's
    // types only know the newer `promotion: { coupon }` form.
    const params = {
      coupon: couponId,
      code: affiliate.code.toUpperCase(),
      restrictions: { first_time_transaction: true },
      metadata: { affiliate_id: affiliate.id },
    } as unknown as Stripe.PromotionCodeCreateParams;
    const promo = await stripe.promotionCodes.create(params);
    return { couponId, promotionCodeId: promo.id };
  } catch (e) {
    return { error: `Couldn't create the promotion code: ${(e as Error).message}` };
  }
}

/** Turn a promotion code on or off with the creator. */
export async function setPromotionCodeActive(promotionCodeId: string, active: boolean): Promise<void> {
  if (!stripe) return;
  try {
    await stripe.promotionCodes.update(promotionCodeId, { active });
  } catch (e) {
    console.error("[affiliates] promotion code update failed", promotionCodeId, e);
  }
}

// ---------------------------------------------------------------------------
// Webhook handlers
// ---------------------------------------------------------------------------

type InvoiceLike = {
  id: string;
  customer: string | { id: string } | null;
  amount_paid: number;
  currency: string;
  total_excluding_tax?: number | null;
  subscription?: string | { id: string } | null;
  parent?: { subscription_details?: { subscription?: string | { id: string } | null } | null } | null;
  discounts?: Array<string | { id: string; promotion_code?: string | { id: string } | null }> | null;
  status_transitions?: { paid_at?: number | null } | null;
};

function idOf(v: string | { id: string } | null | undefined): string | null {
  if (!v) return null;
  return typeof v === "string" ? v : v.id;
}

/** The promotion code redeemed on an invoice, if any. */
async function promotionCodeOn(invoice: InvoiceLike): Promise<string | null> {
  const inline = (invoice.discounts ?? [])
    .map((d) => (typeof d === "string" ? null : idOf(d.promotion_code)))
    .find(Boolean);
  if (inline) return inline;
  if (!invoice.discounts?.length || !stripe) return null;

  // The webhook carries discount ids only; the promotion code needs a fetch.
  try {
    const full = await stripe.invoices.retrieve(invoice.id, { expand: ["discounts"] });
    for (const d of full.discounts ?? []) {
      if (typeof d === "string" || !("promotion_code" in d)) continue;
      const promo = idOf(d.promotion_code as string | { id: string } | null);
      if (promo) return promo;
    }
  } catch (e) {
    console.error("[affiliates] couldn't expand invoice discounts", invoice.id, e);
  }
  return null;
}

/**
 * invoice.payment_succeeded: credit the creator, if the customer has one.
 *
 * Self-study subscriptions only. Lesson plans (tutor wages) and one-off
 * purchases don't earn creator commission.
 */
export async function handleAffiliateInvoicePaid(raw: unknown): Promise<void> {
  try {
    const invoice = raw as InvoiceLike;
    const customerId = idOf(invoice.customer);
    const subscriptionId = idOf(invoice.subscription) ?? idOf(invoice.parent?.subscription_details?.subscription);
    if (!customerId || !subscriptionId || !invoice.amount_paid) return;
    if (await isLessonPlanSubscription(subscriptionId)) return;

    const { data: user } = await createServiceClient()
      .from("users")
      .select("id, referred_by_affiliate_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (!user) return;

    // Typed (or auto-applied) a creator code at checkout: that is attribution
    // too, and the only kind that works across devices.
    if (!user.referred_by_affiliate_id) {
      const promo = await promotionCodeOn(invoice);
      const affiliate = promo ? await findAffiliateByPromotionCode(promo) : null;
      if (affiliate) await attributeUser(user.id, affiliate, "code");
    }

    // Commission is on what we keep: tax is not ours.
    const base = Math.min(invoice.amount_paid, invoice.total_excluding_tax ?? invoice.amount_paid);
    const paidAt = invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000)
      : new Date();

    await recordSale({
      userId: user.id,
      source: "stripe",
      sourceId: invoice.id,
      baseCents: base,
      currency: invoice.currency,
      paidAt,
    });
  } catch (e) {
    console.error("[affiliates] invoice handler threw", e);
  }
}

type ChargeLike = {
  id: string;
  amount: number;
  amount_refunded: number;
  invoice?: string | { id: string } | null;
  payment_intent?: string | { id: string } | null;
};

/** The invoice a charge paid, across API versions. */
async function invoiceForCharge(charge: ChargeLike): Promise<string | null> {
  const direct = idOf(charge.invoice);
  if (direct || !stripe) return direct;
  const pi = idOf(charge.payment_intent);
  if (!pi) return null;
  try {
    const intent = (await stripe.paymentIntents.retrieve(pi)) as unknown as { invoice?: string | { id: string } | null };
    return idOf(intent.invoice);
  } catch {
    return null;
  }
}

/** charge.refunded: reverse the refunded share of the commission. */
export async function handleAffiliateChargeRefunded(raw: unknown): Promise<void> {
  try {
    const charge = raw as ChargeLike;
    if (!charge.amount) return;
    const invoiceId = await invoiceForCharge(charge);
    if (!invoiceId) return;
    await reverseSale("stripe", invoiceId, charge.amount_refunded / charge.amount);
  } catch (e) {
    console.error("[affiliates] refund handler threw", e);
  }
}

/** charge.dispute.created: a chargeback takes the whole payment back. */
export async function handleAffiliateDispute(raw: unknown): Promise<void> {
  try {
    const dispute = raw as { charge: string | { id: string } };
    const chargeId = idOf(dispute.charge);
    if (!chargeId || !stripe) return;
    const charge = (await stripe.charges.retrieve(chargeId)) as unknown as ChargeLike;
    const invoiceId = await invoiceForCharge(charge);
    if (!invoiceId) return;
    await reverseSale("stripe", invoiceId, 1);
  } catch (e) {
    console.error("[affiliates] dispute handler threw", e);
  }
}
