// Lesson reviews waiting for approval. Approved ones appear on the tutor's
// public profile; rejected ones never do. Admin only.

import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { createServiceClient } from "@/lib/supabase/service";
import { ReviewQueue, type QueueReview } from "./review-queue";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const me = await getDashboardUser();
  if (!isAdmin(me)) redirect("/admin/login");

  const db = createServiceClient();
  // Everything waiting, however old -- a review must never fall out of the
  // queue because newer ones pushed it past a limit -- plus recent decisions.
  const COLS = "id, rating, comment, review_status, created_at, student_id, tutor_id";
  const [{ data: waiting }, { data: decided }] = await Promise.all([
    db.from("lesson_reviews").select(COLS).eq("review_status", "pending")
      .order("created_at", { ascending: true }).limit(1000),
    db.from("lesson_reviews").select(COLS).neq("review_status", "pending")
      .order("moderated_at", { ascending: false, nullsFirst: false }).limit(200),
  ]);
  const data = [...(waiting ?? []), ...(decided ?? [])];

  const rows = data ?? [];
  const ids = Array.from(new Set(rows.flatMap((r) => [r.student_id as string, r.tutor_id as string])));
  const { data: people } = ids.length
    ? await db.from("users").select("id, name").in("id", ids)
    : { data: [] as { id: string; name: string | null }[] };
  const nameOf = new Map((people ?? []).map((p) => [p.id as string, (p.name as string | null) ?? "Unnamed"]));

  const reviews: QueueReview[] = rows.map((r) => ({
    id: r.id as string,
    rating: r.rating as number,
    comment: (r.comment as string | null) ?? null,
    status: r.review_status as QueueReview["status"],
    createdAt: r.created_at as string,
    student: nameOf.get(r.student_id as string) ?? "Student",
    tutor: nameOf.get(r.tutor_id as string) ?? "Tutor",
  }));

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <h1 className="mb-1 flex items-center gap-2 font-heading text-2xl font-bold text-primary md:text-3xl">
        <Star className="h-6 w-6" /> Lesson reviews
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Students rate a lesson after class. Approve a review to publish it on the tutor&apos;s profile.
      </p>
      <ReviewQueue initial={reviews} />
    </div>
  );
}
