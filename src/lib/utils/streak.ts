// src/lib/utils/streak.ts

import { SupabaseClient } from "@supabase/supabase-js";

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
  // Get current user data
  const { data: user, error } = await supabase
    .from("users")
    .select("current_streak, longest_streak, last_activity_date")
    .eq("id", userId)
    .single();

  if (error || !user) {
    console.error("Error fetching user for streak:", error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakUpdated: false,
      streakBroken: false,
      isNewDay: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = user.last_activity_date 
    ? new Date(user.last_activity_date) 
    : null;
  
  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
  }

  let currentStreak = user.current_streak || 0;
  let longestStreak = user.longest_streak || 0;
  let streakUpdated = false;
  let streakBroken = false;
  let isNewDay = false;

  if (!lastActivity) {
    // First activity ever
    currentStreak = 1;
    streakUpdated = true;
    isNewDay = true;
  } else {
    const diffTime = today.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day - streak already counted
      isNewDay = false;
      streakUpdated = false;
    } else if (diffDays === 1) {
      // Consecutive day - increment streak!
      currentStreak += 1;
      streakUpdated = true;
      isNewDay = true;
    } else {
      // Missed days - reset streak
      streakBroken = true;
      currentStreak = 1;
      streakUpdated = true;
      isNewDay = true;
    }
  }

  // Update longest streak if needed
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Save to database
  if (streakUpdated || isNewDay) {
    const { error: updateError } = await supabase
      .from("users")
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: today.toISOString().split("T")[0],
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating streak:", updateError);
    }
  }

  return {
    currentStreak,
    longestStreak,
    streakUpdated,
    streakBroken,
    isNewDay,
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