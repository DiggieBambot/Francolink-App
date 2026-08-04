// POST /api/tutor/ring-room  { sessionId }
// Re-ring the student of an existing room: fires the same live-class invite
// (dashboard popup + Web Push) that session creation sends, so a tutor already
// inside a room can summon their student without leaving. The student is derived
// from the session server-side — the tutor can only ring their own room's student.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendLiveClassInvite } from "@/lib/notifications/live-invite";

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
    .select("id, tutor_id, student_id, tutor_lesson_id, title, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (session.tutor_id !== user.id) {
    return NextResponse.json({ error: "Not your room" }, { status: 403 });
  }
  // Open classroom sentinel: student_id === tutor_id means nobody is paired yet.
  if (!session.student_id || session.student_id === session.tutor_id) {
    return NextResponse.json({ ok: false, reason: "no_student" });
  }

  let lessonTitle: string | null = session.title || null;
  if (!lessonTitle && session.tutor_lesson_id) {
    const { data: lesson } = await service
      .from("tutor_lessons")
      .select("title")
      .eq("id", session.tutor_lesson_id)
      .maybeSingle();
    lessonTitle = lesson?.title ?? null;
  }

  await sendLiveClassInvite({
    tutorId: user.id,
    studentId: session.student_id,
    roomId: session.id,
    lessonTitle,
  });

  return NextResponse.json({ ok: true });
}
