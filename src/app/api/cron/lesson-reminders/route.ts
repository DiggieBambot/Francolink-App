// Lesson reminders: "tomorrow" and "starting soon".
//
// Triggered every 15 minutes by an external scheduler
// (.github/workflows/lesson-reminders-cron.yml — Vercel Hobby can't do
// sub-daily crons), the same arrangement as push-reminders.
//
// Two windows, both anchored to the lesson rather than to the clock:
//
//   24h   lessons starting in 23h45m–25h — email + push, still time to cancel
//         free, and the day-before nudge is the one that actually prevents
//         no-shows.
//   15m   lessons starting in 0–20 minutes — push only, straight into the room.
//
// The windows are wider than the 15-minute cadence on purpose: a run that
// fails or a scheduler that drifts must not drop a reminder into a gap. The
// overlap is safe because booking_reminders makes each (booking, kind) a
// single-use event, claimed BEFORE the send.
//
// Unlike the daily practice nudge this ignores notify_reminders. That
// preference is about habit-forming prompts; this is about a specific
// commitment the person made to another human, and is transactional.
//
// Query params:
//   ?dry=1   — list who is due and send nothing.

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { loadBookingContext, notifyLessonReminder } from "@/lib/booking/notify";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MINUTE = 60_000;

/** Each kind's window, as minutes-from-now the lesson start must fall inside. */
const WINDOWS = {
  "24h": { from: 23 * 60 + 45, to: 25 * 60 },
  "15m": { from: 0, to: 20 },
} as const;

type Kind = keyof typeof WINDOWS;

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function authorized(req: Request): boolean {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  return (
    (!!process.env.CRON_SECRET && token === process.env.CRON_SECRET) ||
    (!!process.env.SUPABASE_SERVICE_ROLE_KEY && token === process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const db = svc();
  const now = Date.now();

  const result: Record<Kind, { due: number; sent: number }> = {
    "24h": { due: 0, sent: 0 },
    "15m": { due: 0, sent: 0 },
  };
  const sample: { booking: string; kind: Kind; starts_at: string }[] = [];

  for (const kind of Object.keys(WINDOWS) as Kind[]) {
    const { from, to } = WINDOWS[kind];

    const { data: bookings, error } = await db
      .from("bookings")
      .select("id, starts_at")
      .eq("status", "confirmed")
      .gte("starts_at", new Date(now + from * MINUTE).toISOString())
      .lte("starts_at", new Date(now + to * MINUTE).toISOString())
      .order("starts_at");

    if (error) {
      console.error("[cron/lesson-reminders] query failed", kind, error);
      continue;
    }
    if (!bookings?.length) continue;

    // Which of these have already had this reminder? One query, not one per
    // booking — a busy Saturday evening is a lot of round trips otherwise.
    const { data: already } = await db
      .from("booking_reminders")
      .select("booking_id")
      .eq("kind", kind)
      .in("booking_id", bookings.map((b) => b.id));

    const done = new Set((already ?? []).map((r) => r.booking_id));
    const pending = bookings.filter((b) => !done.has(b.id));
    result[kind].due = pending.length;

    if (dry) {
      sample.push(
        ...pending.slice(0, 10).map((b) => ({ booking: b.id, kind, starts_at: b.starts_at }))
      );
      continue;
    }

    for (const b of pending) {
      // Claim first. If a second run inserted this row in the meantime the
      // primary key rejects us and we skip — nobody gets it twice.
      const { error: claimError } = await db
        .from("booking_reminders")
        .insert({ booking_id: b.id, kind });
      if (claimError) continue;

      const ctx = await loadBookingContext(b.id);
      if (!ctx) continue;

      await notifyLessonReminder(ctx, "student", kind);
      await notifyLessonReminder(ctx, "tutor", kind);
      result[kind].sent++;
    }
  }

  return NextResponse.json({ ok: true, ...(dry ? { dry: true, sample } : {}), ...result });
}
