// Daily push reminder cron. Triggered HOURLY by an external scheduler
// (.github/workflows/push-reminders-cron.yml — Vercel Hobby can't do sub-daily
// crons). Each run sends only to subscribers for whom the current local hour
// matches their chosen notification_time hour, so everyone gets one reminder a
// day at roughly the time they picked, in their own timezone.
//
// Message priority: an active streak → "keep your streak alive"; otherwise a
// generic practice nudge. Respects per-user notify_streak / notify_reminders.
//
// Query params:
//   ?dry=1   — compute who is due and what they'd get; send nothing.

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
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

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!vapidConfigured()) return NextResponse.json({ error: "VAPID not configured" }, { status: 503 });

  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const supabase = svc();

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("user_id, notification_time, notify_reminders, notify_streak");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs || subs.length === 0) return NextResponse.json({ ok: true, due: 0, sent: 0 });

  // Pull the timezone + streak for everyone who has a subscription.
  const ids = subs.map((s) => s.user_id);
  const { data: users } = await supabase
    .from("users")
    .select("id, timezone, current_streak")
    .in("id", ids);
  const byId = new Map((users || []).map((u) => [u.id, u]));

  const due: { userId: string; title: string; body: string }[] = [];
  for (const sub of subs) {
    if (!sub.notify_reminders && !sub.notify_streak) continue;
    const u = byId.get(sub.user_id);
    const targetHour = parseInt(String(sub.notification_time || "09:00").slice(0, 2), 10);
    if (localHour(u?.timezone) !== targetHour) continue;

    const streak = u?.current_streak || 0;
    let title: string;
    let body: string;
    if (sub.notify_streak && streak > 0) {
      title = `🔥 ${streak}-day streak`;
      body = `Keep your ${streak}-day streak alive — do a quick lesson today!`;
    } else if (sub.notify_reminders) {
      title = "Time for French 🇫🇷";
      body = "A few minutes today keeps you moving. Tap to practice.";
    } else {
      continue; // streak pref on but no streak, and reminders off
    }
    due.push({ userId: sub.user_id, title, body });
  }

  if (dry) {
    return NextResponse.json({ ok: true, dry: true, due: due.length, sample: due.slice(0, 10) });
  }

  let sent = 0;
  await Promise.all(
    due.map(async (d) => {
      const ok = await sendPush(d.userId, { title: d.title, body: d.body, deeplink: "/dashboard", tag: "daily-reminder" });
      if (ok) sent++;
    })
  );

  return NextResponse.json({ ok: true, due: due.length, sent });
}
