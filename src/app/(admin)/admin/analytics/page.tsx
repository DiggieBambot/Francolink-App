// src/app/(admin)/admin/analytics/page.tsx

import { createClient } from "@/lib/supabase/server";
import {
  Users,
  BookOpen,
  Flame,
  Zap,
  TrendingUp,
  Calendar,
  Target,
  Award,
} from "lucide-react";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  // Get user stats
  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  // Get users by plan
  const { data: usersByPlan } = await supabase
    .from("users")
    .select("subscription_plan");

  const planCounts = { FREE: 0, PREMIUM: 0, PREMIUM_PLUS: 0 };
  usersByPlan?.forEach((u) => {
    const plan = (u.subscription_plan || "FREE") as keyof typeof planCounts;
    if (plan in planCounts) planCounts[plan]++;
  });

  // Get lesson completion stats
  const { count: totalCompletedLessons } = await supabase
    .from("lesson_progress")
    .select("*", { count: "exact", head: true })
    .eq("status", "COMPLETED");

  // Get total XP earned
  const { data: xpData } = await supabase
    .from("users")
    .select("total_xp");
  
  const totalXP = xpData?.reduce((sum, u) => sum + (u.total_xp || 0), 0) || 0;

  // Get active streaks (users with streak > 0)
  const { count: activeStreaks } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gt("current_streak", 0);

  // Get users who completed placement test
  const { count: placementTestsTaken } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("placement_test_taken", true);

  // Get placement test level distribution
  const { data: levelDistribution } = await supabase
    .from("users")
    .select("placement_test_level")
    .eq("placement_test_taken", true);

  const levelCounts: Record<string, number> = {};
  levelDistribution?.forEach((u) => {
    const level = u.placement_test_level || "Unknown";
    levelCounts[level] = (levelCounts[level] || 0) + 1;
  });

  // Get content stats
  const { count: totalCourses } = await supabase
    .from("courses")
    .select("*", { count: "exact", head: true });

  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true });

  const { count: totalExercises } = await supabase
    .from("exercises")
    .select("*", { count: "exact", head: true });

  // Get recent signups (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: recentSignups } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString());

  // Get daily goal stats
  const { data: goalData } = await supabase
    .from("users")
    .select("daily_goal_minutes");

  const goalDistribution: Record<number, number> = {};
  goalData?.forEach((u) => {
    const goal = u.daily_goal_minutes || 15;
    goalDistribution[goal] = (goalDistribution[goal] || 0) + 1;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">
          Overview of your platform performance
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers || 0}</p>
              <p className="text-xs text-green-600 mt-1">
                +{recentSignups || 0} this week
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Lessons Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totalCompletedLessons || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total XP Earned</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totalXP)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Flame className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Streaks</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeStreaks || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Distribution by Plan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            Users by Plan
          </h2>
          <div className="space-y-4">
            {Object.entries(planCounts).map(([plan, count]) => {
              const percentage = totalUsers ? Math.round((count / totalUsers) * 100) : 0;
              const colors: Record<string, string> = {
                FREE: "bg-gray-500",
                PREMIUM: "bg-indigo-500",
                PREMIUM_PLUS: "bg-purple-500",
              };
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {plan === "PREMIUM_PLUS" ? "Premium+" : plan.charAt(0) + plan.slice(1).toLowerCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[plan] || "bg-gray-500"} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Placement Test Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-gray-500" />
            Placement Test Results
          </h2>
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              {placementTestsTaken || 0} of {totalUsers || 0} users have taken the test
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => {
              const count = levelCounts[level] || 0;
              return (
                <div
                  key={level}
                  className="text-center p-3 bg-gray-50 rounded-lg"
                >
                  <p className="text-xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-500">{level}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Stats & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-500" />
            Content Overview
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary-50 rounded-xl">
              <p className="text-2xl font-bold text-primary">{totalCourses || 0}</p>
              <p className="text-sm text-gray-600">Courses</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{totalLessons || 0}</p>
              <p className="text-sm text-gray-600">Lessons</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">{totalExercises || 0}</p>
              <p className="text-sm text-gray-600">Exercises</p>
            </div>
          </div>
        </div>

        {/* Daily Goal Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-gray-500" />
            Daily Goal Preferences
          </h2>
          <div className="space-y-3">
            {[5, 10, 15, 30].map((goal) => {
              const count = goalDistribution[goal] || 0;
              const percentage = totalUsers ? Math.round((count / totalUsers) * 100) : 0;
              return (
                <div key={goal} className="flex items-center gap-4">
                  <span className="w-20 text-sm text-gray-600">{goal} min</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-gray-500 text-right">
                    {count} users
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}