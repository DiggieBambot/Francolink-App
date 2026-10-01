// src/lib/utils/streak.ts

import { SupabaseClient } from "@supabase/supabase-js";

import { advanceStreak } from "@/lib/streak/advance-streak";

interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  streakUpdated: boolean;
  streakBroken: boolean;
  isNewDay: boolean;
}

/**
 * Updates user's streak based on their activity
 * Call this when a user completes a lesson
 */
export async function updateStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<StreakResult> {
  const failed: StreakResult = { currentStreak: 0, longestStreak: 0, streakUpdated: false, streakBroken: false, isNewDay: false };

  // streak_freezes arrives with its own migration; without it, read the rest.
  const cols = "current_streak, longest_streak, last_activity_date";
  let { data: user, error } = await supabase.from("users").select(`${cols}, streak_freezes`).eq("id", userId).single();
  if (error) ({ data: user, error } = await supabase.from("users").select(cols).eq("id", userId).single());
  if (error || !user) {
    console.error("Error fetching user for streak:", error);
    return failed;
  }

  // The learner's own calendar day (this runs in their browser). Compared as
  // YYYY-MM-DD strings: mixing a local midnight with a UTC date string used
  // to shift the day for anyone west of UTC and reset their streak.
  const today = new Date().toLocaleDateString("en-CA");
  const next = advanceStreak(
    {
      current: user.current_streak || 0,
      longest: user.longest_streak || 0,
      lastActivityDate: user.last_activity_date ? String(user.last_activity_date).slice(0, 10) : null,
      freezes: (user as { streak_freezes?: number | null }).streak_freezes || 0,
    },
    today
  );

  if (next.isNewDay) {
    const { error: updateError } = await supabase
      .from("users")
      .update({ current_streak: next.current, longest_streak: next.longest, last_activity_date: today })
      .eq("id", userId);
    if (updateError) console.error("Error updating streak:", updateError);
    // Separate write, so a missing streak_freezes column can't block the streak.
    if (next.freezeUsed || next.freezeEarned) {
      await supabase.from("users").update({ streak_freezes: next.freezes }).eq("id", userId);
    }
  }

  return {
    currentStreak: next.current,
    longestStreak: next.longest,
    streakUpdated: next.isNewDay,
    streakBroken: next.streakBroken,
    isNewDay: next.isNewDay,
  };
}

/**
 * Check if user's streak is at risk (hasn't studied today)
 */
export function isStreakAtRisk(lastActivityDate: string | null): boolean {
  if (!lastActivityDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = new Date(lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - lastActivity.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 1;
}

/**
 * Get streak status message
 */
export function getStreakMessage(streak: number, isAtRisk: boolean): string {
  if (isAtRisk) {
    return "Complete a lesson to keep your streak!";
  }
  
  if (streak === 0) {
    return "Start your streak today!";
  }
  
  if (streak === 1) {
    return "Great start! Keep it going tomorrow!";
  }
  
  if (streak < 7) {
    return `${streak} days strong! Keep it up!`;
  }
  
  if (streak < 30) {
    return `${streak} days! You're on fire! 🔥`;
  }
  
  if (streak < 100) {
    return `${streak} days! Incredible dedication! 🏆`;
  }
  
  return `${streak} days! You're a legend! 👑`;
}