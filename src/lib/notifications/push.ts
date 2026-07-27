// Server-only Web Push sender. The single reusable "push a message to a user"
// interface any feature can call — homework, streaks, engagement, etc.
//
//   await sendPush(userId, { title, body, deeplink: "/dashboard" });
//
// Push-only (no in-app inbox row — use notifyUser for that). Fire-and-forget:
// never throws. Dead subscriptions (404/410) are cleaned up automatically.

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

let vapidReady = false;
export function vapidConfigured(): boolean {
  if (vapidReady) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_EMAIL || "mailto:admin@francolink.net", pub, priv);
  vapidReady = true;
  return true;
}

export interface PushMessage {
  title: string;
  body: string;
  /** Path (or URL) to open when the notification is tapped. Defaults to "/". */
  deeplink?: string;
  /** Collapse key — a later push with the same tag replaces the earlier one. */
  tag?: string;
}

/**
 * Send a push to one user. Returns true if a notification was dispatched, false
 * if the user has no subscription / push isn't configured / the sub was dead.
 */
export async function sendPush(userId: string, msg: PushMessage): Promise<boolean> {
  if (!userId || !msg?.title) return false;
  if (!vapidConfigured()) return false;

  const supabase = svc();
  try {
    const { data: sub } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId)
      .maybeSingle();
    if (!sub?.subscription) return false;

    await webpush.sendNotification(
      sub.subscription as webpush.PushSubscription,
      JSON.stringify({
        title: msg.title,
        body: msg.body || "",
        url: msg.deeplink || "/",
        tag: msg.tag,
      }),
      { TTL: 60 * 60 }
    );
    return true;
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) {
      await supabase.from("push_subscriptions").delete().eq("user_id", userId);
    } else {
      console.error("[push] send failed:", (e as Error).message);
    }
    return false;
  }
}
