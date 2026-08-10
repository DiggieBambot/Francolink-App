// Sweeper: close live rooms nobody ended.
//
// Tutors now have an explicit "End class" button, but they will forget, close
// the tab, or lose connection mid-lesson. Without this, sessions sit at
// 'active' forever: when this was written 32 rooms were open, one tutor holding
// 22, and only 2 of them started within the previous day.
//
// A room is swept when it started (or, lacking that, was created) more than
// STALE_AFTER_HOURS ago. That is deliberately generous — a long or paused
// lesson must never be closed underneath a tutor who is still teaching.
//
// Query params:
//   ?dry=1     — report what would be closed, change nothing
//   ?hours=12  — override the staleness window for one run

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const STALE_AFTER_HOURS = 8;

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
  const hours = Number(url.searchParams.get("hours")) || STALE_AFTER_HOURS;
  const cutoff = new Date(Date.now() - hours * 3600_000).toISOString();

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: candidates, error } = await svc
    .from("tutor_lesson_sessions")
    .select("id, tutor_id, started_at, created_at")
    .eq("status", "active");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // started_at is nullable (a session created but never entered), so fall back
  // to created_at rather than skipping the row and leaking it forever.
  const stale = (candidates || []).filter(
    (s) => (s.started_at || s.created_at || "") < cutoff
  );

  if (dry) {
    return NextResponse.json({
      dry: true,
      hours,
      active: (candidates || []).length,
      wouldClose: stale.length,
      ids: stale.slice(0, 50).map((s) => s.id),
    });
  }

  if (stale.length === 0) {
    return NextResponse.json({ ok: true, active: (candidates || []).length, closed: 0 });
  }

  const { error: updErr } = await svc
    .from("tutor_lesson_sessions")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .in("id", stale.map((s) => s.id));
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    hours,
    active: (candidates || []).length,
    closed: stale.length,
  });
}
