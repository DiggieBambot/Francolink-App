// POST /api/activity/ping — records that the signed-in user is active today.
// Called client-side once per day (throttled in the browser). Cheap: one read +
// a last_seen_at update, plus a single 'active' event on the first hit each day.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { heartbeat } from "@/lib/analytics/activity";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // Browser-reported IANA timezone (e.g. "America/New_York"), used for
  // locally-timed emails. Basic sanity check before storing.
  let tz: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.tz === "string" && body.tz.length <= 64 && body.tz.includes("/")) tz = body.tz;
  } catch { /* no body */ }

  await heartbeat(user.id, tz);
  return NextResponse.json({ ok: true });
}
