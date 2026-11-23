// src/lib/config/subscription.ts

export type PlanKey = "FREE" | "PREMIUM" | "PREMIUM_PLUS";
export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface PlanConfig {
  name: string;
  dailyLessonLimit: number;
  accessibleLevels: CEFRLevel[];
  hasAiTutor: boolean;
  /**
   * AI tutoring time, in minutes of active session time. Both caps apply: the
   * daily one spreads practice out, the monthly one bounds the cost of a plan.
   * Extra hours bought on top are used once either cap is reached.
   */
  aiDailyMinutes: number;
  aiMonthlyMinutes: number;
  maxLanguages: number;
}

// Static defaults (used for client-side code)
export const PLANS: Record<PlanKey, PlanConfig> = {
  FREE: {
    name: "Free",
    dailyLessonLimit: 1,
    accessibleLevels: ["A1", "A2", "B1", "B2"],
    hasAiTutor: false,
    aiDailyMinutes: 0,
    aiMonthlyMinutes: 0,
    maxLanguages: 1,
  },
  PREMIUM: {
    name: "Premium",
    dailyLessonLimit: Infinity,
    accessibleLevels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    hasAiTutor: true,
    aiDailyMinutes: 15,
    aiMonthlyMinutes: 180,
    maxLanguages: Infinity,
  },
  PREMIUM_PLUS: {
    name: "Premium+",
    dailyLessonLimit: Infinity,
    accessibleLevels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    hasAiTutor: true,
    aiDailyMinutes: 45,
    aiMonthlyMinutes: 600,
    maxLanguages: Infinity,
  },
} as const;

export function isPaidPlan(plan: PlanKey): boolean {
  return plan === "PREMIUM" || plan === "PREMIUM_PLUS";
}

export function canAccessLevel(plan: PlanKey, level: CEFRLevel): boolean {
  return PLANS[plan].accessibleLevels.includes(level);
}
/**
 * Extra AI tutoring hours, bought one-off on top of a plan. Priced on the
 * server only — the client names a pack, never an amount. About $0.66 of AI
 * per hour, so both packs keep ~70%+ after AI cost and card fees.
 */
export const AI_TUTOR_HOUR_PACKS = {
  h1: { hours: 1, priceCents: 299, label: "1 hour" },
  h5: { hours: 5, priceCents: 999, label: "5 hours" },
} as const;

export type AiTutorHourPackKey = keyof typeof AI_TUTOR_HOUR_PACKS;

/** "1 h 20 min", "45 min", "3 h". */
export function formatTutoringTime(seconds: number): string {
  const totalMin = Math.max(0, Math.floor(seconds / 60));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
