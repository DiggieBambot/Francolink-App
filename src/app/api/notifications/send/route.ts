// src/app/api/notifications/send/route.ts
//
// Sends a Web Push notification to one user.
//
// Body: { to_user_id?: string, title: string, body: string, url?: string, tag?: string }
//   - If to_user_id is omitted, the notification is sent to the caller (self-test).
//   - If to_user_id is set, the caller must be an admin.
//
// 200 → { ok: true, delivered: 1 }   notification dispatched
// 200 → { ok: false, reason: "no_subscription" }   user hasn't subscribed
// 401/403/4xx → auth error
// 500 → upstream push failure

import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_EMAIL || "mailto:admin@francolink.net";

let vapidConfigured = false;
function configureVapid() {
  if (vapidConfigured) return true;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  vapidConfigured = true;
  return true;
}

export async function POST(request: NextRequest) {
  if (!configureVapid()) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { to_user_id, title, body: text, url, tag } = body || {};
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  let targetUserId: string = user.id;
  if (to_user_id && to_user_id !== user.id) {
    // Sending to another user requires admin.
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    targetUserId = to_user_id;
  }

  const { data: sub, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("subscription, updated_at")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (subErr) {
    return NextResponse.json({ error: `Lookup failed: ${subErr.message}` }, { status: 500 });
  }
  if (!sub?.subscription) {
    return NextResponse.json({ ok: false, reason: "no_subscription" }, { status: 200 });
  }

  // Classify the gateway from the endpoint host so the client can show
  // "Sent to iOS" or "Sent to Chrome" etc.
  const endpoint: string = (sub.subscription as any)?.endpoint || "";
  const host = endpoint.replace(/^https?:\/\//, "").split("/")[0];
  let gateway: "ios" | "chrome_or_android" | "firefox" | "edge_windows" | "unknown" = "unknown";
  let gatewayLabel = "unknown gateway";
  if (host.includes("apple")) { gateway = "ios"; gatewayLabel = "iOS"; }
  else if (host.includes("fcm.googleapis")) { gateway = "chrome_or_android"; gatewayLabel = "Chrome / Android"; }
  else if (host.includes("mozilla") || host.includes("autopush")) { gateway = "firefox"; gatewayLabel = "Firefox"; }
  else if (host.includes("windows") || host.includes("notify.windows")) { gateway = "edge_windows"; gatewayLabel = "Edge / Windows"; }

  const payload = JSON.stringify({
    title,
    body: text,
    url: url || "/",
    tag,
  });

  try {
    await webpush.sendNotification(sub.subscription as any, payload, { TTL: 60 * 60 });
    return NextResponse.json({
      ok: true,
      delivered: 1,
      gateway,
      gateway_label: gatewayLabel,
      subscription_updated_at: sub.updated_at,
    });
  } catch (err: any) {
    // 410 Gone or 404 → subscription is dead. Clean up.
    const statusCode = err?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await supabase.from("push_subscriptions").delete().eq("user_id", targetUserId);
      return NextResponse.json({ ok: false, reason: "subscription_expired" }, { status: 200 });
    }
    console.error("Push send failed:", err);
    return NextResponse.json(
      { error: `Push send failed: ${err?.message ?? "unknown"}` },
      { status: 500 }
    );
  }
}
