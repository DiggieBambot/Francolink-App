// POST /api/tutor/join-from-room  { sessionId }
// A student in a live room asks to join that room's tutor as a student. Keyed by
// the session id (trusted server-side) so we don't depend on the invite code.
// Connects the student to that tutor (active). It never attributes commission:
// only a private invite code does that (lib/tutor/commission.ts).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notifyTutorNewStudent } from "@/lib/email/transactional";

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
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

  const service = svc();

  const { data: session } = await service
    .from("tutor_lesson_sessions")
    .select("tutor_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const tutorId = session.tutor_id;
  if (tutorId === user.id) {
    return NextResponse.json({ error: "You own this room" }, { status: 400 });
  }

  // Was there already a connection to THIS tutor? (Idempotent; also avoids
  // emailing the tutor twice.) A student may be connected to many tutors.
  const { data: existingRel } = await service
    .from("tutor_students")
    .select("student_id")
    .eq("tutor_id", tutorId)
    .eq("student_id", user.id)
    .maybeSingle();
  if (existingRel) {
    return NextResponse.json({ ok: true, status: "connected" });
  }

  // No commission here: joining from a room isn't an invite code, so it
  // connects without attributing (lib/tutor/commission.ts).
  const { error } = await service
    .from("tutor_students")
    .upsert(
      { tutor_id: tutorId, student_id: user.id, status: "active", assigned_at: new Date().toISOString() },
      { onConflict: "tutor_id,student_id" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!existingRel) {
    const { data: me2 } = await service.from("users").select("name").eq("id", user.id).maybeSingle();
    await notifyTutorNewStudent(tutorId, me2?.name);
  }

  return NextResponse.json({ ok: true, status: "connected" });
}
