// src/app/api/billing/sync/route.ts
//
// POST → re-read the caller's Google Play subscription from RevenueCat and
// update their plan now. The Android app calls it right after a purchase
// (so lessons unlock without waiting for the webhook) and on launch (to catch
// a missed webhook). Signed-in callers only, and only for themselves.

import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { syncPlaySubscription } from "@/lib/billing/revenuecat";

export async function POST(request: NextRequest) {
  const { user, supabase } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await syncPlaySubscription(user.id);
  if (!result.ok) {
    console.error("[billing/sync]", user.id, result.error);
    return NextResponse.json({ error: "Couldn't check your subscription. Please try again." }, { status: 502 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("subscription_plan, subscription_ends_at, subscription_source")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    plan: profile?.subscription_plan ?? "FREE",
    endsAt: profile?.subscription_ends_at ?? null,
    source: profile?.subscription_source ?? null,
    willRenew: result.state.willRenew,
  });
}
