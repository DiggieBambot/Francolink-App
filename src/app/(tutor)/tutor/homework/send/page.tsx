// Tutor "send homework" catalogue: every published homework set in one place,
// searchable and filterable by level. Previously the only way to send homework
// was to open an individual library lesson and scroll to the bottom, which made
// the whole feature undiscoverable.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { ArrowLeft, Send } from "lucide-react";
import { HomeworkCatalogue, type CatalogueItem } from "@/components/homework/homework-catalogue";
import { frGrammarLessons } from "@/lib/seed/fr-grammar";
import { getTutorStudents } from "@/lib/tutor/students";
import type { HomeworkQuestion } from "@/lib/homework/types";

export const dynamic = "force-dynamic";

const LEVEL_RE = /-([abc][12])-/i;

function levelOf(slug: string): string {
  const m = LEVEL_RE.exec(slug);
  return m ? m[1].toUpperCase() : "Other";
}

export default async function SendHomeworkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/tutor/homework/send");

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const role = (me?.role || "").toUpperCase();
  if (role !== "TUTOR" && role !== "ADMIN") redirect("/dashboard");

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const [{ data: hw }, students, { data: assigns }] = await Promise.all([
    svc
      .from("lesson_homework")
      .select("id, lesson_slug, title, instructions, questions")
      .eq("enabled", true)
      .eq("status", "published")
      .order("lesson_slug"),
    getTutorStudents(user.id),
    svc.from("homework_assignments").select("homework_id, student_id").eq("tutor_id", user.id),
  ]);

  // Lesson titles come from the seed catalogue so the tutor sees what the
  // homework belongs to, not just the homework's own title.
  const lessonTitles = new Map(frGrammarLessons.map((l) => [l.slug, l.title]));

  const assignedByHw = new Map<string, string[]>();
  for (const a of assigns || []) {
    const list = assignedByHw.get(a.homework_id) || [];
    list.push(a.student_id);
    assignedByHw.set(a.homework_id, list);
  }

  const items: CatalogueItem[] = (hw || []).map((h) => ({
    slug: h.lesson_slug,
    title: h.title,
    instructions: h.instructions,
    questions: (h.questions || []) as HomeworkQuestion[],
    level: levelOf(h.lesson_slug),
    lessonTitle: lessonTitles.get(h.lesson_slug) || h.lesson_slug,
    assignedStudentIds: assignedByHw.get(h.id) || [],
  }));

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <Link
        href="/tutor/homework"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Homework
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
          <Send className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Send homework</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {items.length} sets available · {students.length} connected student
            {students.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
          No published homework yet.
        </p>
      ) : (
        <HomeworkCatalogue items={items} students={students} />
      )}
    </div>
  );
}
