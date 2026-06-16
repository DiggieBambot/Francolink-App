import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LessonRenderer } from "@/components/lesson-v2/lesson-renderer";
import { StartSessionBanner } from "./start-session-banner";
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
    </div>
  );
}
