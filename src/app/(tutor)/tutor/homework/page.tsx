// Tutor homework dashboard: every homework submission from this tutor's
// students, newest first, with an inline review + feedback action.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { PencilLine, Inbox, Send, ExternalLink } from "lucide-react";
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

  const [{ data: subs }, { data: assigns }] = await Promise.all([
    svc
      .from("homework_submissions")
      .select("id, homework_id, student_id, answers, status, tutor_feedback, submitted_at")
      .eq("tutor_id", user.id)
      .order("submitted_at", { ascending: false }),
    svc
      .from("homework_assignments")
      .select("id, homework_id, student_id, lesson_slug, assigned_at")
      .eq("tutor_id", user.id)
      .order("assigned_at", { ascending: false }),
  ]);

  const rows = subs || [];
  const items: ReviewItem[] = [];

  // Assignments the tutor sent that have no submission yet ("given" homework).
  const submittedKeys = new Set(rows.map((r) => `${r.homework_id}:${r.student_id}`));
  const awaitingRaw = (assigns || []).filter(
    (a) => !submittedKeys.has(`${a.homework_id}:${a.student_id}`)
  );

  let awaiting: { id: string; studentName: string; title: string; lessonSlug: string; assignedAt: string }[] = [];

  const hwIds = [...new Set([...rows.map((r) => r.homework_id), ...awaitingRaw.map((a) => a.homework_id)])];
  const studentIds = [...new Set([...rows.map((r) => r.student_id), ...awaitingRaw.map((a) => a.student_id)])];

  if (hwIds.length > 0) {
    const [{ data: hw }, { data: students }] = await Promise.all([
      svc.from("lesson_homework").select("id, title, lesson_slug, questions").in("id", hwIds),
      svc.from("users").select("id, name, email").in("id", studentIds),
    ]);

    const hwMap = new Map((hw || []).map((h) => [h.id, h]));
    const stMap = new Map((students || []).map((s) => [s.id, s]));

    awaiting = awaitingRaw.map((a) => {
      const h = hwMap.get(a.homework_id);
      const s = stMap.get(a.student_id);
      return {
        id: a.id,
        studentName: s?.name || s?.email || "Student",
        title: h?.title || "Homework",
        lessonSlug: a.lesson_slug,
        assignedAt: a.assigned_at,
      };
    });

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

      {/* Sent — awaiting submission */}
      {awaiting.length > 0 ? (
        <div className="mb-8 rounded-2xl border border-secondary-200 bg-secondary-50/50 p-5 dark:border-secondary-800 dark:bg-secondary-900/10">
          <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-bold text-gray-900 dark:text-white">
            <Send className="h-4 w-4 text-secondary-600" /> Sent — awaiting submission
            <span className="rounded-full bg-secondary-500 px-2 py-0.5 text-xs font-bold text-white">{awaiting.length}</span>
          </h2>
          <ul className="divide-y divide-secondary-100 overflow-hidden rounded-xl border border-secondary-100 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
            {awaiting.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{a.studentName}</p>
                  <p className="truncate text-xs text-gray-500">{a.title}</p>
                </div>
                <Link
                  href={`/library/lesson/${a.lessonSlug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  View lesson <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-gray-700">
          <Inbox className="mx-auto mb-3 h-8 w-8 opacity-60" />
          <p>No homework submissions yet.</p>
          <p className="mt-1 text-sm">
            {awaiting.length > 0
              ? "Your students haven't submitted yet — you'll see their answers here."
              : "Send homework from any library lesson, then review submissions here."}
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
