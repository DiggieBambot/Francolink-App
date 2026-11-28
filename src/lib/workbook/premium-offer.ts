// The workbook → Premium step: buyers of Le Français Pas à Pas get their first
// month of Premium for $4.99 (decided 2026-11-28).
//
// The book teaches the grammar; Premium is where they say it out loud. The
// offer is a discount, never a free month: our claim rules say no free AI.
//
// Decided only here, on the server, from our own tables and Stripe. The client
// can ask for the offer but cannot grant it.

import { createClient as createServiceClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

/** What the first month costs a workbook buyer, in cents. */
export const WORKBOOK_FIRST_MONTH_CENTS = 499;
export const WORKBOOK_FIRST_MONTH_LABEL = "$4.99";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Owns a paid copy of the workbook, bound to the account or bought with its email. */
export async function ownsWorkbook(userId: string, email?: string | null): Promise<boolean> {
  const db = service();
  const select = "id, digital_order_items(product_key)";
  const queries = [
    db.from("digital_orders").select(select).eq("status", "paid").eq("user_id", userId),
  ];
  // Bought before the account existed and not yet claimed. Stripe keeps the
  // address as typed, so match without case.
  if (email) {
    queries.push(
      db.from("digital_orders").select(select).eq("status", "paid").is("user_id", null)
        .ilike("email", email.replace(/[%_\\]/g, "\\$&"))
    );
  }
  const results = await Promise.all(queries);
  return results.some(({ data }) =>
    (data ?? []).some((o) =>
      ((o.digital_order_items ?? []) as { product_key: string }[]).some(
        (i) => i.product_key === "workbook_fpp"
      )
    )
  );
}

/**
 * Free plan, never paid for a self-study plan on the web or in Google Play,
 * and owns the workbook. A first-month price is for a first month only.
 */
export async function workbookPremiumOfferEligible(
  userId: string,
  email: string | null | undefined,
  stripe: Stripe | null
): Promise<boolean> {
  const db = service();
  const { data: profile } = await db
    .from("users")
    .select("subscription_plan, subscription_source, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  const plan = (profile?.subscription_plan as string | null) || "FREE";
  if (plan !== "FREE") return false;
  if (profile?.subscription_source === "google_play") return false;

  if (!(await ownsWorkbook(userId, email))) return false;

  // Any earlier Stripe subscription, cancelled ones included, means this
  // would not be their first month.
  if (stripe && profile?.stripe_customer_id) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id as string,
        status: "all",
        limit: 1,
      });
      if (subs.data.length > 0) return false;
    } catch (e) {
      console.error("[premium-offer] subscription lookup failed", e);
      return false;
    }
  }
  return true;
}

/**
 * The coupon that takes the monthly Premium price down to $4.99 for one
 * invoice. Its id carries the amount, so a price change makes a new coupon
 * rather than silently giving the wrong discount. Null when it can't be made.
 */
export async function workbookFirstMonthCoupon(
  stripe: Stripe,
  monthlyPriceId: string
): Promise<string | null> {
  try {
    const price = await stripe.prices.retrieve(monthlyPriceId);
    const unit = price.unit_amount ?? 0;
    const off = unit - WORKBOOK_FIRST_MONTH_CENTS;
    if (off <= 0) return null;
    const id = `fl-workbook-first-month-${off}`;
    try {
      await stripe.coupons.retrieve(id);
    } catch {
      try {
        await stripe.coupons.create({
          id,
          amount_off: off,
          currency: price.currency,
          duration: "once",
          name: `Workbook buyers: first month ${WORKBOOK_FIRST_MONTH_LABEL}`,
        });
      } catch (e) {
        // Another checkout may have created it a moment ago; check once more.
        try {
          await stripe.coupons.retrieve(id);
        } catch {
          console.error("[premium-offer] coupon create failed", e);
          return null;
        }
      }
    }
    return id;
  } catch (e) {
    console.error("[premium-offer] price lookup failed", e);
    return null;
  }
}
