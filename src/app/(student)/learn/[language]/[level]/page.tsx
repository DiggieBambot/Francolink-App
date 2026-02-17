// src/app/(student)/learn/[language]/[level]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Lock, Play, BookOpen, Clock, Trophy, Crown } from "lucide-react";
import { getLessonUsage } from "@/lib/utils/lesson-limits";
import { isPaidPlan, canAccessLevel, type CEFRLevel } from "@/lib/config/subscription";
import { DailyLessonLimit } from "@/components/dashboard/daily-lesson-limit";

interface PageProps {
  params: Promise<{
    language: string;
    level: string;
  }>;
}

export default async function CoursePage({ params }: PageProps) {
  const { language, level } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch course with units and lessons (including is_premium)
  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      slug,
      description,
      level,
      estimated_hours,
      total_lessons,
      image_url,
      units (
        id,
        title,
        description,
        order_index,
        is_premium,
        lessons (
          id,
          title,
          slug,
          description,
          lesson_type,
          estimated_minutes,
          xp_reward,
          order_index,
          is_premium
        )
      )
    `)
    .eq("slug", `${language}-${level}`)
    .single();

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-4">The course you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/learn" className="text-primary hover:underline">
            ← Back to Languages
          </Link>
        </div>
      </div>
    );
  }

  // Fetch user's lesson progress
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, status, score")
    .eq("user_id", user.id);

  const completedLessons = new Set(
    progress?.filter(p => p.status === "COMPLETED").map(p => p.lesson_id) || []
  );

  // ═══════════════════════════════════════════════════════════════
  // ██  FETCH LESSON USAGE & PLAN INFO  ███████████████████████████
  // ═══════════════════════════════════════════════════════════════
  const usage = await getLessonUsage(supabase, user.id);
  const cefrLevel = level.toUpperCase() as CEFRLevel;
  const userPlan = usage.plan;
  const levelAccessible = canAccessLevel(userPlan, cefrLevel);
  const userIsPaid = isPaidPlan(userPlan);
  // ═══════════════════════════════════════════════════════════════

  // Sort units and lessons by order_index
  const sortedUnits = [...(course.units || [])].sort((a, b) => a.order_index - b.order_index);
  sortedUnits.forEach(unit => {
    unit.lessons = [...(unit.lessons || [])].sort((a, b) => a.order_index - b.order_index);
  });

  // Calculate which lessons are unlocked (progression-based)
  const unlockedLessons = new Set<string>();
  let previousCompleted = true;

  sortedUnits.forEach(unit => {
    unit.lessons.forEach((lesson, index) => {
      if (index === 0 && previousCompleted) {
        unlockedLessons.add(lesson.id);
      } else if (completedLessons.has(unit.lessons[index - 1]?.id)) {
        unlockedLessons.add(lesson.id);
      } else if (completedLessons.has(lesson.id)) {
        unlockedLessons.add(lesson.id);
      }
      
      if (unit.order_index === 1 && index === 0) {
        unlockedLessons.add(lesson.id);
      }
    });
    
    const allCompleted = unit.lessons.every(l => completedLessons.has(l.id));
    previousCompleted = allCompleted;
  });

  // Calculate progress
  const totalLessons = sortedUnits.reduce((acc, u) => acc + u.lessons.length, 0);
  const completedCount = sortedUnits.reduce(
    (acc, u) => acc + u.lessons.filter(l => completedLessons.has(l.id)).length, 
    0
  );
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link 
            href="/learn" 
            className="text-white/80 hover:text-white text-sm mb-4 inline-block"
          >
            ← Back to Languages
          </Link>
          
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center text-4xl">
              🇫🇷
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded">
                  {course.level}
                </span>
                {/* Show if level is locked for free users */}
                {!levelAccessible && (
                  <span className="bg-amber-500/20 text-amber-200 text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Premium Level
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2">
                {course.title}
              </h1>
              <p className="text-white/80 text-sm md:text-base">
                {course.description}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>{completedCount} of {totalLessons} lessons completed</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{totalLessons} lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{course.estimated_hours} hours</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>{sortedUnits.length} units</span>
            </div>
          </div>
        </div>
      </div>

      {/* Units & Lessons */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ██  DAILY LESSON LIMIT WIDGET  ████████████████████████████ */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {usage.isLimited && (
          <div className="mb-6">
            <DailyLessonLimit usage={usage} />
          </div>
        )}
        {/* ═══════════════════════════════════════════════════════════ */}

        <div className="space-y-6">
          {sortedUnits.map((unit, unitIndex) => {
            const unitLessonsCompleted = unit.lessons.filter(l => completedLessons.has(l.id)).length;
            const unitProgress = unit.lessons.length > 0 
              ? Math.round((unitLessonsCompleted / unit.lessons.length) * 100) 
              : 0;

            return (
              <div key={unit.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Unit Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                      unitProgress === 100 
                        ? "bg-green-100 text-green-600" 
                        : "bg-primary/10 text-primary"
                    }`}>
                      {unitProgress === 100 ? <CheckCircle className="w-6 h-6" /> : unitIndex + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">{unit.title}</h2>
                        {/* Unit premium badge */}
                        {unit.is_premium && !userIsPaid && (
                          <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{unit.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {unitLessonsCompleted}/{unit.lessons.length}
                      </div>
                      <div className="text-xs text-gray-500">lessons</div>
                    </div>
                  </div>
                  
                  {/* Unit Progress Bar */}
                  <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        unitProgress === 100 ? "bg-green-500" : "bg-primary"
                      }`}
                      style={{ width: `${unitProgress}%` }}
                    />
                  </div>
                </div>

                {/* Lessons */}
                <div className="divide-y divide-gray-50">
                  {unit.lessons.map((lesson, lessonIndex) => {
                    const isCompleted = completedLessons.has(lesson.id);
                    const isProgressUnlocked = unlockedLessons.has(lesson.id);
                    
                    // ═══════════════════════════════════════════════════
                    // ██  PREMIUM LOCK LOGIC  ███████████████████████████
                    // ═══════════════════════════════════════════════════
                    const isPremiumLocked = 
                      !levelAccessible ||                           // Level locked (C1/C2 for free)
                      (lesson.is_premium && !userIsPaid) ||         // Lesson is premium
                      (unit.is_premium && !userIsPaid);             // Unit is premium
                    
                    // Lesson is only truly unlocked if both progression AND premium checks pass
                    const isUnlocked = isProgressUnlocked && !isPremiumLocked;
                    const isNext = isUnlocked && !isCompleted;
                    // ═══════════════════════════════════════════════════

                    return (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        lessonNumber={lessonIndex + 1}
                        isCompleted={isCompleted}
                        isUnlocked={isUnlocked}
                        isNext={isNext}
                        isPremiumLocked={isPremiumLocked}
                        language={language}
                        level={level}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Lesson Row Component
function LessonRow({ 
  lesson, 
  lessonNumber, 
  isCompleted, 
  isUnlocked,
  isNext,
  isPremiumLocked,
  language,
  level
}: { 
  lesson: any;
  lessonNumber: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  isNext: boolean;
  isPremiumLocked: boolean;
  language: string;
  level: string;
}) {
  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case "VOCABULARY": return "📚";
      case "GRAMMAR": return "📝";
      case "REVIEW": return "🔄";
      case "CONVERSATION": return "💬";
      default: return "📖";
    }
  };

  const content = (
    <div className={`flex items-center gap-4 p-4 transition-colors ${
      isUnlocked ? "hover:bg-gray-50" : "opacity-60"
    }`}>
      {/* Status Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isCompleted 
          ? "bg-green-100 text-green-600" 
          : isNext
            ? "bg-secondary text-white"
            : isUnlocked
              ? "bg-primary/10 text-primary"
              : isPremiumLocked
                ? "bg-amber-100 text-amber-600"
                : "bg-gray-100 text-gray-400"
      }`}>
        {isCompleted ? (
          <CheckCircle className="w-5 h-5" />
        ) : isPremiumLocked ? (
          <Crown className="w-4 h-4" />
        ) : isUnlocked ? (
          <Play className="w-5 h-5" fill={isNext ? "currentColor" : "none"} />
        ) : (
          <Lock className="w-4 h-4" />
        )}
      </div>

      {/* Lesson Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getLessonTypeIcon(lesson.lesson_type)}</span>
          <h3 className={`font-medium truncate ${
            isUnlocked ? "text-gray-900" : "text-gray-400"
          }`}>
            {lesson.title}
          </h3>
          {/* Premium badge on lesson */}
          {isPremiumLocked && (
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Lock className="w-3 h-3" />
              Premium
            </span>
          )}
        </div>
        <p className={`text-sm truncate ${
          isUnlocked ? "text-gray-500" : "text-gray-400"
        }`}>
          {lesson.description}
        </p>
      </div>

      {/* Lesson Meta */}
      <div className="flex items-center gap-4 text-sm">
        <div className={`flex items-center gap-1 ${
          isUnlocked ? "text-gray-500" : "text-gray-400"
        }`}>
          <Clock className="w-4 h-4" />
          <span>{lesson.estimated_minutes}m</span>
        </div>
        <div className={`flex items-center gap-1 ${
          isCompleted ? "text-green-600" : isUnlocked ? "text-secondary" : "text-gray-400"
        }`}>
          <Trophy className="w-4 h-4" />
          <span>+{lesson.xp_reward} XP</span>
        </div>
      </div>

      {/* Next indicator */}
      {isNext && (
        <span className="bg-secondary text-white text-xs font-medium px-2 py-1 rounded-full">
          Next
        </span>
      )}
    </div>
  );

  if (isUnlocked) {
    return (
      <Link href={`/learn/${language}/${level}/${lesson.slug}`}>
        {content}
      </Link>
    );
  }

  return content;
}