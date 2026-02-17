import { createClient } from "@/lib/supabase/server";
import { Flame, Zap, BookOpen, Trophy } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ContinueLearning } from "@/components/dashboard/continue-learning";
import { DailyGoal } from "@/components/dashboard/daily-goal";
import { CourseCard } from "@/components/dashboard/course-card";
import { formatNumber } from "@/lib/utils";

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

  // Get enrollments with course data
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

  // Calculate stats (placeholder values for now)
  const stats = {
    streak: profile?.current_streak || 0,
    totalXp: profile?.total_xp || 0,
    lessonsCompleted: 0,
    wordsLearned: 0,
  };

  // Placeholder courses if no enrollments
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Current Streak"
          value={stats.streak}
          subtitle="days"
          icon={Flame}
          iconColor="text-streak"
          iconBgColor="bg-orange-100"
        />
        <StatsCard
          title="Total XP"
          value={formatNumber(stats.totalXp)}
          subtitle="points"
          icon={Zap}
          iconColor="text-xp"
          iconBgColor="bg-yellow-100"
        />
        <StatsCard
          title="Lessons Done"
          value={stats.lessonsCompleted}
          subtitle="completed"
          icon={BookOpen}
          iconColor="text-primary"
          iconBgColor="bg-primary-100"
        />
        <StatsCard
          title="Words Learned"
          value={stats.wordsLearned}
          subtitle="vocabulary"
          icon={Trophy}
          iconColor="text-premium"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning */}
          <ContinueLearning />

          {/* Your Courses */}
          <div>
            <h2 className="text-lg font-heading font-bold text-primary mb-4">
              Your Courses
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <CourseCard key={course.id} {...course} />
              ))}

              {/* Add New Course Card */}
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

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Daily Goal */}
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
              <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                <span className="text-2xl">📝</span>
                <span className="font-medium text-gray-700">Practice Vocabulary</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                <span className="text-2xl">🎯</span>
                <span className="font-medium text-gray-700">Take a Quiz</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                <span className="text-2xl">💬</span>
                <span className="font-medium text-gray-700">AI Conversation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}