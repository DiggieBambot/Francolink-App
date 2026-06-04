// Admin preview: render an already-stored tutor_lessons row via LessonRenderer.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LessonRenderer } from "@/components/lesson-v2/lesson-renderer";
import type { Lesson } from "@/lib/lessons/types";

export default async function AdminTutorLessonPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("tutor_lessons")
    .select("id, status, content")
    .eq("id", id)
    .single();
  if (error || !row) notFound();

  const lesson = row.content as Lesson;

  return (
    <div className="-mx-8 -my-6">
      <div className="border-b bg-white px-6 py-2 text-sm">
        <Link
          href={`/admin/tutor-lessons/${id}`}
          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to review · status: {row.status}
        </Link>
      </div>
      <LessonRenderer lesson={lesson} initialView="tutor" />
    </div>
  );
}
