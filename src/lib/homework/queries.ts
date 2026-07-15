// Server-only homework queries. Uses the service-role client so the public
// lesson page (which itself reads lessons with the service role) can fetch
// live homework and a student's own submission without RLS friction.
// (Only import from server components / route handlers.)

import { createClient } from "@supabase/supabase-js";
import type { Homework, HomeworkSubmission } from "./types";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Live homework for a lesson slug (enabled + published). Null if none. */
export async function getLiveHomeworkBySlug(slug: string): Promise<Homework | null> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("lesson_homework")
    .select("*")
    .eq("lesson_slug", slug)
    .eq("enabled", true)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return data as Homework;
}

/** Any homework row for a lesson slug regardless of state (for staff editors). */
export async function getHomeworkBySlug(slug: string): Promise<Homework | null> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("lesson_homework")
    .select("*")
    .eq("lesson_slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Homework;
}

/** The assignment for a given homework + student, if the tutor sent it. */
export async function getAssignmentForStudent(
  homeworkId: string,
  studentId: string
): Promise<{ id: string; tutor_id: string; assigned_at: string } | null> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("homework_assignments")
    .select("id, tutor_id, assigned_at")
    .eq("homework_id", homeworkId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/** A student's own submission for a homework, if any. */
export async function getSubmission(
  homeworkId: string,
  studentId: string
): Promise<HomeworkSubmission | null> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("homework_submissions")
    .select("*")
    .eq("homework_id", homeworkId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (error || !data) return null;
  return data as HomeworkSubmission;
}
