// POST /api/tutor/room-homework  { sessionId, lessonId }
// Send the current room lesson's homework to the room's student, in one click,
// from inside the live room. Both the student and the lesson are resolved from
// the session server-side, so a tutor can only assign their own room's lesson to
// their own room's student.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notifyUser } from "@/lib/notifications/create";
import { notifyStudentHomeworkAssigned } from "@/lib/email/transactional";

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

  const { sessionId, lessonId } = await req.json().catch(() => ({}));
  if (!sessionId || !lessonId) {
    return NextResponse.json({ error: "sessionId and lessonId are required" }, { status: 400 });
  }

  const service = svc();

  // The room decides who the student is — not the client.
  const { data: session } = await service
    .from("tutor_lesson_sessions")
    .select("id, tutor_id, student_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (session.tutor_id !== user.id) {
    return NextResponse.json({ error: "Not your room" }, { status: 403 });
  }
  if (!session.student_id || session.student_id === session.tutor_id) {
    return NextResponse.json({ error: "No student in this room yet" }, { status: 400 });
  }

  // Resolve the lesson's slug — homework is keyed by lesson_slug.
  const { data: lessonRow } = await service
    .from("tutor_lessons")
    .select("slug, title")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lessonRow?.slug) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  // Homework must exist and be published.
  const { data: hw } = await service
    .from("lesson_homework")
    .select("id, lesson_id, lesson_slug, title, status, enabled")
    .eq("lesson_slug", lessonRow.slug)
    .maybeSingle();
  if (!hw || !hw.enabled || hw.status !== "published") {
    return NextResponse.json(
      { error: `No homework for “${lessonRow.title}” yet` },
      { status: 404 }
    );
  }

  const { error: insErr } = await service
    .from("homework_assignments")
    .upsert(
      {
        homework_id: hw.id,
        lesson_id: hw.lesson_id,
        lesson_slug: hw.lesson_slug,
        student_id: session.student_id,
        tutor_id: user.id,
        assigned_at: new Date().toISOString(),
      },
      { onConflict: "homework_id,student_id" }
    );
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // In-app notification + Web Push, then the transactional email.
  await notifyUser({
    userId: session.student_id,
    type: "homework_assigned",
    title: "New homework from your tutor",
    body: `${hw.title} — tap to complete it.`,
    url: `/library/lesson/${hw.lesson_slug}#homework`,
  });
  const { data: tutor } = await service.from("users").select("name").eq("id", user.id).maybeSingle();
  await notifyStudentHomeworkAssigned(session.student_id, hw.lesson_slug, hw.title, tutor?.name);

  return NextResponse.json({ ok: true, title: hw.title });
}
