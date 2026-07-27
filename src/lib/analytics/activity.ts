// Server-only activity capture. Writes to the user_activity event log with the
// service role so it works from any authenticated route. Fire-and-forget — never
// throws into the caller's happy path.

import { createClient } from "@supabase/supabase-js";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export type ActivityKind =
  | "active"          // daily heartbeat ping
  | "login"
  | "signup"
  | "signup_completed"    // account created (granular first-session funnel)
  | "dashboard_viewed"    // first dashboard view after signup
  | "placement_started"   // opened the placement test
  | "placement_completed" // finished (or skipped) the placement test
  | "lesson_view"
  | "homework_submit"
  | "homework_submitted"  // canonical funnel event for a graded homework submission
  | "homework_assign"
  | "class_request"
  | "room_join";

// Events that other modules (games, homework, onboarding) may emit through the
// client emitter at /api/activity/event. Keep this list in sync with the route's
// allowlist. Server-internal kinds (active/login/signup/heartbeat) are excluded.
export const CLIENT_EMITTABLE_KINDS: ActivityKind[] = [
  "signup_completed",
  "dashboard_viewed",
  "placement_started",
  "placement_completed",
  "lesson_view",
  "homework_submitted",
  "room_join",
];

interface LogOpts {
  path?: string | null;
  metadata?: Record<string, unknown>;
}

/** Append one activity event. Never throws. */
export async function logActivity(userId: string, kind: ActivityKind, opts: LogOpts = {}): Promise<void> {
  if (!userId) return;
  try {
    await svc().from("user_activity").insert({
      user_id: userId,
      kind,
      path: opts.path ?? null,
      metadata: opts.metadata ?? null,
    });
  } catch (e) {
    console.error("[activity] log failed:", (e as Error).message);
  }
}

/**
 * Does this student have a lesson scheduled on `dayKey` (their local calendar
 * day)? Used to tag the daily heartbeat so we can measure between-lesson return.
 */
async function hasLessonOnDay(userId: string, tz: string, localDay: string): Promise<boolean> {
  const s = svc();
  const { data } = await s
    .from("session_participants")
    .select("tutor_sessions(scheduled_at, status)")
    .eq("student_id", userId);
  for (const row of data || []) {
    const sess = (row as { tutor_sessions?: { scheduled_at?: string; status?: string } }).tutor_sessions;
    if (!sess?.scheduled_at) continue;
    if (sess.status && !["scheduled", "active"].includes(sess.status)) continue;
    // Compare in the user's timezone so "today" means their calendar day.
    const sessDay = new Date(sess.scheduled_at).toLocaleDateString("en-CA", { timeZone: tz });
    if (sessDay === localDay) return true;
  }
  return false;
}

/** Update last_seen_at (+ timezone), and record one 'active' event per user per day. */
export async function heartbeat(userId: string, timezone?: string): Promise<void> {
  if (!userId) return;
  const s = svc();
  try {
    const { data: u } = await s
      .from("users")
      .select("last_seen_at, timezone")
      .eq("id", userId)
      .maybeSingle();
    const now = new Date();
    const lastSeen = u?.last_seen_at ? new Date(u.last_seen_at) : null;
    const isNewDay = !lastSeen || lastSeen.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10);

    const patch: Record<string, unknown> = { last_seen_at: now.toISOString() };
    if (timezone) patch.timezone = timezone;
    await s.from("users").update(patch).eq("id", userId);

    if (isNewDay) {
      // Tag the daily active event with whether the user had a lesson scheduled
      // that calendar day. `had_lesson === false` means a between-lesson return —
      // the habit signal the growth funnel tracks.
      const tz = timezone || u?.timezone || "UTC";
      let hadLesson = false;
      try {
        const localDay = now.toLocaleDateString("en-CA", { timeZone: tz });
        hadLesson = await hasLessonOnDay(userId, tz, localDay);
      } catch { /* default false */ }
      await s
        .from("user_activity")
        .insert({ user_id: userId, kind: "active", metadata: { had_lesson: hadLesson } });
    }
  } catch (e) {
    console.error("[activity] heartbeat failed:", (e as Error).message);
  }
}
