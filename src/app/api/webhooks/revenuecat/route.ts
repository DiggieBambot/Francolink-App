// src/app/api/webhooks/revenuecat/route.ts
//
// RevenueCat → us, on every Google Play subscription change (purchase,
// renewal, cancellation, billing issue, expiry, refund, transfer).
//
// Authenticated by the Authorization header value set in the RevenueCat
// dashboard (Integrations → Webhooks), which must equal REVENUECAT_WEBHOOK_AUTH.
//
// The event only says *who* changed; syncPlaySubscription() then reads their
// current state from RevenueCat, so duplicate or out-of-order deliveries are
// harmless. A 5xx makes RevenueCat retry.

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { syncPlaySubscription } from "@/lib/billing/revenuecat";

// App user ids are our users.id. RevenueCat's own anonymous ids
// ("$RCAnonymousID:…") belong to nobody we know and are skipped.
const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function authorised(request: NextRequest): boolean {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  const got = request.headers.get("authorization") ?? "";
  if (!expected) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!process.env.REVENUECAT_WEBHOOK_AUTH) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const event = body?.event;
  if (!event?.type) return NextResponse.json({ error: "Bad payload" }, { status: 400 });

  // The dashboard's "Send test event" button.
  if (event.type === "TEST") return NextResponse.json({ ok: true });

  const ids = new Set<string>(
    [
      event.app_user_id,
      event.original_app_user_id,
      ...(event.aliases ?? []),
      // A purchase moved between accounts: both sides change.
      ...(event.transferred_from ?? []),
      ...(event.transferred_to ?? []),
    ].filter((id): id is string => typeof id === "string" && USER_ID.test(id)),
  );

  const failures: string[] = [];
  for (const id of ids) {
    const result = await syncPlaySubscription(id);
    // An id RevenueCat knows but we don't (e.g. an account deleted since) is
    // not worth a retry; anything else is.
    if (!result.ok && result.error !== "no such user") failures.push(`${id}: ${result.error}`);
  }

  if (failures.length) {
    console.error(`[revenuecat] ${event.type} sync failed`, failures);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, synced: ids.size });
}
