// src/app/(student)/dashboard/page.tsx

import { createClient } from "@/lib/supabase/server";
import {
  Flame,
  Zap,
  BookOpen,
  TrendingUp,
  Brain,
  Users,
  Video,
  MessageSquare,
  ExternalLink,
  ArrowRight,
  Trophy,
  Target,
  Plus,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ContinueLearning } from "@/components/dashboard/continue-learning";
import { DailyGoal } from "@/components/dashboard/daily-goal";
import { CourseCard } from "@/components/dashboard/course-card";
import { StreakCard } from "@/components/dashboard/streak-card";
import { DailyLessonLimit } from "@/components/dashboard/daily-lesson-limit";
import { JoinTutorCode } from "@/components/dashboard/join-tutor-code";
import { formatNumber } from "@/lib/utils";
import { getLessonUsage } from "@/lib/utils/lesson-limits";
import Link from "next/link";

// Language display names and flags
const languageConfig: Record<string, { name: string; flag: string }> = {
  french: { name: "French", flag: "🇫🇷" },
  spanish: { name: "Spanish", flag: "🇪🇸" },
  english: { name: "English", flag: "🇬🇧" },
  german: { name: "German", flag: "🇩🇪" },
  fr: { name: "French", flag: "🇫🇷" },
  es: { name: "Spanish", flag: "🇪🇸" },
  en: { name: "English", flag: "🇬🇧" },
  de: { name: "German", flag: "🇩🇪" },
  french: { name: "French", flag: "🇫🇷" },
  spanish: { name: "Spanish", flag: "🇪🇸" },
  english: { name: "English", flag: "🇬🇧" },
  german: { name: "German", flag: "🇩🇪" },
};

function calculateCurrentLevel(completedLessons: any[]): string {
  if (!completedLessons || completedLessons.length === 0) return "A1";

  const levelOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];
  let highestLevel = "A1";

  for (const lesson of completedLessons) {
    const level = lesson.lessons?.units?.courses?.level;
    if (level && levelOrder.indexOf(level) > levelOrder.indexOf(highestLevel)) {
      highestLevel = level;
    }
  }

  return highestLevel;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user?.id)
    .single();

  // Get user's learning language (default to French for backwards compatibility)
  const userLanguage = profile?.learning_language || "fr";
  const languageInfo = languageConfig[userLanguage] || languageConfig.fr;

  let tutor = null;
  if (profile?.referred_by_tutor_id) {
    const { data: tutorData } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, tutor_plan")
      .eq("id", profile.referred_by_tutor_id)
      .single();
    tutor = tutorData;
  }

  const { data: completedLessons } = await supabase
    .from("lesson_progress")
    .select(
      `
      id,
      status,
      lessons:lesson_id (
        id,
        title,
        units:unit_id (
          courses:course_id (
            level
          )
        )
      )
    `
    )
    .eq("user_id", user?.id)
    .eq("status", "COMPLETED");

  const currentLevel = calculateCurrentLevel(completedLessons || []);
  const lessonsCompleted = completedLessons?.length || 0;

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `
      *,
      courses:course_id (
        id,
        title,
        slug,
        level,
        total_lessons,
        languages:language_id (
          name,
          flag_emoji
        )
      )
    `
    )
    .eq("user_id", user?.id);

  const usage = await getLessonUsage(supabase, user?.id || "");

  const stats = {
    streak: profile?.current_streak || 0,
    longestStreak: profile?.longest_streak || 0,
    lastActivityDate: profile?.last_activity_date || null,
    totalXp: profile?.total_xp || 0,
    lessonsCompleted: lessonsCompleted,
    currentLevel: profile?.placement_test_level || currentLevel,
  };

  // Dynamic placeholder course based on user's language
  const placeholderCourses = [
    {
      id: `${userLanguage}-a1`,
      title: `${languageInfo.name} Foundations`,
      flag: languageInfo.flag,
      level: "A1",
      progress: 0,
      totalLessons: 40,
      completedLessons: 0,
    },
  ];

  const courses =
    enrollments && enrollments.length > 0
      ? enrollments.map((e) => ({
          id: e.courses?.slug || "",
          title: e.courses?.title || "",
          flag: e.courses?.languages?.flag_emoji || "🌍",
          level: e.courses?.level || "A1",
          progress: 0,
          totalLessons: e.courses?.total_lessons || 0,
          completedLessons: 0,
        }))
      : placeholderCourses;

  const hasPlacementTest = profile?.placement_test_taken === true;
  const firstName = profile?.name?.split(" ")[0] || "Learner";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ============================================
          WELCOME HEADER
          ============================================ */}
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-primary">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Ready to continue your {languageInfo.name} journey?
        </p>
      </div>

      {/* ============================================
          TEACHER CARD
          ============================================ */}
      {tutor ? (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0 shadow-sm">
            {tutor.avatar_url ? (
              <img
                src={tutor.avatar_url}
                alt={tutor.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              tutor.name?.charAt(0)?.toUpperCase() || "T"
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
              My Teacher
            </p>
            <p className="font-heading font-bold text-primary truncate">
              {tutor.name || "Your Tutor"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link
              href="/student/sessions"
              className="p-2.5 bg-primary-50 text-primary rounded-xl hover:bg-primary-100 transition-colors"
              title="View Sessions"
            >
              <Video className="w-5 h-5" />
            </Link>
            <Link
              href="/messages"
              className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors"
              title="Message"
            >
              <MessageSquare className="w-5 h-5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-dashed border-gray-200 shadow-soft">
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700">
                No teacher assigned
              </p>
              <p className="text-xs text-gray-400">
                Ask your teacher for an invite link or join with a code
              </p>
            </div>
            <a
              href="https://www.francolink.net/teachers"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-800 transition-colors flex-shrink-0 shadow-sm"
            >
              <span>Book a Tutor</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <JoinTutorCode userId={user?.id} />
        </div>
      )}

      {/* ============================================
          PLACEMENT TEST BANNER
          ============================================ */}
      {!hasPlacementTest && (
        <Link
          href={`/placement-test?lang=${userLanguage}`}
          className="group block bg-gradient-to-r from-primary via-primary to-primary-800 rounded-2xl p-5 hover:shadow-medium transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <span className="text-2xl">{languageInfo.flag}</span>
            </div>
            <div className="flex-1">
              <div className="font-heading font-bold text-white">
                Take the {languageInfo.name} Placement Test
              </div>
              <div className="text-sm text-white/70">
                Find your level in 5–10 minutes
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      )}

      {/* ============================================
          STATS GRID
          ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Current Streak"
          value={stats.streak}
          subtitle="days"
          icon={Flame}
          iconColor="text-orange-500"
          iconBgColor="bg-orange-50"
        />
        <StatsCard
          title="Total XP"
          value={formatNumber(stats.totalXp)}
          subtitle="points"
          icon={Zap}
          iconColor="text-secondary"
          iconBgColor="bg-secondary-50"
        />
        <StatsCard
          title="Lessons Done"
          value={stats.lessonsCompleted}
          subtitle="completed"
          icon={BookOpen}
          iconColor="text-primary"
          iconBgColor="bg-primary-50"
        />
        <StatsCard
          title="Current Level"
          value={stats.currentLevel}
          subtitle="progress"
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
      </div>

      {/* ============================================
          MAIN CONTENT GRID
          ============================================ */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning */}
          <ContinueLearning 
          userLanguage={userLanguage}
          userLevel={profile?.placement_test_level?.toLowerCase() || "a1"}
          />

          {/* Your Courses */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-bold text-primary">
                Your Courses
              </h2>
              <Link
                href="/learn"
                className="text-sm font-semibold text-secondary hover:text-secondary-700 transition-colors flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {courses.map((course) => (
                <CourseCard key={course.id} {...course} />
              ))}

              <button className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-soft border-2 border-dashed border-gray-200 p-6 hover:border-secondary hover:bg-secondary-50/50 transition-all cursor-pointer min-h-[160px] group">
                <div className="w-12 h-12 bg-gray-100 group-hover:bg-secondary-100 rounded-full flex items-center justify-center mb-3 transition-colors">
                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-secondary transition-colors" />
                </div>
                <span className="font-heading font-semibold text-gray-500 group-hover:text-secondary transition-colors">
                  Add New Language
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column — 1/3 */}
        <div className="space-y-6">
          <DailyLessonLimit usage={usage} />

          <StreakCard
            currentStreak={stats.streak}
            longestStreak={stats.longestStreak}
            lastActivityDate={stats.lastActivityDate}
          />

          <DailyGoal
            targetMinutes={profile?.daily_goal_minutes || 15}
            completedMinutes={0}
          />

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
            <h2 className="text-lg font-heading font-bold text-primary mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                {
                  href: `/learn/${userLanguage}/${stats.currentLevel.toLowerCase()}`,
                  icon: languageInfo.flag,
                  label: `Continue ${languageInfo.name}`,
                  bg: "bg-primary-50 hover:bg-primary-100",
                },
                {
                  href: "/student/practice",
                  icon: "📝",
                  label: "Practice Vocabulary",
                  bg: "bg-gray-50 hover:bg-gray-100",
                },
                {
                  href: "/student/leaderboard",
                  icon: "🏆",
                  label: "Leaderboard",
                  bg: "bg-gray-50 hover:bg-gray-100",
                },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${action.bg}`}
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="font-medium text-gray-700 text-sm">
                    {action.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}