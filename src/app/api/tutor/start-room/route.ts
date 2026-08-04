import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendLiveClassInvite } from "@/lib/notifications/live-invite";

/**
 * Creates a tutor_lesson_sessions row and returns the room id.
 * Called by StartSessionBanner when the tutor picks a student and starts a session
 * directly from the lesson detail page.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, lessonId } = await request.json();
  if (!studentId || !lessonId) {
    return NextResponse.json({ error: "studentId and lessonId are required" }, { status: 400 });
  }

  // Verify the student belongs to this tutor
  const { data: link } = await supabase
    .from("tutor_students")
    .select("id")
    .eq("tutor_id", user.id)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();

  if (!link) {
    return NextResponse.json({ error: "Student not assigned to you" }, { status: 403 });
  }

  const { data: session, error } = await supabase
    .from("tutor_lesson_sessions")
    .insert({
      tutor_id: user.id,
      student_id: studentId,
      tutor_lesson_id: lessonId,
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !session) {
    console.error("start-room error:", error?.message);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  // Ring the student: in-app popup on their dashboard + Web Push if subscribed.
  const { data: lesson } = await supabase
    .from("tutor_lessons")
    .select("title")
    .eq("id", lessonId)
    .maybeSingle();

  await sendLiveClassInvite({
    tutorId: user.id,
    studentId,
    roomId: session.id,
    lessonTitle: lesson?.title ?? null,
  });

  return NextResponse.json({ roomId: session.id });
}
