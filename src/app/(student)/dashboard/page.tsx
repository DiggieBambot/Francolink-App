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
  ExternalLink
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

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user?.id)
    .single();

  // Fetch tutor information if student is linked to a tutor
  let tutor = null;
  if (profile?.referred_by_tutor_id) {
    const { data: tutorData } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, tutor_plan")
      .eq("id", profile.referred_by_tutor_id)
      .single();
    tutor = tutorData;
  }

  // Get completed lessons
  const { data: completedLessons } = await supabase
    .from("lesson_progress")
    .select(`
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
    `)
    .eq("user_id", user?.id)
    .eq("status", "COMPLETED");

  const currentLevel = calculateCurrentLevel(completedLessons || []);
  const lessonsCompleted = completedLessons?.length || 0;

  // Get enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
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
    `)
    .eq("user_id", user?.id);

  const usage = await getLessonUsage(supabase, user?.id || "");

  const stats = {
    streak: profile?.current_streak || 0,
    longestStreak: profile?.longest_streak || 0,
    lastActivityDate: profile?.last_activity_date || null,
    totalXp: profile?.total_xp || 0,
    lessonsCompleted: lessonsCompleted,
    currentLevel: currentLevel,
  };

  const placeholderCourses = [
    {
      id: "french-a1",
      title: "French Foundations",
      flag: "🇫🇷",
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

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary">
          Welcome back, {profile?.name?.split(" ")[0] || "Learner"}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Ready to continue your language journey?
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ██  MY TEACHER CARD  ██████████████████████████████████████████ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {tutor ? (
        <div className="bg-white rounded-xl shadow-soft p-4 flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
            {tutor.avatar_url ? (
              <img src={tutor.avatar_url} alt={tutor.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              tutor.name?.charAt(0)?.toUpperCase() || 'T'
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">My Teacher</p>
            <p className="font-semibold text-gray-900 truncate">{tutor.name || 'Your Tutor'}</p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Link 
              href="/student/sessions"
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              title="View Sessions"
            >
              <Video className="w-5 h-5" />
            </Link>
            <Link 
              href="/messages"
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Message"
            >
              <MessageSquare className="w-5 h-5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* No teacher message */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 border border-dashed border-gray-200">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700">No teacher assigned</p>
              <p className="text-xs text-gray-500">Ask your teacher for an invite link or join with a code</p>
            </div>
            {/* Browse tutors button */}
            <a 
              href="https://www.francolink.net/teachers"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
            >
              <span>Book a Tutor</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Join with code component */}
          <JoinTutorCode userId={user?.id} />
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* Placement Test Banner */}
      {!hasPlacementTest && (
        <Link 
          href="/placement-test"
          className="block p-4 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:opacity-90 transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="font-bold">Take the Placement Test</div>
              <div className="text-sm text-white/80">Find your French level in 5-10 minutes</div>
            </div>
            <div className="text-white/80">→</div>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Current Streak"
          value={stats.streak}
          subtitle="days"
          icon={Flame}
          iconColor="text-orange-500"
          iconBgColor="bg-orange-100"
        />
        <StatsCard
          title="Total XP"
          value={formatNumber(stats.totalXp)}
          subtitle="points"
          icon={Zap}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-100"
        />
        <StatsCard
          title="Lessons Done"
          value={stats.lessonsCompleted}
          subtitle="completed"
          icon={BookOpen}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Current Level"
          value={stats.currentLevel}
          subtitle="progress"
          icon={TrendingUp}
          iconColor="text-green-500"
          iconBgColor="bg-green-100"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <ContinueLearning />

          <div>
            <h2 className="text-lg font-heading font-bold text-primary mb-4">
              Your Courses
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <CourseCard key={course.id} {...course} />
              ))}

              <button className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-soft p-6 border-2 border-dashed border-gray-200 hover:border-secondary hover:bg-secondary-50 transition-all cursor-pointer min-h-[160px]">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl">+</span>
                </div>
                <span className="font-heading font-semibold text-gray-600">
                  Add New Language
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
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
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h2 className="text-lg font-heading font-bold text-primary mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link 
                href={`/learn/french/${stats.currentLevel.toLowerCase()}`}
                className="w-full flex items-center gap-3 p-3 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
              >
                <span className="text-2xl">📚</span>
                <span className="font-medium text-gray-700">Continue Learning</span>
              </Link>
              <Link 
                href="/student/practice"
                className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">📝</span>
                <span className="font-medium text-gray-700">Practice Vocabulary</span>
              </Link>
              <Link 
                href="/student/leaderboard"
                className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">🏆</span>
                <span className="font-medium text-gray-700">Leaderboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}