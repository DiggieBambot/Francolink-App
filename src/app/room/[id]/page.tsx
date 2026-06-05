// Live session room — both tutor and student visit /room/[id] and see the
// same lesson with their role-locked view. Realtime presence + tutor highlights.

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LessonRoom } from "@/components/lesson-v2/lesson-room";
import type { Lesson } from "@/lib/lessons/types";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/room/${id}`);

  const { data: session, error: sessionErr } = await supabase
    .from("tutor_lesson_sessions")
    .select("id, tutor_id, student_id, tutor_lesson_id, status, title")
    .eq("id", id)
    .single();
  if (sessionErr || !session) notFound();

  // Authorize: must be the tutor or the student of this session.
  const isTutor = session.tutor_id === user.id;
  const isStudent = session.student_id === user.id;
  if (!isTutor && !isStudent) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">You&apos;re not in this session</h1>
        <p className="text-sm text-slate-600">
          This session is between someone else and their tutor / student.
        </p>
      </div>
    );
  }
  const currentRole: "tutor" | "student" = isTutor ? "tutor" : "student";

  // Current lesson (may be null — either party picks one in-room).
  let lesson: Lesson | null = null;
  if (session.tutor_lesson_id) {
    const { data: row } = await supabase
      .from("tutor_lessons")
      .select("content")
      .eq("id", session.tutor_lesson_id)
      .maybeSingle();
    lesson = (row?.content as Lesson) ?? null;
  }

  // Lightweight published-lesson list for the in-room picker.
  const { data: lessonList } = await supabase
    .from("tutor_lessons")
    .select("id, slug, title, level")
    .eq("status", "published")
    .order("level")
    .order("title");

  // Load persisted highlights so a refresh restores them.
  const { data: highlights } = await supabase
    .from("tutor_lesson_highlights")
    .select("anchor_id, text")
    .eq("session_id", id);

  // Display name for presence.
  const { data: profile } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .maybeSingle();
  const name = profile?.name || profile?.email?.split("@")[0] || "User";

  return (
    <LessonRoom
      initialLesson={lesson}
      initialLessonId={session.tutor_lesson_id}
      lessonList={lessonList || []}
      sessionId={id}
      currentUserId={user.id}
      currentRole={currentRole}
      currentName={name}
      initialHighlights={highlights || []}
    />
  );
}
