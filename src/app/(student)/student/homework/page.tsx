// Student homework tab: everything their tutor has sent them — to-do,
// submitted, and reviewed (with feedback) — linking straight into the lesson.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { PencilLine, ArrowRight, CheckCircle2, Clock3, MessageSquareText, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  title: string;
  lessonSlug: string;
  questionCount: number;
  assignedAt: string;
  status: "todo" | "submitted" | "reviewed";
  feedback: string | null;
}

export default async function StudentHomeworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/student/homework");

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: assigns } = await svc
    .from("homework_assignments")
    .select("id, homework_id, lesson_slug, assigned_at")
    .eq("student_id", user.id)
    .order("assigned_at", { ascending: false });

  const rows: Row[] = [];
  if (assigns && assigns.length > 0) {
    const hwIds = [...new Set(assigns.map((a) => a.homework_id))];
    const [{ data: hws }, { data: subs }] = await Promise.all([
      svc.from("lesson_homework").select("id, title, questions").in("id", hwIds),
      svc.from("homework_submissions").select("homework_id, status, tutor_feedback").eq("student_id", user.id).in("homework_id", hwIds),
    ]);
    const hwMap = new Map((hws || []).map((h) => [h.id, h]));
    const subMap = new Map((subs || []).map((s) => [s.homework_id, s]));

    for (const a of assigns) {
      const hw = hwMap.get(a.homework_id);
      if (!hw) continue;
      const sub = subMap.get(a.homework_id);
      rows.push({
        id: a.id,
        title: hw.title || "Homework",
        lessonSlug: a.lesson_slug,
        questionCount: Array.isArray(hw.questions) ? hw.questions.length : 0,
        assignedAt: a.assigned_at,
        status: sub ? (sub.status === "reviewed" ? "reviewed" : "submitted") : "todo",
        feedback: sub?.tutor_feedback ?? null,
      });
    }
  }

  const todo = rows.filter((r) => r.status === "todo").length;

  const badge = {
    todo: { label: "To do", cls: "bg-secondary-100 text-secondary-700", Icon: Clock3 },
    submitted: { label: "Submitted", cls: "bg-primary-50 text-primary", Icon: CheckCircle2 },
    reviewed: { label: "Reviewed", cls: "bg-green-100 text-green-700", Icon: MessageSquareText },
  } as const;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
          <PencilLine className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">Homework</h1>
          <p className="mt-0.5 text-gray-600">
            {todo > 0 ? `${todo} assignment${todo === 1 ? "" : "s"} waiting for you` : "You're all caught up 🎉"}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-soft">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="font-heading font-semibold text-gray-700">No homework yet</p>
          <p className="mt-1 text-sm text-gray-500">
            When your tutor sends you homework, it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => {
            const b = badge[r.status];
            return (
              <li key={r.id}>
                <Link
                  href={`/library/lesson/${r.lessonSlug}#homework`}
                  className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-medium"
                >
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${r.status === "todo" ? "bg-secondary-100 text-secondary-700" : r.status === "reviewed" ? "bg-green-100 text-green-700" : "bg-primary-50 text-primary"}`}>
                    <b.Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading font-bold text-primary">{r.title}</p>
                    <p className="text-sm text-gray-500">
                      {r.questionCount} question{r.questionCount === 1 ? "" : "s"}
                      {r.status === "reviewed" && r.feedback ? (
                        <span className="text-green-700"> · “{r.feedback.length > 60 ? r.feedback.slice(0, 60) + "…" : r.feedback}”</span>
                      ) : null}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${b.cls}`}>{b.label}</span>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-500" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
