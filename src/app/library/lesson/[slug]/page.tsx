// Public lesson viewer. Role decides the view:
//   - tutor / admin  → tutor view (scaffolding, answers, tips)
//   - student / guest → student view (clean, no answers)
// View is locked (no toggle) so guests never see tutor scaffolding.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Video, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPublishedLessonBySlug } from "@/lib/lessons/public-queries";
import { LessonRenderer } from "@/components/lesson-v2/lesson-renderer";
import { GuestCTA } from "@/components/library/guest-cta";
import { PublicShell } from "@/components/layout/public-shell";
import { ShareButton } from "@/components/library/share-button";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { HomeworkPanel } from "@/components/homework/homework-panel";
import { HomeworkSendPanel } from "@/components/homework/homework-send-panel";
import { getTutorStudents } from "@/lib/tutor/students";
import { getLiveHomeworkBySlug, getSubmission, getAssignmentForStudent } from "@/lib/homework/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await getPublishedLessonBySlug(slug);
  return { title: found ? `${found.lesson.title} | FrancoLink` : "Lesson | FrancoLink" };
}

export default async function PublicLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = await getPublishedLessonBySlug(slug);
  if (!found) notFound();

  // Determine viewer role (guests allowed).
  let isTutor = false;
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      isTutor = profile?.role === "TUTOR" || profile?.role === "ADMIN";
    }
  } catch {
    // not logged in → guest → student view
  }

  const view = isTutor ? "tutor" : "student";

  // Homework content for this lesson (published in a batch), if any.
  const homework = await getLiveHomeworkBySlug(slug);

  // Assignment-gated — only render the panel if a tutor SENT this homework to
  // this user. Role is deliberately not part of the test: a tutor or admin can
  // also be somebody's student, and if homework was assigned to them they must
  // be able to see and submit it.
  const assignment = homework && userId
    ? await getAssignmentForStudent(homework.id, userId)
    : null;
  const submission = assignment && userId ? await getSubmission(homework!.id, userId) : null;

  // Tutor side: if homework exists, let the tutor send it to their students.
  let tutorStudents: { id: string; name: string | null; email: string }[] = [];
  let alreadyAssignedIds: string[] = [];
  if (isTutor && homework && userId) {
    const svc = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const [studs, { data: assigns }] = await Promise.all([
      getTutorStudents(userId),
      svc.from("homework_assignments").select("student_id").eq("homework_id", homework.id),
    ]);
    tutorStudents = studs;
    alreadyAssignedIds = (assigns || []).map((a) => a.student_id);
  }

  return (
    <PublicShell>
    <div className="min-h-screen bg-gray-50">
      <GuestCTA />
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-2.5 text-sm">
          <Link href="/library" className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Materials
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
              {isTutor ? "Tutor view" : "Student view"}
            </span>
            <ShareButton title={found.lesson.title} />
            {isTutor ? (
              <Link
                href={`/tutor/sessions/new?lesson=${encodeURIComponent(slug)}`}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-white hover:bg-secondary-600"
              >
                <Video className="h-3.5 w-3.5" /> Teach live
              </Link>
            ) : (
              <Link
                href="/how-it-works#students"
                className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700"
              >
                <GraduationCap className="h-3.5 w-3.5" /> Learn with a tutor
              </Link>
            )}
          </div>
        </div>
      </div>
      <LessonRenderer lesson={found.lesson} initialView={view} lockedView={view} />

      {/* Tutor: send this lesson's homework to students. */}
      {isTutor && homework ? (
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

      {/* Anyone this homework was assigned to — including a tutor or admin who
          is also somebody's student — gets the panel to complete it. */}
      {homework && assignment ? (
        <div className="pb-16">
          <HomeworkPanel
            homework={homework}
            submission={submission}
            isLoggedIn={!!userId}
            loginHref={`/login?next=${encodeURIComponent(`/library/lesson/${slug}#homework`)}`}
          />
        </div>
      ) : null}
    </div>
    </PublicShell>
  );
}
