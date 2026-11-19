// Reconcile: make every connected tutor's Google Calendar match their lessons.
//
// The confirm and cancel paths push straight away, but those pushes are
// best-effort — Google can be down, a token can be mid-refresh, a webhook can
// confirm a lesson on a path we didn't anticipate. This sweep catches the
// rest. pushBooking compares against what it last wrote, so lessons that are
// already right cost one DB read and no Google call.
//
// Query params: ?dry=1 — list what would be checked, change nothing.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { pushBooking } from "@/lib/google-calendar/sync";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_PER_RUN = 500;

function authorized(req: Request): boolean {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return (
    (!!process.env.CRON_SECRET && token === process.env.CRON_SECRET) ||
    (!!process.env.SUPABASE_SERVICE_ROLE_KEY && token === process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isGoogleCalendarConfigured()) return NextResponse.json({ ok: true, skipped: "not configured" });

  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const db = createServiceClient();

  const { data: conns } = await db
    .from("google_calendar_connections")
    .select("user_id")
    .is("broken_at", null)
    .eq("push_enabled", true);
  const tutorIds = (conns ?? []).map((c) => c.user_id as string);
  if (tutorIds.length === 0) return NextResponse.json({ ok: true, tutors: 0, checked: 0 });

  // Upcoming lessons in any state that matters: live ones should be present,
  // cancelled ones absent.
  const { data: bookings } = await db
    .from("bookings")
    .select("id")
    .in("tutor_id", tutorIds)
    .in("status", ["confirmed", "completed", "cancelled_by_student", "cancelled_by_tutor", "no_show_tutor", "no_show_student", "cancelled"])
    .gte("ends_at", new Date(Date.now() - 24 * 3600_000).toISOString())
    .order("starts_at")
    .limit(MAX_PER_RUN);

  const ids = (bookings ?? []).map((b) => b.id as string);
  if (dry) return NextResponse.json({ ok: true, dry: true, tutors: tutorIds.length, wouldCheck: ids.length });

  const tally: Record<string, number> = {};
  for (const id of ids) {
    const r = await pushBooking(id);
    tally[r] = (tally[r] ?? 0) + 1;
  }

  return NextResponse.json({ ok: true, tutors: tutorIds.length, checked: ids.length, ...tally });
}
