// When is a room's class actually on?
//
// A room is a permanent shared space for one tutor/student pair (see
// lesson-space.ts) — the same row is reused by every lesson they ever book. So
// "can these two have a class right now?" is not a property of the room, it is
// a property of whether a BOOKING covers this moment, and until this file
// existed nothing asked.
//
// Two rules come out of that, and the whole feature is these two rules:
//
//   1. Video is only live inside a booking's window. The room itself always
//      opens — chat history, past material, homework are the pair's shared
//      space and taking those away outside class hours would remove something
//      they rely on. The CALL is what is scheduled.
//
//   2. The class has a hard end. A 25-minute lesson gets 30 minutes of room,
//      a 50-minute lesson gets 60. That padding IS the grace period, so there
//      is no extension: overrunning eats the tutor's next slot, and every
//      minute of video is a real cost against a lesson already paid for.
//
// The clock runs from the SCHEDULED start, not from when someone joined. A
// 10:00 25-minute class ends at 10:30 for everybody: back-to-back slots can
// never collide, both sides see the same countdown without negotiating one,
// the deadline exists before anyone has joined, and a tutor who turns up late
// eats their own delay rather than the next student's lesson.
//
// A room NO booking has ever referenced — an independent tutor's own
// classroom, a group link room, the student_id === tutor_id sentinel — is not
// a scheduled room and is untouched by any of this.

import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * How much room a paid lesson gets, keyed by the duration billed.
 *
 * Mirrors the `duration_minutes in (25, 50)` check on bookings — if a third
 * duration is ever sold, it must appear here or it falls back to no cap.
 */
export const CLASS_CAP_MINUTES: Record<number, number> = { 25: 30, 50: 60 };

/** Video comes up this long before the scheduled start, for device checks. */
export const OPEN_EARLY_MINUTES = 10;

export interface ScheduledClass {
  bookingId: string;
  durationMinutes: number;
  /** Scheduled start. */
  startsAt: string;
  /** When video unlocks: startsAt - OPEN_EARLY_MINUTES. */
  opensAt: string;
  /** When the call is cut: startsAt + the cap for this duration. */
  hardEndsAt: string;
}

export type ClassWindow =
  /** No booking has ever used this room — it is a free-form space, video always on. */
  | { kind: "unscheduled" }
  /** A booking's window covers this moment. */
  | { kind: "open"; current: ScheduledClass }
  /** This room is scheduled, but not right now. */
  | { kind: "closed"; next: ScheduledClass | null };

interface BookingRow {
  id: string;
  starts_at: string;
  duration_minutes: number;
  status: string;
}

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function toScheduled(b: BookingRow): ScheduledClass {
  const startsAt = new Date(b.starts_at);
  // No cap for a duration we do not sell: better to leave such a lesson
  // uncapped than to cut it at a number nobody agreed to.
  const cap = CLASS_CAP_MINUTES[b.duration_minutes] ?? b.duration_minutes;
  return {
    bookingId: b.id,
    durationMinutes: b.duration_minutes,
    startsAt: startsAt.toISOString(),
    opensAt: new Date(startsAt.getTime() - OPEN_EARLY_MINUTES * 60_000).toISOString(),
    hardEndsAt: new Date(startsAt.getTime() + cap * 60_000).toISOString(),
  };
}

/**
 * Resolve the class window for a room.
 *
 * Deliberately reads bookings fresh every time rather than trusting the
 * columns it writes: a booking that is moved or cancelled must change the
 * answer immediately, and a cached deadline that outlives its booking is
 * exactly the bug this is meant to prevent.
 *
 * `persist` writes the resolved window back onto the session so the room, the
 * video-token route and the sweeper all read one authoritative instant instead
 * of each recomputing a slightly different one.
 */
export async function resolveClassWindow(
  sessionId: string,
  opts: { now?: Date; persist?: boolean } = {}
): Promise<ClassWindow> {
  const now = opts.now ?? new Date();
  const db = service();

  // A day either side is plenty: the longest window is opensAt (-10m) to
  // hardEndsAt (+60m), and the "next class" hint only needs the nearest one.
  const from = new Date(now.getTime() - 24 * 3600_000).toISOString();
  const to = new Date(now.getTime() + 24 * 3600_000).toISOString();

  const { data: nearby } = await db
    .from("bookings")
    .select("id, starts_at, duration_minutes, status")
    .eq("room_session_id", sessionId)
    .in("status", ["confirmed", "completed"])
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true });

  const rows = (nearby || []) as BookingRow[];

  if (rows.length === 0) {
    // Nothing nearby is not the same as never scheduled. Ask whether this room
    // has EVER been booked before declaring it a free-form space — otherwise a
    // pair whose only lesson is next week would silently get ungated video.
    const { count } = await db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("room_session_id", sessionId)
      .in("status", ["confirmed", "completed"]);
    if (!count) return { kind: "unscheduled" };
  }

  const t = now.getTime();
  const scheduled = rows.map(toScheduled);

  const current =
    scheduled.find(
      (s) =>
        t >= new Date(s.opensAt).getTime() && t < new Date(s.hardEndsAt).getTime()
    ) ?? null;

  if (opts.persist) {
    // Fire-and-forget: a failed cache write must never keep two people out of
    // a class they paid for. The video-token route resolves for itself anyway.
    void db
      .from("tutor_lesson_sessions")
      .update({
        current_booking_id: current?.bookingId ?? null,
        hard_ends_at: current?.hardEndsAt ?? null,
      })
      .eq("id", sessionId)
      .then(undefined, () => {});
  }

  if (current) return { kind: "open", current };

  let next = scheduled.find((s) => new Date(s.opensAt).getTime() > t) ?? null;
  if (!next) {
    // Their next lesson is further out than the ±24h scan. Look it up rather
    // than telling them "no upcoming class" when there plainly is one — that
    // line is the whole point of the closed state.
    const { data: later } = await db
      .from("bookings")
      .select("id, starts_at, duration_minutes, status")
      .eq("room_session_id", sessionId)
      .eq("status", "confirmed")
      .gt("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    next = later ? toScheduled(later as BookingRow) : null;
  }
  return { kind: "closed", next };
}
