// Server-only sender for the mobile app's notifications, through Expo's push
// service (which delivers via FCM on Android and APNs on iOS). Tokens come
// from device_push_tokens. Fire-and-forget: never throws. Tokens Expo reports
// as no longer registered (app uninstalled, notifications revoked) are
// deleted.
//
// EXPO_ACCESS_TOKEN is optional: set it only if "enhanced push security" is
// turned on for the project at expo.dev.

import { createClient } from "@supabase/supabase-js";

const SEND_URL = "https://exp.host/--/api/v2/push/send";
const BATCH = 100; // Expo's limit per request

export interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  /** Delivered to the app with the tap; the app opens Home either way. */
  data?: Record<string, unknown>;
}

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

/** Send messages; returns how many Expo accepted. */
export async function sendExpoPush(messages: ExpoMessage[]): Promise<number> {
  let accepted = 0;
  const dead: string[] = [];

  for (let i = 0; i < messages.length; i += BATCH) {
    const batch = messages.slice(i, i + BATCH).map((m) => ({
      ...m,
      sound: "default",
      // Matches the Android channel the app creates (lib/notifications.ts).
      channelId: "reminders",
    }));
    try {
      const res = await fetch(SEND_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
        },
        body: JSON.stringify(batch),
      });
      const json = (await res.json().catch(() => null)) as {
        data?: { status: string; details?: { error?: string } }[];
      } | null;
      (json?.data ?? []).forEach((ticket, j) => {
        if (ticket.status === "ok") accepted++;
        else if (ticket.details?.error === "DeviceNotRegistered") dead.push(batch[j].to);
      });
    } catch (e) {
      console.error("[expo-push] send failed:", (e as Error).message);
    }
  }

  if (dead.length) await svc().from("device_push_tokens").delete().in("token", dead);
  return accepted;
}
