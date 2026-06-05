// A "lesson space" is the persistent shared room for one tutor↔student pair.
// It's stored as a single tutor_lesson_sessions row per pair (status 'active').
// The current lesson is space.tutor_lesson_id (mutable, switchable in-room).

import { createClient } from "@supabase/supabase-js";

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export interface LessonSpace {
  id: string;
  tutor_id: string;
  student_id: string;
  tutor_lesson_id: string | null;
}

/**
 * Find or create a tutor's reusable "classroom" — a Google-Meet-style room the
 * tutor opens and shares a link to. There is no fixed student: anyone the tutor
 * sends the link to joins as the student. We model "no student yet" as
 * student_id === tutor_id (the column is NOT NULL), and role in the room is
 * decided by "are you the tutor who created it?".
 */
export async function getOrCreateTutorRoom(tutorId: string): Promise<LessonSpace> {
  const s = service();
  const { data: existing } = await s
    .from("tutor_lesson_sessions")
    .select("id, tutor_id, student_id, tutor_lesson_id")
    .eq("tutor_id", tutorId)
    .eq("student_id", tutorId) // sentinel: open classroom, no claimed student
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) return existing as LessonSpace;

  const { data: created, error } = await s
    .from("tutor_lesson_sessions")
    .insert({ tutor_id: tutorId, student_id: tutorId, status: "active", started_at: new Date().toISOString() })
    .select("id, tutor_id, student_id, tutor_lesson_id")
    .single();
  if (error) throw new Error("create room: " + error.message);
  return created as LessonSpace;
}

/** Find or create the single persistent lesson space for a (tutor, student) pair. */
export async function getOrCreateLessonSpace(tutorId: string, studentId: string): Promise<LessonSpace> {
  const s = service();
  const { data: existing } = await s
    .from("tutor_lesson_sessions")
    .select("id, tutor_id, student_id, tutor_lesson_id")
    .eq("tutor_id", tutorId)
    .eq("student_id", studentId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) return existing as LessonSpace;

  const { data: created, error } = await s
    .from("tutor_lesson_sessions")
    .insert({ tutor_id: tutorId, student_id: studentId, status: "active", started_at: new Date().toISOString() })
    .select("id, tutor_id, student_id, tutor_lesson_id")
    .single();
  if (error) throw new Error("create space: " + error.message);
  return created as LessonSpace;
}

/** The tutor↔student pairs a user belongs to (for "open space" entry points). */
export async function getConnectionsFor(
  userId: string,
  role: "tutor" | "student"
): Promise<Array<{ partnerId: string; partnerName: string; partnerEmail: string }>> {
  const s = service();
  if (role === "tutor") {
    const { data } = await s
      .from("tutor_students")
      .select("student_id, users:student_id(name, email)")
      .eq("tutor_id", userId)
      .eq("status", "active");
    return (data || []).map((r) => {
      const u = r.users as unknown as { name?: string; email?: string } | null;
      return { partnerId: r.student_id, partnerName: u?.name || "Student", partnerEmail: u?.email || "" };
    });
  }
  // student → their tutor(s)
  const { data } = await s
    .from("tutor_students")
    .select("tutor_id, users:tutor_id(name, email)")
    .eq("student_id", userId)
    .eq("status", "active");
  return (data || []).map((r) => {
    const u = r.users as unknown as { name?: string; email?: string } | null;
    return { partnerId: r.tutor_id, partnerName: u?.name || "Tutor", partnerEmail: u?.email || "" };
  });
}

/** Lightweight published-lesson list for the in-room picker. */
export async function getLessonPickerList(): Promise<
  Array<{ id: string; slug: string; title: string; level: string; category?: string }>
> {
  const s = service();
  const { data } = await s
    .from("tutor_lessons")
    .select("id, slug, title, level")
    .eq("status", "published")
    .order("level")
    .order("title");
  return data || [];
}
