// src/lib/utils/lesson-limits.ts

import { SupabaseClient } from "@supabase/supabase-js";
import {
  PLANS,
  PlanKey,
  CEFRLevel,
  isPaidPlan,
} from "@/lib/config/subscription";

// ─── Types ───────────────────────────────────────────────────────

export type DenialReason =
  | "daily_limit_reached"
  | "premium_content"
  | "level_locked";

export interface AccessCheckResult {
  allowed: boolean;
  reason?: DenialReason;
  message?: string;
  remainingToday: number;
  dailyLimit: number;
}

export interface LessonUsage {
  used: number;
  limit: number;
  remaining: number;
  plan: PlanKey;
  isLimited: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

async function fetchUserLimitsData(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("subscription_plan, lessons_today, lessons_reset_date")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("lesson-limits: failed to fetch user data", error);
    return null;
  }

  return {
    plan: (data.subscription_plan || "FREE") as PlanKey,
    lessonsToday: (data.lessons_today ?? 0) as number,
    resetDate: (data.lessons_reset_date ?? null) as string | null,
  };
}

async function getEffectiveLessonsToday(
  supabase: SupabaseClient,
  userId: string,
  currentCount: number,
  currentResetDate: string | null
): Promise<number> {
  const today = getToday();

  if (currentResetDate === today) {
    return currentCount;
  }

  // New day — reset counter
  await supabase
    .from("users")
    .update({ lessons_today: 0, lessons_reset_date: today })
    .eq("id", userId);

  return 0;
}

// ─── Core API ────────────────────────────────────────────────────

/**
 * Check whether a user can access a specific lesson.
 * Call from the lesson page before rendering content.
 */
export async function checkLessonAccess(
  supabase: SupabaseClient,
  userId: string,
  options: {
    isLessonPremium?: boolean;
    courseLevel?: CEFRLevel;
  } = {}
): Promise<AccessCheckResult> {
  const { isLessonPremium = false, courseLevel } = options;

  const userData = await fetchUserLimitsData(supabase, userId);

  // Can't read user data — fail open (don't lock people out due to a bug)
  if (!userData) {
    return { allowed: true, remainingToday: Infinity, dailyLimit: Infinity };
  }

  const { plan } = userData;
  const planConfig = PLANS[plan];

  // Paid users: always allowed
  if (isPaidPlan(plan)) {
    return { allowed: true, remainingToday: Infinity, dailyLimit: Infinity };
  }

  // From here on, user is FREE
  const lessonsToday = await getEffectiveLessonsToday(
    supabase,
    userId,
    userData.lessonsToday,
    userData.resetDate
  );

  const remaining = Math.max(0, planConfig.dailyLessonLimit - lessonsToday);

  // Check 1: Level locked (C1/C2 not accessible on FREE)
  if (courseLevel && !planConfig.accessibleLevels.includes(courseLevel)) {
    return {
      allowed: false,
      reason: "level_locked",
      message: `${courseLevel} content is available with a Premium subscription.`,
      remainingToday: remaining,
      dailyLimit: planConfig.dailyLessonLimit,
    };
  }

  // Check 2: Premium-flagged lesson
  if (isLessonPremium) {
    return {
      allowed: false,
      reason: "premium_content",
      message: "This lesson is part of our Premium curriculum.",
      remainingToday: remaining,
      dailyLimit: planConfig.dailyLessonLimit,
    };
  }

  // Check 3: Daily limit
  if (lessonsToday >= planConfig.dailyLessonLimit) {
    return {
      allowed: false,
      reason: "daily_limit_reached",
      message: `You've completed all ${planConfig.dailyLessonLimit} free lessons for today. Come back tomorrow or upgrade for unlimited access.`,
      remainingToday: 0,
      dailyLimit: planConfig.dailyLessonLimit,
    };
  }

  // All clear
  return {
    allowed: true,
    remainingToday: remaining,
    dailyLimit: planConfig.dailyLessonLimit,
  };
}

/**
 * Increment lessons_today after a successful lesson completion.
 * Call alongside streak update when score ≥ 70%.
 */
export async function incrementLessonCount(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const today = getToday();

  const { data: user } = await supabase
    .from("users")
    .select("lessons_today, lessons_reset_date")
    .eq("id", userId)
    .single();

  if (!user) return;

  const newCount =
    user.lessons_reset_date === today ? (user.lessons_today ?? 0) + 1 : 1;

  const { error } = await supabase
    .from("users")
    .update({ lessons_today: newCount, lessons_reset_date: today })
    .eq("id", userId);

  if (error) {
    console.error("lesson-limits: failed to increment lesson count", error);
  }
}

/**
 * Get the user's daily lesson usage for UI display.
 * Use in Dashboard, course pages, etc.
 */
export async function getLessonUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<LessonUsage> {
  const userData = await fetchUserLimitsData(supabase, userId);

  if (!userData) {
    return { used: 0, limit: 3, remaining: 3, plan: "FREE", isLimited: true };
  }

  const { plan } = userData;
  const planConfig = PLANS[plan];

  if (isPaidPlan(plan)) {
    return {
      used: 0,
      limit: Infinity,
      remaining: Infinity,
      plan,
      isLimited: false,
    };
  }

  const lessonsToday = await getEffectiveLessonsToday(
    supabase,
    userId,
    userData.lessonsToday,
    userData.resetDate
  );

  return {
    used: lessonsToday,
    limit: planConfig.dailyLessonLimit,
    remaining: Math.max(0, planConfig.dailyLessonLimit - lessonsToday),
    plan,
    isLimited: true,
  };
}