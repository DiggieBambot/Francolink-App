// POST /api/tutor/end-room  { sessionId }
//
// The tutor closes a live room. Until this existed nothing ever moved a session
// off 'active', so rooms accumulated indefinitely — the in-room switcher and
// /tutor/sessions both had to filter around a growing pile of phantom classes.
//
// Only the owning tutor (or an admin) may end a room. Students leaving a room
// is not the same thing and does not end it.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { sessionId } = await req.json().catch(() => ({}));
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const service = svc();
  const { data: session } = await service
    .from("tutor_lesson_sessions")
    .select("id, tutor_id, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  if (session.tutor_id !== user.id) {
    const { data: me } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if ((me?.role || "").toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "This isn't your room" }, { status: 403 });
    }
  }

  // Ending an already-ended room is a no-op, not an error: two clicks, or a
  // tutor ending a room the sweeper just closed, should both settle quietly.
  if (session.status !== "active") {
    return NextResponse.json({ ok: true, alreadyEnded: true });
  }

  const { error } = await service
    .from("tutor_lesson_sessions")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
