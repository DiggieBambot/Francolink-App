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
import { advanceStreak } from "@/lib/streak/advance-streak";

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
    // streak_freezes arrives with its own migration; without it, read the rest
    // (a failed read would otherwise look like "no streak" and reset it).
    const cols = "current_streak, longest_streak, last_activity_date, timezone";
    let { data: u, error: readError } = await s
      .from("users")
      .select(`${cols}, streak_freezes`)
      .eq("id", userId)
      .maybeSingle<{ current_streak: number | null; longest_streak: number | null; last_activity_date: string | null; timezone: string | null; streak_freezes?: number | null }>();
    if (readError) ({ data: u, error: readError } = await s.from("users").select(cols).eq("id", userId).maybeSingle());
    if (readError) throw readError;

    const tz = u?.timezone || "UTC";
    const today = new Date().toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
    const next = advanceStreak(
      {
        current: u?.current_streak || 0,
        longest: u?.longest_streak || 0,
        lastActivityDate: u?.last_activity_date ? String(u.last_activity_date).slice(0, 10) : null,
        freezes: u?.streak_freezes || 0,
      },
      today
    );
    // Already counted today — nothing to advance.
    if (!next.isNewDay) {
      return { currentStreak: next.current, longestStreak: next.longest, isNewDay: false, streakBroken: false };
    }
    const currentStreak = next.current;
    const longestStreak = next.longest;
    const isNewDay = true;
    const streakBroken = next.streakBroken;

    await s
      .from("users")
      .update({ current_streak: currentStreak, longest_streak: longestStreak, last_activity_date: today })
      .eq("id", userId);
    // Separate write, so a missing streak_freezes column can't block the streak.
    if (next.freezeUsed || next.freezeEarned) {
      await s.from("users").update({ streak_freezes: next.freezes }).eq("id", userId);
    }

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
