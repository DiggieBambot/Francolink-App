// A tutor's class list, in one place.
//
// Active `tutor_students` connections are the source of truth for "who is in my
// class". `referred_by_tutor_id` only records the tutor who first referred a
// student — a student can have several teachers, and a student can be connected
// to a tutor without having been referred by them. Reading the wrong column
// silently drops students from the homework flow, so every feature that needs
// "my students" should use this helper.

import { createClient as createServiceClient } from "@supabase/supabase-js";

export interface TutorStudent {
  id: string;
  name: string | null;
  email: string;
}

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Ids of the students actively connected to this tutor (never the tutor). */
export async function getTutorStudentIds(tutorId: string): Promise<string[]> {
  const { data } = await svc()
    .from("tutor_students")
    .select("student_id")
    .eq("tutor_id", tutorId)
    .eq("status", "active");
  return [...new Set((data || []).map((r) => r.student_id).filter((id) => id && id !== tutorId))];
}

/** This tutor's students, name-ordered, for pickers and lists. */
export async function getTutorStudents(tutorId: string): Promise<TutorStudent[]> {
  const ids = await getTutorStudentIds(tutorId);
  if (ids.length === 0) return [];
  const { data } = await svc()
    .from("users")
    .select("id, name, email")
    .in("id", ids)
    .order("name");
  return (data || []) as TutorStudent[];
}
