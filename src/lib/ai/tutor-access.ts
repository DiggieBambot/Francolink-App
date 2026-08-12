// src/lib/ai/tutor-access.ts

import { getAIConfig } from '@/lib/ai/client';
import { PLANS, PlanKey, isPaidPlan } from '@/lib/config/subscription';

/**
 * The AI tutor quota is a monthly pool counted in *messages*, not minutes: the
 * counter increments once per student message. The database column is still
 * named `ai_minutes_used_today` for historical reasons — everything above this
 * layer speaks in messages, and in months.
 */
export const USAGE_COLUMN = 'ai_minutes_used_today';
export const PERIOD_COLUMN = 'ai_usage_period';

export type TutorDenialCode = 'DISABLED' | 'NO_ACCESS' | 'LIMIT_REACHED';

export interface TutorAccess {
  /** Whether the student may send a message right now. */
  allowed: boolean;
  /** Why not, when `allowed` is false. */
  code?: TutorDenialCode;
  reason?: string;
  /** True when the admin panel has the tutor switched on. */
  tutorEnabled: boolean;
  /** True when the plan (or privileged role) grants tutor access at all. */
  hasAccess: boolean;
  isPrivileged: boolean;
  plan: PlanKey;
  role: string;
  learningLanguage: string;
  messagesUsed: number;
  /** Messages granted for the current month. `null` means unlimited. */
  monthlyLimit: number | null;
  /** `null` means unlimited. */
  remainingMessages: number | null;
  /** The period the counter belongs to, as `YYYY-MM`. */
  period: string;
}

/** Current quota period key, e.g. "2026-08". */
export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Resolve the per-plan monthly message pool, preferring the admin-configured
 * value and falling back to the static plan defaults.
 */
function limitForPlan(
  plan: PlanKey,
  limits: {
    freeMessagesPerMonth: number;
    premiumMessagesPerMonth: number;
    premiumPlusMessagesPerMonth: number;
  }
): number {
  switch (plan) {
    case 'PREMIUM':
      return limits.premiumMessagesPerMonth;
    case 'PREMIUM_PLUS':
      return limits.premiumPlusMessagesPerMonth;
    default:
      return limits.freeMessagesPerMonth;
  }
}

/**
 * Load the caller's tutor entitlement, rolling the counter over when the stored
 * period key is no longer the current month. Shared by the chat and usage routes
 * so both agree on limits, the admin feature flag, and privileged-role handling.
 */
export async function getTutorAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<TutorAccess | null> {
  const { data, error } = await supabase
    .from('users')
    .select(
      `subscription_plan, ${USAGE_COLUMN}, ${PERIOD_COLUMN}, role, learning_language`
    )
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const period = currentPeriod();
  let messagesUsed = data[USAGE_COLUMN] ?? 0;

  // A null period means this row predates the monthly pool — treat it as stale
  // so the first request of the new scheme starts the student from zero.
  if (data[PERIOD_COLUMN] !== period) {
    await supabase
      .from('users')
      .update({ [USAGE_COLUMN]: 0, [PERIOD_COLUMN]: period })
      .eq('id', userId);
    messagesUsed = 0;
  }

  const config = await getAIConfig();
  const role = data.role?.toUpperCase() || 'STUDENT';
  const isPrivileged = role === 'ADMIN' || role === 'TESTER';
  const plan = (data.subscription_plan || 'FREE') as PlanKey;
  const planExists = plan in PLANS;
  const safePlan = planExists ? plan : 'FREE';

  const configuredLimit = limitForPlan(safePlan, config.limits);
  const monthlyLimit = isPrivileged ? null : configuredLimit;
  const remainingMessages =
    monthlyLimit === null ? null : Math.max(0, monthlyLimit - messagesUsed);

  // A plan grants access when it is paid *and* actually has a nonzero cap, so
  // an admin can switch a tier off by setting its limit to 0.
  const hasAccess =
    isPrivileged || (isPaidPlan(safePlan) && configuredLimit > 0);

  const base = {
    tutorEnabled: config.features.tutorEnabled,
    hasAccess,
    isPrivileged,
    plan: safePlan,
    role,
    learningLanguage: data.learning_language || 'fr',
    messagesUsed: isPrivileged ? 0 : messagesUsed,
    monthlyLimit,
    remainingMessages,
    period,
  };

  // Admins and testers keep access while the tutor is switched off, so the
  // feature can be verified before it is turned back on for students.
  if (!config.features.tutorEnabled && !isPrivileged) {
    return {
      ...base,
      allowed: false,
      code: 'DISABLED',
      reason: 'The AI Tutor is temporarily unavailable. Please check back soon.',
    };
  }

  if (!hasAccess) {
    return {
      ...base,
      allowed: false,
      code: 'NO_ACCESS',
      reason: 'AI Tutor requires a Premium subscription.',
    };
  }

  if (remainingMessages !== null && remainingMessages <= 0) {
    return {
      ...base,
      allowed: false,
      code: 'LIMIT_REACHED',
      reason:
        'You have used all your AI tutor messages for this month. Your allowance resets at the start of next month, or you can upgrade for a bigger pool.',
    };
  }

  return { ...base, allowed: true };
}
