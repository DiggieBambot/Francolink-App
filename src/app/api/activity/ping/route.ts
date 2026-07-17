// POST /api/activity/ping — records that the signed-in user is active today.
// Called client-side once per day (throttled in the browser). Cheap: one read +
// a last_seen_at update, plus a single 'active' event on the first hit each day.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { heartbeat } from "@/lib/analytics/activity";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  await heartbeat(user.id);
  return NextResponse.json({ ok: true });
}
