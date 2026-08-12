// src/lib/config/subscription.ts

export type PlanKey = "FREE" | "PREMIUM" | "PREMIUM_PLUS";
export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface PlanConfig {
  name: string;
  dailyLessonLimit: number;
  accessibleLevels: CEFRLevel[];
  hasAiTutor: boolean;
  /**
   * Monthly pool of AI tutor exchanges. One message sent by the student = one
   * unit. A pool rather than a daily cap so a student can hold one long
   * practice session instead of being cut off mid-conversation every day.
   */
  aiMessagesPerMonth: number;
  maxLanguages: number;
}

// Static defaults (used for client-side code)
export const PLANS: Record<PlanKey, PlanConfig> = {
  FREE: {
    name: "Free",
    dailyLessonLimit: 1,
    accessibleLevels: ["A1", "A2", "B1", "B2"],
    hasAiTutor: false,
    aiMessagesPerMonth: 0,
    maxLanguages: 1,
  },
  PREMIUM: {
    name: "Premium",
    dailyLessonLimit: Infinity,
    accessibleLevels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    hasAiTutor: true,
    aiMessagesPerMonth: 300,
    maxLanguages: Infinity,
  },
  PREMIUM_PLUS: {
    name: "Premium+",
    dailyLessonLimit: Infinity,
    accessibleLevels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    hasAiTutor: true,
    aiMessagesPerMonth: 1500,
    maxLanguages: Infinity,
  },
} as const;

export function isPaidPlan(plan: PlanKey): boolean {
  return plan === "PREMIUM" || plan === "PREMIUM_PLUS";
}

export function canAccessLevel(plan: PlanKey, level: CEFRLevel): boolean {
  return PLANS[plan].accessibleLevels.includes(level);
}