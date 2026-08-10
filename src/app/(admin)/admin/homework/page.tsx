// Admin homework review: every submission across every tutor, newest first.
//
// The tutor-facing page at /tutor/homework shows one tutor their own students.
// This is the same review flow without that filter, so an admin can see what
// students are submitting and step in where a tutor hasn't reviewed. The
// review API already authorises ADMIN for any submission, so ReviewCard works
// here unchanged.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { PencilLine, Inbox } from "lucide-react";
import { ReviewCard, type ReviewItem } from "@/components/homework/review-card";
import type { HomeworkQuestion } from "@/lib/homework/types";

export const dynamic = "force-dynamic";

// Submissions are unbounded over time; the page shows the most recent slice.
const PAGE_SIZE = 100;

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function AdminHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const pendingOnly = filter !== "all";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/homework");

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if ((me?.role || "").toUpperCase() !== "ADMIN") redirect("/dashboard");

  const svc = service();

  // Counts come from the whole table, not the page, so the tallies stay honest
  // once there are more submissions than PAGE_SIZE.
  const [{ count: totalCount }, { count: pendingCount }] = await Promise.all([
    svc.from("homework_submissions").select("*", { count: "exact", head: true }),
    svc
      .from("homework_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted"),
  ]);

  let query = svc
    .from("homework_submissions")
    .select(
      "id, homework_id, student_id, tutor_id, answers, status, tutor_feedback, submitted_at"
    )
    .order("submitted_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (pendingOnly) query = query.eq("status", "submitted");

  const { data: rows } = await query;
  const subs = rows || [];

  const items: ReviewItem[] = [];
  if (subs.length > 0) {
    const hwIds = [...new Set(subs.map((r) => r.homework_id))];
    // One id set for both students and tutors — they live in the same table.
    const peopleIds = [
      ...new Set(
        subs.flatMap((r) => [r.student_id, r.tutor_id]).filter(Boolean) as string[]
      ),
    ];

    const [{ data: hw }, { data: people }] = await Promise.all([
      svc.from("lesson_homework").select("id, title, lesson_slug, questions").in("id", hwIds),
      svc.from("users").select("id, name, email").in("id", peopleIds),
    ]);

    const hwMap = new Map((hw || []).map((h) => [h.id, h]));
    const peopleMap = new Map((people || []).map((p) => [p.id, p]));
    const nameOf = (id: string | null) => {
      if (!id) return null;
      const p = peopleMap.get(id);
      return p?.name || p?.email || null;
    };

    for (const r of subs) {
      const h = hwMap.get(r.homework_id);
      if (!h) continue;
      const questions = (h.questions || []) as HomeworkQuestion[];
      const answers = (Array.isArray(r.answers) ? r.answers : []).map(
        (a: { answer?: string }) => a?.answer ?? ""
      );
      items.push({
        submissionId: r.id,
        studentName: nameOf(r.student_id) || "Student",
        tutorName: nameOf(r.tutor_id) || "unassigned",
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

  const tab = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
        active ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
          <PencilLine className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Homework</h1>
          <p className="text-sm text-muted-foreground">
            {pendingCount ?? 0} awaiting review · {totalCount ?? 0} submitted all time
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border p-1">
          {tab("/admin/homework", "Awaiting review", pendingOnly)}
          {tab("/admin/homework?filter=all", "All", !pendingOnly)}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          <Inbox className="mx-auto mb-3 h-8 w-8 opacity-60" />
          <p>{pendingOnly ? "Nothing awaiting review." : "No homework submissions yet."}</p>
          {pendingOnly && (totalCount ?? 0) > 0 ? (
            <Link href="/admin/homework?filter=all" className="mt-2 inline-block text-sm text-primary hover:underline">
              View all {totalCount} submissions
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <ReviewCard key={item.submissionId} item={item} />
            ))}
          </div>
          {items.length >= PAGE_SIZE ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Showing the {PAGE_SIZE} most recent submissions.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
