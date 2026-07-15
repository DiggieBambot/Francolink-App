// Server-only helper to create in-app notifications (reliable inbox) and, when
// the user has a push subscription, also fire a best-effort Web Push.
// Uses the service role so it works from any authenticated API route.

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

let vapidReady = false;
function configureVapid(): boolean {
  if (vapidReady) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_EMAIL || "mailto:admin@francolink.net", pub, priv);
  vapidReady = true;
  return true;
}

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  url?: string;
}

/** Insert one in-app notification and try a web push. Never throws. */
export async function notifyUser(input: NotifyInput): Promise<void> {
  const supabase = svc();
  try {
    await supabase.from("notifications").insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body || null,
      url: input.url || null,
    });
  } catch (e) {
    console.error("[notify] insert failed:", (e as Error).message);
  }

  // Best-effort push — skip silently if unconfigured or no subscription.
  try {
    if (!configureVapid()) return;
    const { data: sub } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", input.userId)
      .maybeSingle();
    if (!sub?.subscription) return;
    await webpush.sendNotification(
      sub.subscription as webpush.PushSubscription,
      JSON.stringify({ title: input.title, body: input.body || "", url: input.url || "/", tag: input.type }),
      { TTL: 60 * 60 }
    );
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) {
      await supabase.from("push_subscriptions").delete().eq("user_id", input.userId);
    }
  }
}

/** Fan out the same notification to many users. */
export async function notifyMany(userIds: string[], base: Omit<NotifyInput, "userId">): Promise<void> {
  await Promise.all(userIds.map((userId) => notifyUser({ ...base, userId })));
}
