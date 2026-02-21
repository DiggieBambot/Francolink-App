// src/app/(admin)/admin/users/[id]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Flame,
  Zap,
  Crown,
  Sparkles,
  BookOpen,
  Trophy,
  Clock,
  CreditCard,
} from "lucide-react";
import { UserActions } from "./user-actions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch user
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !user) {
    notFound();
  }

  // Fetch user's lesson progress
  const { data: lessonProgress, count: lessonsCompleted } = await supabase
    .from("lesson_progress")
    .select("*", { count: "exact" })
    .eq("user_id", id)
    .eq("status", "COMPLETED");

  // Fetch user's enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      *,
      courses:course_id (
        title,
        slug,
        level
      )
    `)
    .eq("user_id", id);

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "PREMIUM_PLUS":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
            <Sparkles className="w-4 h-4" />
            Premium+
          </span>
        );
      case "PREMIUM":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700">
            <Crown className="w-4 h-4" />
            Premium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
            Free
          </span>
        );
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-semibold text-indigo-600">
                  {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name || "No name"}
                </h1>
                {user.role === "ADMIN" && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-gray-500 flex items-center gap-1 mt-1">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            </div>
          </div>

          <UserActions user={user} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <Flame className="w-5 h-5" />
                <span className="text-2xl font-bold">{user.current_streak || 0}</span>
              </div>
              <p className="text-sm text-gray-500">Current Streak</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-1">
                <Zap className="w-5 h-5" />
                <span className="text-2xl font-bold">{user.total_xp || 0}</span>
              </div>
              <p className="text-sm text-gray-500">Total XP</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-primary mb-1">
                <BookOpen className="w-5 h-5" />
                <span className="text-2xl font-bold">{lessonsCompleted || 0}</span>
              </div>
              <p className="text-sm text-gray-500">Lessons Done</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Trophy className="w-5 h-5" />
                <span className="text-2xl font-bold">{user.longest_streak || 0}</span>
              </div>
              <p className="text-sm text-gray-500">Longest Streak</p>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-mono text-sm text-gray-900 break-all">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-gray-900">{user.role || "USER"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="text-gray-900 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(user.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Activity</p>
                <p className="text-gray-900 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {formatDate(user.last_activity_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Daily Goal</p>
                <p className="text-gray-900">{user.daily_goal_minutes || 15} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Native Language</p>
                <p className="text-gray-900">{user.native_language || "English"}</p>
              </div>
            </div>
          </div>

          {/* Placement Test */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Placement Test
            </h2>
            {user.placement_test_taken ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Level</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {user.placement_test_level || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {user.placement_test_score || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Taken At</p>
                  <p className="text-gray-900">
                    {formatDate(user.placement_test_taken_at)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Not taken yet</p>
            )}
          </div>

          {/* Enrollments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Enrolled Courses
            </h2>
            {enrollments && enrollments.length > 0 ? (
              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {enrollment.courses?.title || "Unknown Course"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Level: {enrollment.courses?.level || "N/A"}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(enrollment.enrolled_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No enrollments yet</p>
            )}
          </div>
        </div>

        {/* Right Column - Subscription */}
        <div className="space-y-6">
          {/* Subscription Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Current Plan</p>
                {getPlanBadge(user.subscription_plan || "FREE")}
                {user.is_founding_member && (
                  <span className="ml-2 text-xs text-amber-600 font-medium">
                    🏆 Founding Member
                  </span>
                )}
              </div>

              {user.subscription_plan !== "FREE" && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Billing Period</p>
                    <p className="text-gray-900 capitalize">
                      {user.subscription_period || "Monthly"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Started</p>
                    <p className="text-gray-900">
                      {formatDate(user.subscription_started_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Renews/Ends</p>
                    <p className="text-gray-900">
                      {formatDate(user.subscription_ends_at)}
                    </p>
                  </div>
                  {user.stripe_customer_id && (
                    <div>
                      <p className="text-sm text-gray-500">Stripe Customer</p>
                      <a
                        href={`https://dashboard.stripe.com/customers/${user.stripe_customer_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline text-sm font-mono"
                      >
                        {user.stripe_customer_id}
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Daily Usage */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Today&apos;s Usage
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Lessons Completed</p>
                <p className="text-gray-900">{user.lessons_today || 0} / 3</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">AI Minutes Used</p>
                <p className="text-gray-900">{user.ai_minutes_used_today || 0} min</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}