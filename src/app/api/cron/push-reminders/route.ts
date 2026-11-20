// Daily push reminder cron. Triggered HOURLY by an external scheduler
// (.github/workflows/push-reminders-cron.yml — Vercel Hobby can't do sub-daily
// crons). Each run sends only to subscribers for whom the current local hour
// matches their chosen notification_time hour, so everyone gets one reminder a
// day at roughly the time they picked, in their own timezone.
//
// Two audiences, same rules:
//   - web subscribers (push_subscriptions, Web Push) — one per user;
//   - mobile app installs (device_push_tokens, Expo push) — one per phone,
//     each with its own reminder time.
// Nobody is reminded on a day they've already studied (users.last_activity_date
// is today in their timezone) — at most one nudge a day, and only when useful.
//
// Message priority: an active streak → "keep your streak alive"; otherwise a
// generic practice nudge in the language they're learning. Respects
// notify_streak / notify_reminders.
//
// Query params:
//   ?dry=1   — compute who is due and what they'd get; send nothing.

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendExpoPush, type ExpoMessage } from "@/lib/notifications/expo-push";
import { sendPush, vapidConfigured } from "@/lib/notifications/push";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function svc() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

function authorized(req: Request): boolean {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  return (
    (!!process.env.CRON_SECRET && token === process.env.CRON_SECRET) ||
    (!!process.env.SUPABASE_SERVICE_ROLE_KEY && token === process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

/** Current hour (0–23) in the given IANA timezone. Returns -1 on a bad zone. */
function localHour(tz: string | null | undefined): number {
  try {
    const h = new Intl.DateTimeFormat("en-US", {
      timeZone: tz || "UTC",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date()).find((p) => p.type === "hour")?.value;
    return h != null ? parseInt(h, 10) : -1;
  } catch {
    return -1;
  }
}

/** Today's date (YYYY-MM-DD) in the given IANA timezone. */
function localDate(tz: string | null | undefined): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: tz || "UTC" });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const LANGUAGE: Record<string, { name: string; flag: string }> = {
  fr: { name: "French", flag: "🇫🇷" },
  es: { name: "Spanish", flag: "🇪🇸" },
  en: { name: "English", flag: "🇬🇧" },
  de: { name: "German", flag: "🇩🇪" },
};

interface Learner {
  id: string;
  timezone: string | null;
  current_streak: number | null;
  last_activity_date: string | null;
  learning_language: string | null;
}

/** The reminder for this learner, or null if they shouldn't get one now. */
function reminderFor(
  u: Learner | undefined,
  pref: { notification_time: string | null; notify_reminders: boolean; notify_streak: boolean }
): { title: string; body: string } | null {
  if (!pref.notify_reminders && !pref.notify_streak) return null;
  const targetHour = parseInt(String(pref.notification_time || "09:00").slice(0, 2), 10);
  if (localHour(u?.timezone) !== targetHour) return null;
  // Already studied today: nothing to remind.
  if (u?.last_activity_date && String(u.last_activity_date).slice(0, 10) === localDate(u.timezone)) return null;

  const streak = u?.current_streak || 0;
  const lang = LANGUAGE[u?.learning_language || "fr"] ?? LANGUAGE.fr;
  if (pref.notify_streak && streak > 0) {
    return { title: `🔥 ${streak}-day streak`, body: `Keep your ${streak}-day streak alive — do a quick lesson today!` };
  }
  if (pref.notify_reminders) {
    return { title: `Time for ${lang.name} ${lang.flag}`, body: "A few minutes today keeps you moving. Tap to practice." };
  }
  return null; // streak pref on but no streak, and reminders off
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const supabase = svc();
  const webReady = vapidConfigured();

  // Web subscribers (only when Web Push is configured) and app installs.
  const { data: subs, error } = webReady
    ? await supabase.from("push_subscriptions").select("user_id, notification_time, notify_reminders, notify_streak")
    : { data: [], error: null };
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // A missing table (migration not run yet) just means no app installs.
  const { data: devices } = await supabase
    .from("device_push_tokens")
    .select("user_id, token, notification_time, notify_reminders");

  const ids = [...new Set([...(subs ?? []).map((s) => s.user_id), ...(devices ?? []).map((d) => d.user_id)])];
  if (!ids.length) return NextResponse.json({ ok: true, due: 0, sent: 0 });

  const { data: users } = await supabase
    .from("users")
    .select("id, timezone, current_streak, last_activity_date, learning_language")
    .in("id", ids);
  const byId = new Map((users || []).map((u) => [u.id, u as Learner]));

  const webDue: { userId: string; title: string; body: string }[] = [];
  for (const sub of subs ?? []) {
    const msg = reminderFor(byId.get(sub.user_id), sub);
    if (msg) webDue.push({ userId: sub.user_id, ...msg });
  }

  const appDue: ExpoMessage[] = [];
  for (const d of devices ?? []) {
    // The app's one switch covers both the streak and the practice reminder.
    const msg = reminderFor(byId.get(d.user_id), { ...d, notify_streak: d.notify_reminders });
    if (msg) appDue.push({ to: d.token, ...msg, data: { url: "/" } });
  }

  if (dry) {
    return NextResponse.json({
      ok: true,
      dry: true,
      web: { configured: webReady, due: webDue.length, sample: webDue.slice(0, 10) },
      app: { due: appDue.length, sample: appDue.slice(0, 10).map((m) => ({ title: m.title, body: m.body })) },
    });
  }

  let webSent = 0;
  await Promise.all(
    webDue.map(async (d) => {
      const ok = await sendPush(d.userId, { title: d.title, body: d.body, deeplink: "/dashboard", tag: "daily-reminder" });
      if (ok) webSent++;
    })
  );
  const appSent = appDue.length ? await sendExpoPush(appDue) : 0;

  return NextResponse.json({
    ok: true,
    due: webDue.length + appDue.length,
    sent: webSent + appSent,
    web: { due: webDue.length, sent: webSent },
    app: { due: appDue.length, sent: appSent },
  });
}
