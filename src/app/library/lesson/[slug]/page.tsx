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
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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

  return (
    <PublicShell>
    <div className="min-h-screen bg-slate-50">
      <GuestCTA />
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-2 text-sm">
          <Link href="/library" className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Materials
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {isTutor ? "Tutor view" : "Student view"}
            </span>
            <ShareButton title={found.lesson.title} />
            {isTutor ? (
              <Link
                href={`/tutor/sessions/new?lesson=${encodeURIComponent(slug)}`}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <Video className="h-3.5 w-3.5" /> Teach live
              </Link>
            ) : (
              <Link
                href="/how-it-works#students"
                className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <GraduationCap className="h-3.5 w-3.5" /> Learn with a tutor
              </Link>
            )}
          </div>
        </div>
      </div>
      <LessonRenderer lesson={found.lesson} initialView={view} lockedView={view} />
    </div>
    </PublicShell>
  );
}
