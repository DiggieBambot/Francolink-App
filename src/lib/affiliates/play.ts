// Google Play side of the creator program, fed by RevenueCat webhook events.
//
// A Play purchase can only be credited to a creator the customer is already
// attributed to -- through the website link before installing the app, or by
// entering the creator's code (POST /api/affiliates/claim). Play has no
// equivalent of a Stripe promotion code we could read here.
//
// Amounts are RevenueCat's USD `price`, so Play commission is always in USD.

import { createServiceClient } from "@/lib/supabase/service";
import { recordSale, reverseSale } from "./commissions";

const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Google's cut when RevenueCat doesn't say: 15% on subscriptions.
const DEFAULT_STORE_COMMISSION = 0.15;

export interface RevenueCatEvent {
  type: string;
  environment?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  transaction_id?: string;
  price?: number | null;
  tax_percentage?: number | null;
  commission_percentage?: number | null;
  period_type?: string;
  purchased_at_ms?: number;
}

async function ourUserId(event: RevenueCatEvent): Promise<string | null> {
  const candidates = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])].filter(
    (id): id is string => typeof id === "string" && USER_ID.test(id),
  );
  if (!candidates.length) return null;
  const { data } = await createServiceClient().from("users").select("id").in("id", candidates).limit(1);
  return data?.[0]?.id ?? null;
}

export async function handleAffiliatePlayEvent(event: RevenueCatEvent): Promise<void> {
  try {
    // Sandbox purchases are test money.
    if (event.environment && event.environment !== "PRODUCTION") return;
    if (!event.transaction_id) return;

    if (event.type === "REFUND") {
      await reverseSale("play", event.transaction_id, 1);
      return;
    }

    if (event.type !== "INITIAL_PURCHASE" && event.type !== "RENEWAL") return;
    // A free trial "purchase" is $0 and earns nothing; its conversion arrives
    // later as a RENEWAL.
    if (event.period_type === "TRIAL" || !event.price || event.price <= 0) return;

    const userId = await ourUserId(event);
    if (!userId) return;

    // Commission is on what reaches us: after tax and Google's cut.
    const tax = event.tax_percentage ?? 0;
    const storeCut = event.commission_percentage ?? DEFAULT_STORE_COMMISSION;
    const baseCents = Math.round(event.price * (1 - tax - storeCut) * 100);

    await recordSale({
      userId,
      source: "play",
      sourceId: event.transaction_id,
      baseCents,
      currency: "usd",
      paidAt: event.purchased_at_ms ? new Date(event.purchased_at_ms) : new Date(),
    });
  } catch (e) {
    console.error("[affiliates] play event handler threw", e);
  }
}
