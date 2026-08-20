// Sweeper: settle lessons that have finished.
//
// A paid booking sits at 'confirmed' forever unless something moves it on.
// Nothing did — which matters because a tutor's pay is the sum of
// tutor_pay_cents over their *completed* bookings, so an unswept booking is a
// lesson that happened and never earned anything.
//
// Attendance is deliberately not consulted. The agreed rule is that a student
// who does not turn up still owes the lesson, so "the end time has passed" is
// the correct default and 'no_show_tutor' is the exception a human records.
// Sweeping to 'completed' is therefore the generous-to-the-tutor direction,
// and GRACE_HOURS leaves room to record that exception before pay accrues.
//
// Query params:
//   ?dry=1      — report what would be settled, change nothing
//   ?hours=0.5  — override the grace window for one run

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const GRACE_HOURS = 2;
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
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  // Read the raw param first: Number(null) is 0, so testing the coerced value
  // turned "no ?hours given" into a zero grace window — settling every lesson
  // the moment it ended, with no room left to record a no-show.
  const rawHours = url.searchParams.get("hours");
  const parsedHours = rawHours === null || rawHours.trim() === "" ? NaN : Number(rawHours);
  const hours = Number.isFinite(parsedHours) && parsedHours >= 0 ? parsedHours : GRACE_HOURS;
  const cutoff = new Date(Date.now() - hours * 3600_000).toISOString();

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Release any holds whose checkout was abandoned. This runs off availability
  // reads too, but a tutor nobody browsed keeps a dead hold on a slot that the
  // no-overlap constraint then refuses to rebook.
  const { data: expired } = await svc.rpc("expire_stale_bookings");

  const { data: due, error } = await svc
    .from("bookings")
    .select("id, tutor_id, student_id, ends_at, tutor_pay_cents, is_trial")
    .eq("status", "confirmed")
    .lt("ends_at", cutoff)
    .order("ends_at", { ascending: true })
    .limit(MAX_PER_RUN);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = due || [];
  const payCents = rows.reduce((sum, b) => sum + (b.tutor_pay_cents || 0), 0);

  if (dry) {
    return NextResponse.json({
      dry: true,
      graceHours: hours,
      expiredHolds: expired ?? 0,
      wouldComplete: rows.length,
      tutorPayCents: payCents,
      ids: rows.slice(0, 50).map((b) => b.id),
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({
      ok: true,
      graceHours: hours,
      expiredHolds: expired ?? 0,
      completed: 0,
    });
  }

  // Re-assert the status in the filter so a lesson cancelled or marked a
  // no-show between the select and here is not overwritten.
  const { data: updated, error: updErr } = await svc
    .from("bookings")
    .update({ status: "completed" })
    .in(
      "id",
      rows.map((b) => b.id)
    )
    .eq("status", "confirmed")
    .select("id, tutor_pay_cents");
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  const settled = updated || [];
  const settledCents = settled.reduce((s, b) => s + (b.tutor_pay_cents || 0), 0);
  console.log(
    `[cron/complete-bookings] settled ${settled.length} lesson(s), ${settledCents} cents owed to tutors`
  );

  return NextResponse.json({
    ok: true,
    graceHours: hours,
    expiredHolds: expired ?? 0,
    completed: settled.length,
    tutorPayCents: settledCents,
  });
}
