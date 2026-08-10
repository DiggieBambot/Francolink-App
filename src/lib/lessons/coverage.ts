// Reads for the lesson-coverage history (what a tutor and student have actually
// worked through together). Writes live in /api/space/[id]/covered.
//
// Uses the service client because every view here crosses the user boundary —
// a student needs their tutor's name, a tutor needs their students' names, and
// RLS blocks those reads. Each function is scoped by an explicit id argument;
// callers must pass an id they've already authorised.

import { createClient } from "@supabase/supabase-js";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface CoverageEntry {
  id: string;
  lessonId: string;
  lessonTitle: string;
  lessonSlug: string | null;
  level: string | null;
  coveredOn: string;
  minutes: number | null;
  partnerName: string;
}

interface Row {
  id: string;
  tutor_id: string;
  student_id: string;
  tutor_lesson_id: string;
  lesson_title: string | null;
  covered_on: string;
  minutes: number | null;
  lesson: { title: string; slug: string; level: string | null } | null;
}

/** Shape raw rows into display entries, naming the *other* person in the pair. */
async function shape(rows: Row[], partnerKey: "tutor_id" | "student_id"): Promise<CoverageEntry[]> {
  if (!rows.length) return [];

  const partnerIds = [...new Set(rows.map((r) => r[partnerKey]))];
  const { data: people } = await svc()
    .from("users")
    .select("id, name, email")
    .in("id", partnerIds);

  const nameById = new Map(
    (people || []).map((p) => [p.id as string, (p.name as string) || (p.email as string)?.split("@")[0] || "—"])
  );

  return rows.map((r) => ({
    id: r.id,
    lessonId: r.tutor_lesson_id,
    // Prefer the live lesson title; fall back to the snapshot taken at the time
    // so history survives a lesson being deleted or unpublished.
    lessonTitle: r.lesson?.title || r.lesson_title || "Untitled lesson",
    lessonSlug: r.lesson?.slug ?? null,
    level: r.lesson?.level ?? null,
    coveredOn: r.covered_on,
    minutes: r.minutes,
    partnerName: nameById.get(r[partnerKey]) || "—",
  }));
}

const SELECT =
  "id, tutor_id, student_id, tutor_lesson_id, lesson_title, covered_on, minutes, lesson:tutor_lessons(title, slug, level)";

/** Everything this student has covered, newest first. */
export async function getStudentCoverage(studentId: string, limit = 200): Promise<CoverageEntry[]> {
  const { data } = await svc()
    .from("lesson_coverage")
    .select(SELECT)
    .eq("student_id", studentId)
    .order("covered_on", { ascending: false })
    .limit(limit);
  return shape((data || []) as unknown as Row[], "tutor_id");
}

/** What one tutor has covered with one student, newest first. */
export async function getPairCoverage(
  tutorId: string,
  studentId: string,
  limit = 200
): Promise<CoverageEntry[]> {
  const { data } = await svc()
    .from("lesson_coverage")
    .select(SELECT)
    .eq("tutor_id", tutorId)
    .eq("student_id", studentId)
    .order("covered_on", { ascending: false })
    .limit(limit);
  return shape((data || []) as unknown as Row[], "student_id");
}

/** Everything a tutor has covered across all their students, newest first. */
export async function getTutorCoverage(tutorId: string, limit = 200): Promise<CoverageEntry[]> {
  const { data } = await svc()
    .from("lesson_coverage")
    .select(SELECT)
    .eq("tutor_id", tutorId)
    .order("covered_on", { ascending: false })
    .limit(limit);
  return shape((data || []) as unknown as Row[], "student_id");
}

/** Per-student totals for a tutor — distinct lessons and last activity. */
export async function getTutorCoverageSummary(
  tutorId: string
): Promise<Array<{ studentId: string; studentName: string; lessons: number; lastCoveredOn: string }>> {
  const { data } = await svc()
    .from("lesson_coverage")
    .select("student_id, tutor_lesson_id, covered_on")
    .eq("tutor_id", tutorId)
    .order("covered_on", { ascending: false });

  const rows = data || [];
  if (!rows.length) return [];

  const byStudent = new Map<string, { lessons: Set<string>; last: string }>();
  for (const r of rows) {
    const sid = r.student_id as string;
    const entry = byStudent.get(sid);
    if (entry) {
      entry.lessons.add(r.tutor_lesson_id as string);
      if ((r.covered_on as string) > entry.last) entry.last = r.covered_on as string;
    } else {
      byStudent.set(sid, { lessons: new Set([r.tutor_lesson_id as string]), last: r.covered_on as string });
    }
  }

  const { data: people } = await svc()
    .from("users")
    .select("id, name, email")
    .in("id", [...byStudent.keys()]);
  const nameById = new Map(
    (people || []).map((p) => [p.id as string, (p.name as string) || (p.email as string)?.split("@")[0] || "—"])
  );

  return [...byStudent.entries()]
    .map(([studentId, v]) => ({
      studentId,
      studentName: nameById.get(studentId) || "—",
      lessons: v.lessons.size,
      lastCoveredOn: v.last,
    }))
    .sort((a, b) => b.lastCoveredOn.localeCompare(a.lastCoveredOn));
}

/** Platform-wide recent coverage, for the admin overview. */
export async function getAllCoverage(limit = 300): Promise<
  Array<CoverageEntry & { tutorName: string }>
> {
  const s = svc();
  const { data } = await s
    .from("lesson_coverage")
    .select(SELECT)
    .order("covered_on", { ascending: false })
    .limit(limit);

  const rows = (data || []) as unknown as Row[];
  if (!rows.length) return [];

  const ids = [...new Set(rows.flatMap((r) => [r.tutor_id, r.student_id]))];
  const { data: people } = await s.from("users").select("id, name, email").in("id", ids);
  const nameById = new Map(
    (people || []).map((p) => [p.id as string, (p.name as string) || (p.email as string)?.split("@")[0] || "—"])
  );

  return rows.map((r) => ({
    id: r.id,
    lessonId: r.tutor_lesson_id,
    lessonTitle: r.lesson?.title || r.lesson_title || "Untitled lesson",
    lessonSlug: r.lesson?.slug ?? null,
    level: r.lesson?.level ?? null,
    coveredOn: r.covered_on,
    minutes: r.minutes,
    partnerName: nameById.get(r.student_id) || "—",
    tutorName: nameById.get(r.tutor_id) || "—",
  }));
}
