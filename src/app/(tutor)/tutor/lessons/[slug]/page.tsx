import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LessonRenderer } from "@/components/lesson-v2/lesson-renderer";
import { StartSessionBanner } from "./start-session-banner";
import { HomeworkSendPanel } from "@/components/homework/homework-send-panel";
import { getLiveHomeworkBySlug } from "@/lib/homework/queries";
import { getTutorStudents } from "@/lib/tutor/students";
import type { Lesson } from "@/lib/lessons/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TutorLessonPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: row, error } = await supabase
    .from("tutor_lessons")
    .select("id, slug, title, level, content")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !row) notFound();

  const { data: students } = await supabase
    .from("tutor_students")
    .select("student:users!student_id(id, name, email)")
    .eq("tutor_id", user?.id)
    .eq("status", "active");

  type StudentRow = { id: string; name: string; email: string };
  const studentList = (students || [])
    .flatMap((s) => (s.student ? [(s.student as unknown) as StudentRow] : []));

  const lesson = row.content as Lesson;

  // This lesson's homework, so the tutor can send it ahead of a session.
  const homework = await getLiveHomeworkBySlug(slug);
  let tutorStudents: { id: string; name: string | null; email: string }[] = [];
  let alreadyAssignedIds: string[] = [];
  if (homework && user?.id) {
    const svc = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const [studs, { data: assigns }] = await Promise.all([
      getTutorStudents(user.id),
      svc.from("homework_assignments").select("student_id").eq("homework_id", homework.id),
    ]);
    tutorStudents = studs;
    alreadyAssignedIds = (assigns || []).map((a) => a.student_id);
  }

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      {/* Back nav */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
        <Link
          href="/tutor/lessons"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Lesson Library
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-700 truncate">{row.title}</span>
      </div>

      {/* Start Session Banner */}
      <StartSessionBanner
        lessonId={row.id}
        lessonTitle={row.title}
        students={studentList}
      />

      {/* Full lesson in tutor view */}
      <LessonRenderer lesson={lesson} initialView="tutor" />

      {/* Send this lesson's homework to a student ahead of the session. */}
      {homework ? (
        <div className="pb-16">
          <HomeworkSendPanel
            slug={slug}
            homeworkTitle={homework.title}
            instructions={homework.instructions}
            questions={homework.questions}
            students={tutorStudents}
            alreadyAssignedIds={alreadyAssignedIds}
          />
        </div>
      ) : null}
    </div>
  );
}
