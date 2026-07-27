// Standalone streak + daily-activity service (PRD §5).
//
// The ONE hook any feature — a lesson, a game, homework — calls to register that
// the user did something today. It is not tied to lessons: it takes a generic
// "user was active" signal, advances the consecutive-day streak, and emits the
// §1 daily-activity event tagged with whether the user had a lesson scheduled
// that day (the between-lesson-return signal). Games only need to call this —
// no streak logic lives in game code.
//
// Fire-and-forget friendly: never throws. Idempotent per calendar day (in the
// user's timezone), so calling it from several activities in one day counts once.

import { createClient } from "@supabase/supabase-js";
import { logActivity, hasLessonOnDay } from "@/lib/analytics/activity";

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export interface RecordActivityResult {
  currentStreak: number;
  longestStreak: number;
  isNewDay: boolean;
  streakBroken: boolean;
}

/** Days between two YYYY-MM-DD calendar strings (b - a). */
function dayDiff(a: string, b: string): number {
  const da = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const db = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((db - da) / 86400_000);
}

/**
 * Register a day of activity for a user and advance their streak.
 * @param userId  the student
 * @param opts.kind  what drove it ("lesson" | "game" | "homework" | ...), for analytics only
 */
export async function recordActivity(
  userId: string,
  opts: { kind?: string } = {}
): Promise<RecordActivityResult> {
  const empty: RecordActivityResult = { currentStreak: 0, longestStreak: 0, isNewDay: false, streakBroken: false };
  if (!userId) return empty;
  const s = svc();

  try {
    const { data: u } = await s
      .from("users")
      .select("current_streak, longest_streak, last_activity_date, timezone")
      .eq("id", userId)
      .maybeSingle();

    const tz = u?.timezone || "UTC";
    const today = new Date().toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
    const last = u?.last_activity_date ? String(u.last_activity_date).slice(0, 10) : null;

    let currentStreak = u?.current_streak || 0;
    let longestStreak = u?.longest_streak || 0;
    let isNewDay = false;
    let streakBroken = false;

    if (!last) {
      currentStreak = 1;
      isNewDay = true;
    } else {
      const diff = dayDiff(last, today);
      if (diff <= 0) {
        // Already counted today (or clock skew) — nothing to advance.
        return { currentStreak, longestStreak, isNewDay: false, streakBroken: false };
      } else if (diff === 1) {
        currentStreak += 1;
        isNewDay = true;
      } else {
        currentStreak = 1;
        isNewDay = true;
        streakBroken = true;
      }
    }

    if (currentStreak > longestStreak) longestStreak = currentStreak;

    await s
      .from("users")
      .update({ current_streak: currentStreak, longest_streak: longestStreak, last_activity_date: today })
      .eq("id", userId);

    // §1 daily-activity signal: tag with whether they had a lesson scheduled today.
    let hadLesson = false;
    try {
      hadLesson = await hasLessonOnDay(userId, tz, today);
    } catch { /* default false */ }
    await logActivity(userId, "active", { metadata: { had_lesson: hadLesson, via: opts.kind || "activity" } });

    return { currentStreak, longestStreak, isNewDay, streakBroken };
  } catch (e) {
    console.error("[streak] recordActivity failed:", (e as Error).message);
    return empty;
  }
}
