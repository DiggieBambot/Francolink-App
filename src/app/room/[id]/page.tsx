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

  // Load the lesson content.
  if (!session.tutor_lesson_id) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">No lesson attached</h1>
        <p className="text-sm text-slate-600">
          The tutor hasn&apos;t selected a lesson for this session yet.
        </p>
      </div>
    );
  }
  const { data: row, error: lessonErr } = await supabase
    .from("tutor_lessons")
    .select("content")
    .eq("id", session.tutor_lesson_id)
    .single();
  if (lessonErr || !row) notFound();
  const lesson = row.content as Lesson;

  // Load persisted highlights so a refresh restores them.
  const { data: highlights } = await supabase
    .from("tutor_lesson_highlights")
    .select("anchor_id, text")
    .eq("session_id", id);

  // Display name for presence.
  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle();
  const name =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email?.split("@")[0] ||
    "User";

  return (
    <LessonRoom
      lesson={lesson}
      sessionId={id}
      currentUserId={user.id}
      currentRole={currentRole}
      currentName={name}
      initialHighlights={highlights || []}
    />
  );
}
