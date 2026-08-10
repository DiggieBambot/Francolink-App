// POST /api/space/[id]/covered  { lessonId, minutes? }
//
// Records that this room's pair actually worked through a lesson. Called by the
// room client once a lesson has been open long enough to count (see DWELL_MS in
// lesson-room.tsx) — coverage is a side effect of teaching, not a button anyone
// has to remember to press.
//
// Idempotent: the unique index (tutor, student, lesson, covered_on) collapses
// repeat calls on the same day, so the client can fire this more than once.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createService } from "@supabase/supabase-js";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId, minutes } = await req.json().catch(() => ({}));
  if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  const svc = createService(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: space } = await svc
    .from("tutor_lesson_sessions")
    .select("id, tutor_id, student_id")
    .eq("id", id)
    .maybeSingle();
  if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });

  // Only the two people in the room can record against it.
  const isTutor = space.tutor_id === user.id;
  const isPairStudent = space.student_id === user.id && !isTutor;

  // An "open classroom" stores student_id === tutor_id (no claimed student yet).
  // There, the student is whoever is in the room that isn't the tutor.
  const openClassroom = space.student_id === space.tutor_id;
  const studentId = openClassroom ? (isTutor ? null : user.id) : space.student_id;

  if (!isTutor && !isPairStudent && !openClassroom) {
    return NextResponse.json({ error: "Not your room" }, { status: 403 });
  }

  // A tutor alone in an unclaimed room has no one to attribute coverage to —
  // the student's own client will record it when they arrive.
  if (!studentId || studentId === space.tutor_id) {
    return NextResponse.json({ ok: true, recorded: false, reason: "no_student" });
  }

  const { data: lesson } = await svc
    .from("tutor_lessons")
    .select("title")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const { error } = await svc.from("lesson_coverage").upsert(
    {
      tutor_id: space.tutor_id,
      student_id: studentId,
      tutor_lesson_id: lessonId,
      session_id: space.id,
      lesson_title: lesson.title,
      minutes: typeof minutes === "number" && minutes > 0 ? Math.round(minutes) : null,
    },
    { onConflict: "tutor_id,student_id,tutor_lesson_id,covered_on", ignoreDuplicates: true }
  );

  if (error) {
    console.error("[covered] upsert failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, recorded: true });
}
