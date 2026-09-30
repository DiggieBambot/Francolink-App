// src/lib/billing/revenuecat.ts
//
// Google Play subscriptions, bought in the Android app through RevenueCat.
// Server-only.
//
// The app identifies each customer to RevenueCat with our users.id, so a
// RevenueCat app_user_id is a FrancoLink user id. Purchases are verified by
// RevenueCat against Google; we never see payment details.
//
// syncPlaySubscription() is the single writer for Play subscriptions. It does
// not trust any one webhook event — events can arrive late, twice or out of
// order — but asks RevenueCat for the customer's current state and writes
// that. Webhooks, the app's "I just bought" call and app launch all call it.
//
// It only ever touches subscriptions it owns (subscription_source =
// 'google_play'). Someone subscribed on the website keeps their Stripe
// subscription as the source of truth; see
// supabase/migrations/20260930_subscription_source.sql.

import { createServiceClient } from "@/lib/supabase/service";

/** The entitlement configured in RevenueCat that Premium products unlock. */
export const PREMIUM_ENTITLEMENT = "premium";

const API = "https://api.revenuecat.com/v1";

interface RcEntitlement {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
  product_identifier: string;
  purchase_date: string;
}

interface RcSubscription {
  expires_date: string | null;
  unsubscribe_detected_at: string | null;
  billing_issues_detected_at: string | null;
  refunded_at?: string | null;
  store: string;
}

interface RcSubscriber {
  entitlements: Record<string, RcEntitlement>;
  subscriptions: Record<string, RcSubscription>;
}

export interface PlayState {
  active: boolean;
  /** False once the customer has turned off auto-renew in Google Play. */
  willRenew: boolean;
  expiresAt: string | null;
  productId: string | null;
}

export type SyncResult =
  | { ok: true; state: PlayState; changed: boolean }
  | { ok: false; error: string };

export async function fetchPlayState(userId: string): Promise<PlayState | { error: string }> {
  const key = process.env.REVENUECAT_SECRET_API_KEY;
  if (!key) return { error: "REVENUECAT_SECRET_API_KEY is not set" };

  const res = await fetch(`${API}/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  // RevenueCat creates unknown subscribers on GET, but treat 404 as "never bought".
  if (res.status === 404) return { active: false, willRenew: false, expiresAt: null, productId: null };
  if (!res.ok) return { error: `RevenueCat ${res.status}` };

  const { subscriber } = (await res.json()) as { subscriber: RcSubscriber };
  const ent = subscriber.entitlements?.[PREMIUM_ENTITLEMENT];
  if (!ent) return { active: false, willRenew: false, expiresAt: null, productId: null };

  // Access runs to the later of expiry and any billing grace period.
  const until = [ent.expires_date, ent.grace_period_expires_date].filter(Boolean).map((d) => Date.parse(d!));
  const expiresMs = until.length ? Math.max(...until) : null;
  const active = expiresMs === null || expiresMs > Date.now();
  const sub = subscriber.subscriptions?.[ent.product_identifier];

  return {
    active,
    willRenew: active && !!sub && !sub.unsubscribe_detected_at && !sub.refunded_at,
    expiresAt: expiresMs === null ? null : new Date(expiresMs).toISOString(),
    productId: ent.product_identifier,
  };
}

export async function syncPlaySubscription(userId: string): Promise<SyncResult> {
  const state = await fetchPlayState(userId);
  if ("error" in state) return { ok: false, error: state.error };

  const db = createServiceClient();
  const { data: user, error } = await db
    .from("users")
    .select("id, subscription_source, subscription_plan, stripe_subscription_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!user) return { ok: false, error: "no such user" };

  const ownsIt = user.subscription_source === "google_play";
  const webSubscriber = user.subscription_source === "stripe" && !!user.stripe_subscription_id;

  if (state.active) {
    // Already paying on the website: Stripe stays the source of truth, and the
    // plan is already at least Premium. The app should never have offered
    // this purchase; log it so a double payment can be refunded by hand.
    if (webSubscriber) {
      console.warn(`[billing] ${userId} has both a Stripe and a Google Play subscription`);
      return { ok: true, state, changed: false };
    }
    const { error: upErr } = await db
      .from("users")
      .update({
        subscription_plan: "PREMIUM",
        subscription_period: /year|annual/i.test(state.productId ?? "") ? "yearly" : "monthly",
        subscription_ends_at: state.expiresAt,
        subscription_source: "google_play",
        ...(ownsIt ? {} : { subscription_started_at: new Date().toISOString() }),
      })
      .eq("id", userId);
    if (upErr) return { ok: false, error: upErr.message };
    return { ok: true, state, changed: true };
  }

  // Lapsed, cancelled-and-expired or refunded: downgrade only what we own.
  if (ownsIt) {
    const { error: upErr } = await db
      .from("users")
      .update({
        subscription_plan: "FREE",
        subscription_period: null,
        subscription_ends_at: state.expiresAt ?? new Date().toISOString(),
        subscription_source: null,
      })
      .eq("id", userId);
    if (upErr) return { ok: false, error: upErr.message };
    return { ok: true, state, changed: true };
  }

  return { ok: true, state, changed: false };
}
