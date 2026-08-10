// /tutor/students/[id]/history — what this tutor and this student have covered
// together, so the tutor can pick up where they left off.

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getPairCoverage } from "@/lib/lessons/coverage";
import { CoverageTimeline } from "@/components/coverage/coverage-timeline";
import { ArrowLeft, History, BookOpen, CalendarCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TutorStudentHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/tutor/students/${studentId}/history`);

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Only a tutor this student is actually assigned to may read the pair history.
  const { data: link } = await svc
    .from("tutor_students")
    .select("student_id")
    .eq("tutor_id", user.id)
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();
  if (!link) notFound();

  const { data: student } = await svc
    .from("users")
    .select("name, email")
    .eq("id", studentId)
    .maybeSingle();
  const studentName = student?.name || student?.email?.split("@")[0] || "Student";

  const entries = await getPairCoverage(user.id, studentId);
  const distinctLessons = new Set(entries.map((e) => e.lessonId)).size;
  const distinctDays = new Set(entries.map((e) => e.coveredOn)).size;

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <Link
        href="/tutor/students"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to students
      </Link>

      <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
        <History className="h-6 w-6 text-primary" />
        {studentName}
      </h1>
      <p className="mb-6 mt-1 text-sm text-gray-500">
        Lessons you&apos;ve covered together in live classes.
      </p>

      {entries.length > 0 && (
        <div className="mb-6 flex gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary">
            <BookOpen className="h-4 w-4" /> {distinctLessons} lessons
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-600">
            <CalendarCheck className="h-4 w-4" /> {distinctDays} class days
          </span>
        </div>
      )}

      <CoverageTimeline
        entries={entries}
        partnerLabel="Student"
        emptyHint="Open a lesson in this student's room and keep it up for a couple of minutes — it'll be recorded here automatically."
      />
    </div>
  );
}
