// src/app/(student)/learn/[language]/[level]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Lock, Play, BookOpen, Clock, Trophy, Crown } from "lucide-react";
import { getLessonUsage } from "@/lib/utils/lesson-limits";
import { isPaidPlan, canAccessLevel, type CEFRLevel } from "@/lib/config/subscription";
import { DailyLessonLimit } from "@/components/dashboard/daily-lesson-limit";
import { CertificateBanner } from "@/components/learning/certificate-banner";
import { getLevelTheme } from "@/lib/level-colors";
import { LevelBadge } from "@/components/ui/LevelBadge";

// Language configuration
const languageConfig: Record<string, { name: string; flag: string; slug: string }> = {
  fr: { name: "French", flag: "🇫🇷", slug: "french" },
  french: { name: "French", flag: "🇫🇷", slug: "french" },
  es: { name: "Spanish", flag: "🇪🇸", slug: "spanish" },
  spanish: { name: "Spanish", flag: "🇪🇸", slug: "spanish" },
  en: { name: "English", flag: "🇬🇧", slug: "english" },
  english: { name: "English", flag: "🇬🇧", slug: "english" },
  de: { name: "German", flag: "🇩🇪", slug: "german" },
  german: { name: "German", flag: "🇩🇪", slug: "german" },
};

interface PageProps {
  params: Promise<{
    language: string;
    level: string;
  }>;
}

export default async function CoursePage({ params }: PageProps) {
  const { language, level } = await params;
  const supabase = await createClient();

  const langInfo = languageConfig[language.toLowerCase()] || { name: "Language", flag: "🌍", slug: language.toLowerCase() };
  const courseSlug = `${langInfo.slug}-${level}`;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
    .eq("slug", courseSlug)
    .single();

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-4">
            The {langInfo.name} {level.toUpperCase()} course doesn&apos;t exist yet.
          </p>
          <Link href="/learn" className="text-primary hover:underline">
            ← Back to Languages
          </Link>
        </div>
      </div>
    );
  }

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, status, score")
    .eq("user_id", user.id);

  const completedLessons = new Set(
    progress?.filter(p => p.status === "COMPLETED").map(p => p.lesson_id) || []
  );

  const usage = await getLessonUsage(supabase, user.id);
  const cefrLevel = level.toUpperCase() as CEFRLevel;
  const userPlan = usage.plan;
  const levelAccessible = canAccessLevel(userPlan, cefrLevel);
  const userIsPaid = isPaidPlan(userPlan);

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isTester =
    userProfile?.role?.toUpperCase() === "ADMIN" ||
    userProfile?.role?.toUpperCase() === "TESTER";

  const sortedUnits = [...(course.units || [])].sort((a, b) => a.order_index - b.order_index);
  sortedUnits.forEach(unit => {
    unit.lessons = [...(unit.lessons || [])].sort((a, b) => a.order_index - b.order_index);
  });

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

  const totalLessons = sortedUnits.reduce((acc, u) => acc + u.lessons.length, 0);
  const completedCount = sortedUnits.reduce(
    (acc, u) => acc + u.lessons.filter(l => completedLessons.has(l.id)).length,
    0
  );
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const unitData = sortedUnits.map((unit, unitIndex) => {
    const unitLessonsCompleted = unit.lessons.filter(l => completedLessons.has(l.id)).length;
    const unitProgress = unit.lessons.length > 0
      ? Math.round((unitLessonsCompleted / unit.lessons.length) * 100)
      : 0;
    const isUnitComplete = unitProgress === 100;

    const lessonsData = unit.lessons.map((lesson, lessonIndex) => {
      const isCompleted = completedLessons.has(lesson.id);

      if (isTester) {
        return {
          ...lesson,
          lessonNumber: lessonIndex + 1,
          isCompleted,
          isUnlocked: true,
          isNext: !isCompleted,
          isPremiumLocked: false,
        };
      }

      const isProgressUnlocked = unlockedLessons.has(lesson.id);
      const isPremiumLocked =
        !levelAccessible ||
        (lesson.is_premium && !userIsPaid) ||
        (unit.is_premium && !userIsPaid);
      const isUnlocked = isProgressUnlocked && !isPremiumLocked;
      const isNext = isUnlocked && !isCompleted;

      return {
        ...lesson,
        lessonNumber: lessonIndex + 1,
        isCompleted,
        isUnlocked,
        isNext,
        isPremiumLocked,
      };
    });

    return {
      ...unit,
      unitIndex,
      unitLessonsCompleted,
      unitProgress,
      isUnitComplete,
      lessonsData,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header — level-colored */}
      {(() => {
        const levelTheme = getLevelTheme(course.level);
        return (
          <div className="relative overflow-hidden"
            style={{ background: levelTheme.gradient, borderBottom: `2px solid ${levelTheme.border}` }}>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background: `linear-gradient(90deg, transparent, ${levelTheme.color}, transparent)` }} />
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${levelTheme.color} 1px, transparent 0)`, backgroundSize: "28px 28px" }} />
            <div className="relative max-w-4xl mx-auto px-4 py-8">
              <Link href="/learn" className="text-sm mb-5 inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: `${levelTheme.text}99` }}>
                ← Back to Languages
              </Link>
              <div className="flex items-start gap-5">
                {/* Flag + level orb */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl"
                    style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${levelTheme.border}` }}>
                    {langInfo.flag}
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm"
                    style={{ background: levelTheme.badge, color: levelTheme.badgeText, boxShadow: levelTheme.glow }}>
                    {course.level}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <LevelBadge level={course.level} size="md" showLabel />
                    {!levelAccessible && !isTester && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1"
                        style={{ background: "rgba(245,158,11,0.2)", color: "#FCD34D" }}>
                        <Crown className="w-3 h-3" /> Premium Level
                      </span>
                    )}
                    {isTester && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded"
                        style={{ background: "rgba(110,231,183,0.2)", color: "#6EE7B7" }}>
                        Tester Mode 🧪
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "#F8FAFF" }}>
                    {course.title}
                  </h1>
                  <p className="text-sm md:text-base leading-relaxed" style={{ color: `${levelTheme.text}99` }}>
                    {course.description}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span style={{ color: `${levelTheme.text}99` }}>{completedCount} of {totalLessons} lessons completed</span>
                  <span className="font-semibold" style={{ color: levelTheme.text }}>{progressPercent}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, ${levelTheme.colorDark}, ${levelTheme.color})`, boxShadow: progressPercent > 0 ? `0 0 12px ${levelTheme.color}80` : "none" }} />
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-5 text-sm" style={{ color: `${levelTheme.text}80` }}>
                <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" /><span>{totalLessons} lessons</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>{course.estimated_hours} hours</span></div>
                <div className="flex items-center gap-2"><Trophy className="w-4 h-4" /><span>{sortedUnits.length} units</span></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Units & Lessons */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {usage.isLimited && (
          <div className="mb-6">
            <DailyLessonLimit usage={usage} />
          </div>
        )}

        {/* ── Certificate Banner — visible only when level is 100% complete ── */}
        <CertificateBanner
          language={language}
          level={level.toUpperCase()}
          progressPercent={progressPercent}
        />

        <div className="space-y-6">
          {unitData.map((unit) => (
            <div key={unit.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Unit Header — level-colored */}
              {(() => {
                const ut = getLevelTheme(course.level);
                return (
                  <div className="p-6 border-b border-gray-100"
                    style={{ background: unit.isUnitComplete ? `${ut.color}08` : "white" }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0"
                        style={unit.isUnitComplete
                          ? { background: ut.gradient, color: ut.text, border: `1px solid ${ut.border}`, boxShadow: ut.glow }
                          : { background: `${ut.color}18`, color: ut.colorDark, border: `1px solid ${ut.border}` }}>
                        {unit.isUnitComplete ? <CheckCircle className="w-6 h-6" /> : unit.unitIndex + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg font-bold text-gray-900">{unit.title}</h2>
                          {unit.isUnitComplete && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${ut.color}20`, color: ut.colorDark }}>✓ Complete</span>
                          )}
                          {unit.is_premium && !userIsPaid && !isTester && (
                            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Crown className="w-3 h-3" />Premium
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{unit.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium" style={{ color: ut.colorDark }}>
                          {unit.unitLessonsCompleted}/{unit.lessonsData.length}
                        </div>
                        <div className="text-xs text-gray-500">lessons</div>
                      </div>
                    </div>
                    {/* Unit progress bar */}
                    <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${unit.unitProgress}%`, background: unit.isUnitComplete ? `linear-gradient(90deg,${ut.colorDark},${ut.color})` : ut.color, boxShadow: unit.unitProgress > 0 ? `0 0 8px ${ut.color}60` : "none" }} />
                    </div>
                  </div>
                );
              })()}

              {/* Lessons */}
              <div className="divide-y divide-gray-50">
                {unit.lessonsData.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    lessonNumber={lesson.lessonNumber}
                    isCompleted={lesson.isCompleted}
                    isUnlocked={lesson.isUnlocked}
                    isNext={lesson.isNext}
                    isPremiumLocked={lesson.isPremiumLocked}
                    language={language}
                    level={level}
                  />
                ))}
              </div>
            </div>
          ))}
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
  const lt = getLevelTheme(level);

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case "VOCABULARY": return "📚";
      case "GRAMMAR": return "📝";
      case "REVIEW": return "🔄";
      case "CONVERSATION": return "💬";
      case "CULTURE": return "🏛️";
      case "LISTENING": return "🎧";
      case "SPEAKING": return "🗣️";
      case "READING": return "📖";
      default: return "📖";
    }
  };

  const titleClass = isUnlocked ? "font-medium truncate text-gray-900" : "font-medium truncate text-gray-400";
  const descClass = isUnlocked ? "text-sm truncate text-gray-500" : "text-sm truncate text-gray-400";
  const timeClass = isUnlocked ? "flex items-center gap-1 text-gray-500" : "flex items-center gap-1 text-gray-400";
  const rowClass = isUnlocked
    ? "flex items-center gap-4 p-4 transition-colors hover:bg-gray-50"
    : "flex items-center gap-4 p-4 transition-colors opacity-60";

  // Level-colored icon styles
  const iconStyle = isCompleted
    ? { background: "#DCFCE7", color: "#16A34A" }
    : isNext
      ? { background: lt.color, color: "#fff", boxShadow: lt.glow }
      : isUnlocked
        ? { background: lt.bgLight, color: lt.colorDark, border: `1px solid ${lt.border}` }
        : isPremiumLocked
          ? { background: "#FEF3C7", color: "#D97706" }
          : { background: "#F3F4F6", color: "#9CA3AF" };

  const content = (
    <div className={rowClass}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={iconStyle}>
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

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getLessonTypeIcon(lesson.lesson_type)}</span>
          <h3 className={titleClass}>{lesson.title}</h3>
          {isPremiumLocked && (
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Lock className="w-3 h-3" />Premium
            </span>
          )}
        </div>
        <p className={descClass}>{lesson.description}</p>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className={timeClass}>
          <Clock className="w-4 h-4" />
          <span>{lesson.estimated_minutes}m</span>
        </div>
        <div className={`flex items-center gap-1 ${isCompleted ? "text-green-600" : isUnlocked ? "" : "text-gray-400"}`}
          style={isUnlocked && !isCompleted ? { color: lt.colorDark } : {}}>
          <Trophy className="w-4 h-4" />
          <span>+{lesson.xp_reward} XP</span>
        </div>
      </div>

      {isNext && (
        <span className="text-white text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: lt.color, boxShadow: lt.glow }}>
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