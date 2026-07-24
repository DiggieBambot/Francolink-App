// POST /api/tutor/join-from-room  { sessionId }
// A student in a live room asks to join that room's tutor as a student. Keyed by
// the session id (trusted server-side) so we don't depend on the invite code.
// Creates a PENDING request (same model as /join/[code]): a tutor_students row
// exists, but referred_by_tutor_id is only set when the tutor accepts in People.

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

  // Already attributed to some tutor?
  const { data: me } = await service
    .from("users")
    .select("referred_by_tutor_id")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.referred_by_tutor_id === tutorId) {
    return NextResponse.json({ ok: true, status: "connected" });
  }
  if (me?.referred_by_tutor_id) {
    return NextResponse.json(
      { error: "You're already connected to another tutor." },
      { status: 409 }
    );
  }

  // Was there already a relationship row? (Avoid emailing the tutor twice.)
  const { data: existingRel } = await service
    .from("tutor_students")
    .select("student_id")
    .eq("tutor_id", tutorId)
    .eq("student_id", user.id)
    .maybeSingle();

  // Auto-assign: attribute the student to this tutor immediately.
  const { error: attrError } = await service
    .from("users")
    .update({ referred_by_tutor_id: tutorId, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (attrError) return NextResponse.json({ error: attrError.message }, { status: 500 });

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
