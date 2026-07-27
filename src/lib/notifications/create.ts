// Server-only helper to create in-app notifications (reliable inbox) and, when
// the user has a push subscription, also fire a best-effort Web Push.
// Uses the service role so it works from any authenticated API route.

import { createClient } from "@supabase/supabase-js";
import { sendPush } from "./push";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
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

  // Best-effort push through the shared sender (handles config + dead-sub cleanup).
  await sendPush(input.userId, {
    title: input.title,
    body: input.body || "",
    deeplink: input.url || "/",
    tag: input.type,
  });
}

/** Fan out the same notification to many users. */
export async function notifyMany(userIds: string[], base: Omit<NotifyInput, "userId">): Promise<void> {
  await Promise.all(userIds.map((userId) => notifyUser({ ...base, userId })));
}
