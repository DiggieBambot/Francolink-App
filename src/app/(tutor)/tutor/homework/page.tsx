// Tutor homework dashboard: every homework submission from this tutor's
// students, newest first, with an inline review + feedback action.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { PencilLine, Inbox } from "lucide-react";
import { ReviewCard, type ReviewItem } from "@/components/homework/review-card";
import type { HomeworkQuestion } from "@/lib/homework/types";

export const dynamic = "force-dynamic";

export default async function TutorHomeworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/tutor/homework");

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const role = (me?.role || "").toUpperCase();
  if (role !== "TUTOR" && role !== "ADMIN") redirect("/dashboard");

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: subs } = await svc
    .from("homework_submissions")
    .select("id, homework_id, student_id, answers, status, tutor_feedback, submitted_at")
    .eq("tutor_id", user.id)
    .order("submitted_at", { ascending: false });

  const rows = subs || [];
  const items: ReviewItem[] = [];

  if (rows.length > 0) {
    const hwIds = [...new Set(rows.map((r) => r.homework_id))];
    const studentIds = [...new Set(rows.map((r) => r.student_id))];

    const [{ data: hw }, { data: students }] = await Promise.all([
      svc.from("lesson_homework").select("id, title, lesson_slug, questions").in("id", hwIds),
      svc.from("users").select("id, name, email").in("id", studentIds),
    ]);

    const hwMap = new Map((hw || []).map((h) => [h.id, h]));
    const stMap = new Map((students || []).map((s) => [s.id, s]));

    for (const r of rows) {
      const h = hwMap.get(r.homework_id);
      const s = stMap.get(r.student_id);
      if (!h) continue;
      const questions = (h.questions || []) as HomeworkQuestion[];
      const answers = (Array.isArray(r.answers) ? r.answers : []).map(
        (a: { answer?: string }) => a?.answer ?? ""
      );
      items.push({
        submissionId: r.id,
        studentName: s?.name || s?.email || "Student",
        lessonTitle: h.title || "Lesson",
        lessonSlug: h.lesson_slug,
        status: r.status,
        submittedAt: r.submitted_at,
        feedback: r.tutor_feedback,
        questions,
        answers,
      });
    }
  }

  const pending = items.filter((i) => i.status === "submitted").length;

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
          <PencilLine className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Homework</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pending > 0 ? `${pending} awaiting your review` : "All caught up"}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-gray-700">
          <Inbox className="mx-auto mb-3 h-8 w-8 opacity-60" />
          <p>No homework submissions yet.</p>
          <p className="mt-1 text-sm">
            When your students submit homework on library lessons, it shows up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ReviewCard key={item.submissionId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
