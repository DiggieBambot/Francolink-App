// src/app/(student)/profile/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Flame,
  Zap,
  BookOpen,
  Trophy,
  TrendingUp,
  Award,
  Brain,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { langSlug, LANGUAGE_INFO } from "@/lib/utils/language";
import ProfileHeader from "@/components/profile/profile-header";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get user's learning language
  const userLanguage = profile?.learning_language || "fr";
  const langInfo = LANGUAGE_INFO[userLanguage] || LANGUAGE_INFO.fr;
  const userLanguageSlug = langSlug(userLanguage);

  // Get completed lessons count
  const { count: lessonsCompleted } = await supabase
    .from("lesson_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "COMPLETED");

  // Get user achievements
  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select(`
      *,
      achievements (
        id,
        name,
        description,
        icon,
        xp_reward
      )
    `)
    .eq("user_id", user.id);

  // Calculate account age
  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
  const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  // Stats
  const stats = {
    totalXp: profile?.total_xp || 0,
    currentStreak: profile?.current_streak || 0,
    longestStreak: profile?.longest_streak || 0,
    lessonsCompleted: lessonsCompleted || 0,
    placementLevel: profile?.placement_test_level || null,
    placementScore: profile?.placement_test_score || 0,
    accountAgeDays,
  };

  // Calculate level from XP
  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 100) + 1;
  };

  const currentLevel = calculateLevel(stats.totalXp);
  const xpProgress = stats.totalXp % 100;
  const xpProgressPercent = (xpProgress / 100) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header with Avatar Upload */}
      <ProfileHeader
        user={{
          id: user.id,
          email: user.email || "",
          name: profile?.name || null,
          avatar_url: profile?.avatar_url || null,
          created_at: profile?.created_at || new Date().toISOString(),
        }}
        currentLevel={currentLevel}
        xpProgress={xpProgress}
        xpProgressPercent={xpProgressPercent}
        accountAgeDays={accountAgeDays}
      />

      {/* Learning Language Badge */}
      <div className="bg-white rounded-2xl shadow-soft p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{langInfo.flag}</span>
          <div>
            <p className="text-sm text-gray-500">Currently Learning</p>
            <p className="font-bold text-primary">{langInfo.name}</p>
          </div>
        </div>
        <Link 
          href="/settings" 
          className="text-sm text-secondary hover:underline"
        >
          Change
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Zap}
          iconColor="text-yellow-500"
          iconBg="bg-yellow-100"
          label="Total XP"
          value={formatNumber(stats.totalXp)}
        />
        <StatCard
          icon={Flame}
          iconColor="text-orange-500"
          iconBg="bg-orange-100"
          label="Current Streak"
          value={`${stats.currentStreak} days`}
        />
        <StatCard
          icon={BookOpen}
          iconColor="text-secondary"
          iconBg="bg-primary-100"
          label="Lessons Done"
          value={stats.lessonsCompleted.toString()}
        />
        <StatCard
          icon={Trophy}
          iconColor="text-purple-500"
          iconBg="bg-purple-100"
          label="Longest Streak"
          value={`${stats.longestStreak} days`}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Placement Test Result */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-lg font-heading font-bold text-primary mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            {langInfo.name} Placement Test
          </h2>

          {stats.placementLevel ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl font-bold text-purple-600">
                  {stats.placementLevel}
                </span>
              </div>
              <p className="text-gray-600">
                You scored <span className="font-bold">{stats.placementScore} points</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Recommended starting level
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">
                Take the placement test to find your {langInfo.name} level
              </p>
              <Link href={`/placement-test?lang=${userLanguage}`}>
                <button className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition cursor-pointer">
                  Take Test
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Learning Progress */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-lg font-heading font-bold text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Learning Progress
          </h2>

          <div className="space-y-4">
            {/* Current Level */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Current Progress</p>
                  <p className="text-sm text-gray-500">Based on completed lessons</p>
                </div>
              </div>
              <span className="text-xl font-bold text-green-600">
                {stats.placementLevel || "A1"}
              </span>
            </div>

            {/* Lessons Progress */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Lessons Completed</p>
                  <p className="text-sm text-gray-500">Keep learning!</p>
                </div>
              </div>
              <span className="text-xl font-bold text-primary">
                {stats.lessonsCompleted}
              </span>
            </div>

            {/* Continue Button - Dynamic language */}
            <Link
              href={`/learn/${userLanguageSlug}/${(stats.placementLevel || "A1").toLowerCase()}`}
              className="block w-full py-3 bg-primary text-white text-center font-medium rounded-xl hover:bg-primary/90 transition"
            >
              Continue {langInfo.name}
            </Link>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-2xl shadow-soft p-6 mt-6">
        <h2 className="text-lg font-heading font-bold text-primary mb-4 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Achievements
        </h2>

        {userAchievements && userAchievements.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userAchievements.map((ua) => (
              <div
                key={ua.id}
                className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl text-center border border-yellow-200"
              >
                <div className="text-3xl mb-2">{ua.achievements?.icon || "🏆"}</div>
                <p className="font-medium text-gray-900 text-sm">
                  {ua.achievements?.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  +{ua.achievements?.xp_reward} XP
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Complete lessons to earn achievements!</p>
          </div>
        )}

        {/* Locked Achievements Preview */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-3">Upcoming achievements</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🔥", name: "7-Day Streak", desc: "Study 7 days in a row" },
              { icon: "📚", name: "Bookworm", desc: "Complete 10 lessons" },
              { icon: "⚡", name: "XP Hunter", desc: "Earn 500 XP" },
              { icon: "🎯", name: "Perfectionist", desc: "Get 100% on 5 lessons" },
            ].map((achievement, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-xl text-center opacity-60"
              >
                <div className="text-3xl mb-2 grayscale">{achievement.icon}</div>
                <p className="font-medium text-gray-600 text-sm">{achievement.name}</p>
                <p className="text-xs text-gray-400 mt-1">{achievement.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
}: {
  icon: any;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}