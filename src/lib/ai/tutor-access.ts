// src/lib/ai/tutor-access.ts
//
// Who may use the AI tutor right now, and how much tutoring time they have
// left. The allowance is minutes of active tutoring time, capped per day and
// per month by plan (like Claude's plans). Purchased extra hours are drawn
// down once a cap is reached. Days and months are UTC.
//
// Time itself is charged by the chat route through `record_ai_tutor_time`, the
// one place that writes it, so the caps cannot be double-counted.

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getAIConfig } from '@/lib/ai/client';
import { PLANS, PlanKey, isPaidPlan } from '@/lib/config/subscription';

export type TutorDenialCode = 'DISABLED' | 'NO_ACCESS' | 'LIMIT_REACHED';

export interface TutorTime {
  /** Seconds allowed per day / month by the plan. `null` means unlimited. */
  dailyCapSeconds: number | null;
  monthlyCapSeconds: number | null;
  /** Plan time already used today / this month. */
  usedTodaySeconds: number;
  usedMonthSeconds: number;
  /** Purchased extra time still available. */
  extraSeconds: number;
  /** Plan time left right now: the smaller of today's and this month's room. `null` = unlimited. */
  planRemainingSeconds: number | null;
  /** Plan time left plus extra time. `null` = unlimited. */
  remainingSeconds: number | null;
  /** Which cap is binding when plan time has run out. */
  limitScope: 'DAY' | 'MONTH' | null;
}

export interface TutorAccess extends TutorTime {
  /** Whether the student may start another turn right now. */
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
}

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function utcMonthStart(): string {
  return new Date().toISOString().slice(0, 8) + '01';
}

/** Read the student's time usage. Missing tables (migration not run) read as zero. */
async function loadTime(
  userId: string,
  dailyCapSeconds: number | null,
  monthlyCapSeconds: number | null
): Promise<TutorTime> {
  const svc = service();
  const [{ data: days }, { data: balance }] = await Promise.all([
    svc
      .from('ai_tutor_time_usage')
      .select('day, plan_seconds')
      .eq('user_id', userId)
      .gte('day', utcMonthStart()),
    svc
      .from('ai_tutor_time_balance')
      .select('extra_seconds')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const today = utcToday();
  let usedTodaySeconds = 0;
  let usedMonthSeconds = 0;
  for (const d of (days ?? []) as { day: string; plan_seconds: number }[]) {
    usedMonthSeconds += d.plan_seconds ?? 0;
    if (d.day === today) usedTodaySeconds += d.plan_seconds ?? 0;
  }
  const extraSeconds = Math.max(0, balance?.extra_seconds ?? 0);

  const dayRoom = dailyCapSeconds === null ? null : Math.max(0, dailyCapSeconds - usedTodaySeconds);
  const monthRoom =
    monthlyCapSeconds === null ? null : Math.max(0, monthlyCapSeconds - usedMonthSeconds);

  let planRemainingSeconds: number | null;
  if (dayRoom === null && monthRoom === null) planRemainingSeconds = null;
  else if (dayRoom === null) planRemainingSeconds = monthRoom;
  else if (monthRoom === null) planRemainingSeconds = dayRoom;
  else planRemainingSeconds = Math.min(dayRoom, monthRoom);

  const limitScope =
    planRemainingSeconds === null || planRemainingSeconds > 0
      ? null
      : monthRoom === 0
        ? 'MONTH'
        : 'DAY';

  return {
    dailyCapSeconds,
    monthlyCapSeconds,
    usedTodaySeconds,
    usedMonthSeconds,
    extraSeconds,
    planRemainingSeconds,
    remainingSeconds: planRemainingSeconds === null ? null : planRemainingSeconds + extraSeconds,
    limitScope,
  };
}

/**
 * Load the caller's tutor entitlement and remaining time. Shared by every
 * tutor route so they agree on limits, the admin switch and privileged roles.
 */
export async function getTutorAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<TutorAccess | null> {
  const { data, error } = await supabase
    .from('users')
    .select('subscription_plan, role, learning_language')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const config = await getAIConfig();
  const role = data.role?.toUpperCase() || 'STUDENT';
  const isPrivileged = role === 'ADMIN' || role === 'TESTER';
  const plan = (data.subscription_plan || 'FREE') as PlanKey;
  const safePlan: PlanKey = plan in PLANS ? plan : 'FREE';

  const caps = config.limits[safePlan];
  // A plan grants access when it is paid *and* has nonzero caps, so an admin
  // can switch a tier off by setting its minutes to 0.
  const hasAccess =
    isPrivileged || (isPaidPlan(safePlan) && caps.dailyMinutes > 0 && caps.monthlyMinutes > 0);

  const time = await loadTime(
    userId,
    isPrivileged ? null : caps.dailyMinutes * 60,
    isPrivileged ? null : caps.monthlyMinutes * 60
  );

  const base = {
    ...time,
    tutorEnabled: config.features.tutorEnabled,
    hasAccess,
    isPrivileged,
    plan: safePlan,
    role,
    learningLanguage: data.learning_language || 'fr',
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
      reason: 'AI tutoring requires a Premium subscription.',
    };
  }

  if (time.remainingSeconds !== null && time.remainingSeconds <= 0) {
    return {
      ...base,
      allowed: false,
      code: 'LIMIT_REACHED',
      reason:
        time.limitScope === 'MONTH'
          ? "You've used this month's AI tutoring time. Add extra hours to keep going, or it resets on the 1st."
          : "You've used today's AI tutoring time. It resets at midnight UTC, or add extra hours to keep going now.",
    };
  }

  return { ...base, allowed: true };
}

/** Longest gap between two turns that still counts as active tutoring time. */
export const MAX_TURN_GAP_SECONDS = 120;
/** Charged for the first turn of a session, which has no previous turn to measure from. */
export const FIRST_TURN_SECONDS = 20;
/** Floor per turn, so rapid-fire turns still cost something. */
export const MIN_TURN_SECONDS = 5;

/**
 * Active tutoring time for one turn: the time since the previous turn,
 * capped so a student who walks away stops being charged after 2 minutes.
 */
export function secondsForTurn(lastMessageAt: string | null | undefined): number {
  if (!lastMessageAt) return FIRST_TURN_SECONDS;
  const gap = (Date.now() - new Date(lastMessageAt).getTime()) / 1000;
  if (!Number.isFinite(gap) || gap < 0) return MIN_TURN_SECONDS;
  return Math.round(Math.min(MAX_TURN_GAP_SECONDS, Math.max(MIN_TURN_SECONDS, gap)));
}

/** Charge tutoring time. Best-effort: a failed write is logged, never thrown. */
export async function recordTutorTime(access: TutorAccess, userId: string, seconds: number) {
  try {
    const { error } = await service().rpc('record_ai_tutor_time', {
      p_user: userId,
      p_seconds: seconds,
      p_daily_cap: access.dailyCapSeconds,
      p_monthly_cap: access.monthlyCapSeconds,
    });
    if (error) console.error('record_ai_tutor_time failed:', error.message);
  } catch (err) {
    console.error('record_ai_tutor_time failed:', err);
  }
}
