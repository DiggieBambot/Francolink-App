// Creator affiliate program: who a customer belongs to.
//
// Schema and the business rules live in supabase/migrations/20261014_affiliates.sql.
// This module answers one question -- "which creator, if any, gets credit for
// this customer?" -- and records the answer once. Money is in ./commissions.
//
// A customer reaches a creator three ways:
//
//   link   ?ref=marie on any page sets the fl_ref cookie (middleware); it is
//          read at signup and again at checkout.
//   code   they type MARIE at Stripe checkout (or it is applied for them);
//          the webhook sees the promotion code on the invoice.
//   claim  they enter the code in the app or on the site after signing up.
//
// First creator wins, and only for someone who has never paid us: a creator
// is paid for bringing a NEW customer, not for being the last link an
// existing subscriber clicked.

import { createServiceClient } from "@/lib/supabase/service";
import { SITE_URL, sharedCookieDomain } from "@/lib/site/hosts";

export const REF_COOKIE = "fl_ref";
export const REF_COOKIE_DAYS = 60;

/** Commission is payable this long after the payment, so refunds can land first. */
export const HOLD_DAYS = 30;

/** A customer earns their creator commission for this long after their first payment. */
export const WINDOW_MONTHS = 12;

export type AttributionVia = "link" | "code" | "claim" | "admin";

export interface Affiliate {
  id: string;
  code: string;
  name: string;
  email: string;
  user_id: string | null;
  commission_rate: number;
  discount_percent: number;
  stripe_coupon_id: string | null;
  stripe_promotion_code_id: string | null;
  payout_method: string | null;
  payout_details: string | null;
  status: "active" | "paused";
  notes: string | null;
  created_at: string;
}

/**
 * Canonical form of a creator code: lowercase letters and digits, 3-24 long.
 * The same rule as the database check and as Stripe's promotion codes, so a
 * code that passes here is valid everywhere. Anything else is null.
 */
export function normalizeCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return /^[a-z0-9]{3,24}$/.test(code) ? code : null;
}

/** See sharedCookieDomain: creators link to the website, checkout is on the app. */
export const refCookieDomain = sharedCookieDomain;

/** The customer-facing link for a creator. */
export function affiliateLink(code: string): string {
  return `${SITE_URL}/?ref=${code}`;
}

export async function findAffiliateByCode(raw: string | null | undefined): Promise<Affiliate | null> {
  const code = normalizeCode(raw);
  if (!code) return null;
  const { data } = await createServiceClient()
    .from("affiliates")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  return (data as Affiliate | null) ?? null;
}

export async function findAffiliateByPromotionCode(promotionCodeId: string): Promise<Affiliate | null> {
  const { data } = await createServiceClient()
    .from("affiliates")
    .select("*")
    .eq("stripe_promotion_code_id", promotionCodeId)
    .maybeSingle();
  return (data as Affiliate | null) ?? null;
}

/** The creator a customer belongs to, if any. */
export async function affiliateForUser(userId: string): Promise<Affiliate | null> {
  const db = createServiceClient();
  const { data: user } = await db
    .from("users")
    .select("referred_by_affiliate_id")
    .eq("id", userId)
    .maybeSingle();
  if (!user?.referred_by_affiliate_id) return null;
  const { data } = await db
    .from("affiliates")
    .select("*")
    .eq("id", user.referred_by_affiliate_id)
    .maybeSingle();
  return (data as Affiliate | null) ?? null;
}

export type AttributeResult =
  | { ok: true; affiliate: Affiliate }
  | {
      ok: false;
      reason: "unknown_code" | "paused" | "already_attributed" | "self_referral" | "existing_customer" | "tutor_student" | "no_user";
    };

/**
 * Credit a customer to a creator, if they are eligible and not credited yet.
 *
 * `code` attribution comes from Stripe after a first-time-customer promotion
 * code was accepted, so Stripe has already established they are new and the
 * "never paid" check is skipped -- by the time the invoice webhook runs, the
 * checkout webhook may already have marked them subscribed.
 */
export async function attributeUser(
  userId: string,
  affiliateOrCode: Affiliate | string,
  via: AttributionVia,
): Promise<AttributeResult> {
  const affiliate =
    typeof affiliateOrCode === "string" ? await findAffiliateByCode(affiliateOrCode) : affiliateOrCode;
  if (!affiliate) return { ok: false, reason: "unknown_code" };
  if (affiliate.status !== "active") return { ok: false, reason: "paused" };
  if (affiliate.user_id === userId) return { ok: false, reason: "self_referral" };

  const db = createServiceClient();
  const { data: user } = await db
    .from("users")
    .select("id, referred_by_affiliate_id, referred_by_tutor_id, subscription_plan, subscription_ends_at")
    .eq("id", userId)
    .maybeSingle();
  if (!user) return { ok: false, reason: "no_user" };
  if (user.referred_by_affiliate_id) {
    return user.referred_by_affiliate_id === affiliate.id
      ? { ok: true, affiliate }
      : { ok: false, reason: "already_attributed" };
  }

  // A tutor's invited student already has a referrer who is paid on their
  // subscription. Crediting a creator too would pay twice for one customer.
  if (user.referred_by_tutor_id) return { ok: false, reason: "tutor_student" };

  if (via !== "code" && via !== "admin") {
    const plan = String(user.subscription_plan ?? "").toLowerCase();
    const hasEverSubscribed = (plan && plan !== "free" && plan !== "none") || !!user.subscription_ends_at;
    if (hasEverSubscribed) return { ok: false, reason: "existing_customer" };
  }

  // The `is null` guard makes two racing attributions settle on the first.
  const { data: updated } = await db
    .from("users")
    .update({
      referred_by_affiliate_id: affiliate.id,
      affiliate_attributed_at: new Date().toISOString(),
      affiliate_attributed_via: via,
    })
    .eq("id", userId)
    .is("referred_by_affiliate_id", null)
    .select("id");

  if (!updated?.length) return { ok: false, reason: "already_attributed" };
  return { ok: true, affiliate };
}
