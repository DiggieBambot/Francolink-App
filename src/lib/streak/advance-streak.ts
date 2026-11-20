// The one streak rule, shared by every place that records a day of study
// (record-activity.ts, utils/streak.ts, and a copy in the mobile app's
// src/lib/streak.ts — keep that copy identical).
//
// Days are the learner's own calendar days as YYYY-MM-DD strings, compared as
// dates, never through a Date in UTC.
//
// Streak freeze (mobile PRD §5.4.3): a learner holds up to MAX_FREEZES. One is
// earned each time the streak reaches a multiple of 7. If exactly one day was
// missed and a freeze is held, it's spent and the streak carries on instead of
// restarting.

export const MAX_FREEZES = 2;
const EARN_EVERY = 7;

export interface StreakState {
  current: number;
  longest: number;
  /** Last day with activity, YYYY-MM-DD, or null if never. */
  lastActivityDate: string | null;
  freezes: number;
}

export interface StreakAdvance {
  current: number;
  longest: number;
  freezes: number;
  /** Today's activity moved the streak on (first activity of the day). */
  isNewDay: boolean;
  /** Days were missed and the streak restarted at 1. */
  streakBroken: boolean;
  /** A freeze covered yesterday. */
  freezeUsed: boolean;
  /** Reaching this streak earned a freeze. */
  freezeEarned: boolean;
}

/** Whole calendar days from `a` to `b` (both YYYY-MM-DD). */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.slice(0, 10).split("-").map(Number);
  const [by, bm, bd] = b.slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

/** Record activity on `today` (YYYY-MM-DD) and return the new streak state. */
export function advanceStreak(s: StreakState, today: string): StreakAdvance {
  let current = s.current || 0;
  let freezes = Math.max(0, Math.min(MAX_FREEZES, s.freezes || 0));
  let isNewDay = false;
  let streakBroken = false;
  let freezeUsed = false;

  const gap = s.lastActivityDate ? daysBetween(s.lastActivityDate, today) : null;
  if (gap === null) {
    current = 1;
    isNewDay = true;
  } else if (gap <= 0) {
    // Already counted today (or clock skew). A zero streak still starts.
    if (current === 0) {
      current = 1;
      isNewDay = true;
    }
  } else if (gap === 1) {
    current += 1;
    isNewDay = true;
  } else if (gap === 2 && freezes > 0) {
    current += 1;
    freezes -= 1;
    freezeUsed = true;
    isNewDay = true;
  } else {
    current = 1;
    isNewDay = true;
    streakBroken = true;
  }

  let freezeEarned = false;
  if (isNewDay && current % EARN_EVERY === 0 && freezes < MAX_FREEZES) {
    freezes += 1;
    freezeEarned = true;
  }

  return {
    current,
    longest: Math.max(s.longest || 0, current),
    freezes,
    isNewDay,
    streakBroken,
    freezeUsed,
    freezeEarned,
  };
}
