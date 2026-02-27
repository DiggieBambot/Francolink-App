// src/app/(student)/learn/[language]/[level]/[lesson]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LessonFlow from "@/components/learning/lesson-flow";
import { checkLessonAccess } from "@/lib/utils/lesson-limits";
import { UpgradeModal } from "@/components/ui/upgrade-modal";
import type { CEFRLevel } from "@/lib/config/subscription";

interface PageProps {
  params: Promise<{
    language: string;
    level: string;
    lesson: string;
  }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { language, level, lesson: lessonSlug } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch lesson with exercises
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(
      `
      id,
      title,
      slug,
      description,
      lesson_type,
      content,
      estimated_minutes,
      xp_reward,
      order_index,
      is_premium,
      unit:units (
        id,
        title,
        order_index,
        is_premium,
        course:courses (
          id,
          title,
          slug
        )
      ),
      exercises (
        id,
        exercise_type,
        difficulty,
        question,
        content,
        explanation,
        hint,
        xp_reward,
        order_index,
        is_active
      )
    `
    )
    .eq("slug", lessonSlug)
    .single();

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Lesson Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The lesson you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href={`/learn/${language}/${level}`}
            className="text-primary hover:underline"
          >
            ← Back to Course
          </Link>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ██  ACCESS GATE  █████████████████████████████████████████████
  // ═══════════════════════════════════════════════════════════════
  const unit = lesson.unit as any;
  const access = await checkLessonAccess(supabase, user.id, {
    isLessonPremium: lesson.is_premium ?? false,
    isUnitPremium: unit?.is_premium ?? false,
    unitOrder: unit?.order_index ?? 1,
    courseLevel: level.toUpperCase() as CEFRLevel,
  });

  if (!access.allowed) {
    return (
      <UpgradeModal
        reason={access.reason!}
        message={access.message}
        fullPage
      />
    );
  }
  // ═══════════════════════════════════════════════════════════════

  // Sort exercises by order_index and filter active ones
  const exercises = [...(lesson.exercises || [])]
    .filter((e) => e.is_active)
    .sort((a, b) => a.order_index - b.order_index);

  // Get user's existing progress for this lesson
  const { data: existingProgress } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("lesson_id", lesson.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/learn/${language}/${level}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 truncate">
                {(lesson.unit as any)?.title}
              </p>
              <h1 className="font-bold text-gray-900 truncate">
                {lesson.title}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Lesson Content */}
      <LessonFlow
        lesson={lesson}
        exercises={exercises}
        userId={user.id}
        language={language}
        level={level}
        existingProgress={existingProgress}
      />
    </div>
  );
}
