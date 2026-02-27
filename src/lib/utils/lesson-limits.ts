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

// ─── Role Check Helper ────────────────────────────────────────────

async function isPrivilegedRole(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const role = profile?.role?.toUpperCase();
  return role === "ADMIN" || role === "TESTER";
}

// ─── Core API ────────────────────────────────────────────────────

export async function checkLessonAccess(
  supabase: SupabaseClient,
  userId: string,
  options: {
    isLessonPremium?: boolean;
    isUnitPremium?: boolean;
    unitOrder?: number;
    courseLevel?: CEFRLevel;
  } = {}
): Promise<AccessCheckResult> {
  const { isLessonPremium = false, isUnitPremium = false, unitOrder = 1, courseLevel } = options;

  // ADMIN / TESTER bypass — full access, no limits
  if (await isPrivilegedRole(supabase, userId)) {
    return {
      allowed: true,
      remainingToday: Infinity,
      dailyLimit: Infinity,
    };
  }

  const userData = await fetchUserLimitsData(supabase, userId);

  // Can't read user data — fail open
  if (!userData) {
    return { allowed: true, remainingToday: Infinity, dailyLimit: Infinity };
  }

  const { plan } = userData;
  const planConfig = PLANS[plan];

  // Paid users: always allowed
  if (isPaidPlan(plan)) {
    return { allowed: true, remainingToday: Infinity, dailyLimit: Infinity };
  }

  // FREE users logic
  const lessonsToday = await getEffectiveLessonsToday(
    supabase,
    userId,
    userData.lessonsToday,
    userData.resetDate
  );

  const remaining = Math.max(0, planConfig.dailyLessonLimit - lessonsToday);

  // Level locked
  if (courseLevel && !planConfig.accessibleLevels.includes(courseLevel)) {
    return {
      allowed: false,
      reason: "level_locked",
      message: `${courseLevel} content is available with a Premium subscription.`,
      remainingToday: remaining,
      dailyLimit: planConfig.dailyLessonLimit,
    };
  }

  // Unit 1 is always free — only check daily limit
  if (unitOrder === 1) {
    if (lessonsToday >= planConfig.dailyLessonLimit) {
      return {
        allowed: false,
        reason: "daily_limit_reached",
        message: `You've completed your ${planConfig.dailyLessonLimit} free lesson for today. Come back tomorrow or upgrade for unlimited access.`,
        remainingToday: 0,
        dailyLimit: planConfig.dailyLessonLimit,
      };
    }
    return {
      allowed: true,
      remainingToday: remaining,
      dailyLimit: planConfig.dailyLessonLimit,
    };
  }

  // Unit 2+ requires premium for free users
  if (unitOrder >= 2 || isLessonPremium || isUnitPremium) {
    return {
      allowed: false,
      reason: "premium_content",
      message: "Unit 2 and beyond require a Premium subscription. Upgrade to continue learning!",
      remainingToday: remaining,
      dailyLimit: planConfig.dailyLessonLimit,
    };
  }

  // Daily limit (fallback)
  if (lessonsToday >= planConfig.dailyLessonLimit) {
    return {
      allowed: false,
      reason: "daily_limit_reached",
      message: `You've completed your ${planConfig.dailyLessonLimit} free lesson for today. Come back tomorrow or upgrade for unlimited access.`,
      remainingToday: 0,
      dailyLimit: planConfig.dailyLessonLimit,
    };
  }

  return {
    allowed: true,
    remainingToday: remaining,
    dailyLimit: planConfig.dailyLessonLimit,
  };
}

// ─── Increment After Completion ──────────────────────────────────

export async function incrementLessonCount(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  // Don't increment for admins/testers
  if (await isPrivilegedRole(supabase, userId)) return;

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

// ─── Usage For Dashboard UI ─────────────────────────────────────

export async function getLessonUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<LessonUsage> {
  // ADMIN / TESTER bypass — show unlimited in UI
  if (await isPrivilegedRole(supabase, userId)) {
    return {
      used: 0,
      limit: Infinity,
      remaining: Infinity,
      plan: "PREMIUM_PLUS",
      isLimited: false,
    };
  }

  const userData = await fetchUserLimitsData(supabase, userId);

  if (!userData) {
    return { used: 0, limit: 1, remaining: 1, plan: "FREE", isLimited: true };
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
