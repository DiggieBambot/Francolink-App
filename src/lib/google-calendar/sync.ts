// The two halves of tutor Google Calendar sync.
//
//   pushBooking(bookingId)    — make the tutor's Google calendar match one lesson
//   googleBusyFor(tutorId,..) — the tutor's Google busy blocks, for slot generation
//
// Both are best-effort by design. A Google outage, a revoked token or a slow
// response must never stop a lesson being booked or confirmed: push failures
// are retried by /api/cron/google-calendar-sync, and a busy lookup that fails
// simply contributes no busy blocks (the tutor's FrancoLink hours and existing
// lessons still apply).

import { createServiceClient } from "@/lib/supabase/service";
import { toCalendarEvent } from "@/lib/booking/calendar";
import { APP_URL } from "@/lib/site/hosts";
import { open } from "./crypto";
import {
  GoogleAuthRevoked,
  accessTokenFor,
  deleteEvent,
  forgetAccessToken,
  freeBusy,
  isGoogleCalendarConfigured,
  upsertEvent,
} from "./google";

/** Statuses that mean "this lesson is on". */
const LIVE = new Set(["confirmed", "completed", "no_show_student"]);

export interface Connection {
  user_id: string;
  refresh_token_enc: string;
  calendar_id: string;
  push_enabled: boolean;
  block_busy: boolean;
  broken_at: string | null;
}

async function loadConnection(userId: string): Promise<Connection | null> {
  if (!isGoogleCalendarConfigured()) return null;
  const { data } = await createServiceClient()
    .from("google_calendar_connections")
    .select("user_id, refresh_token_enc, calendar_id, push_enabled, block_busy, broken_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data || data.broken_at) return null;
  return data as Connection;
}

async function markBroken(userId: string, reason: string) {
  forgetAccessToken(userId);
  await createServiceClient()
    .from("google_calendar_connections")
    .update({ broken_at: new Date().toISOString(), last_error: reason.slice(0, 500), updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

async function tokenFor(conn: Connection): Promise<string | null> {
  try {
    return await accessTokenFor(conn.user_id, open(conn.refresh_token_enc));
  } catch (e) {
    if (e instanceof GoogleAuthRevoked) {
      await markBroken(conn.user_id, "Google access was revoked. Reconnect to resume syncing.");
      return null;
    }
    throw e;
  }
}

/**
 * Google event ids must be base32hex (a–v, 0–9). A booking UUID without its
 * dashes is plain hex, so "fl" + that is a valid, stable id: re-pushing the
 * same lesson updates it instead of creating a duplicate.
 */
export function eventIdFor(bookingId: string): string {
  return `fl${bookingId.replace(/-/g, "").toLowerCase()}`;
}

interface BookingRow {
  id: string;
  tutor_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  duration_minutes: number;
  room_session_id: string | null;
  student: { name: string | null } | { name: string | null }[] | null;
}

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/**
 * Bring the tutor's Google calendar in line with one lesson: create/update it
 * if the lesson is on, remove it if it was cancelled. Idempotent — safe to call
 * from every place a booking changes and again from the reconcile job.
 *
 * Never throws; returns what happened for the cron's report.
 */
export async function pushBooking(
  bookingId: string
): Promise<"pushed" | "removed" | "skipped" | "unchanged" | "failed"> {
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("bookings")
      .select(
        `id, tutor_id, starts_at, ends_at, status, duration_minutes, room_session_id,
         student:users!bookings_student_id_fkey ( name )`
      )
      .eq("id", bookingId)
      .maybeSingle();
    const b = data as unknown as BookingRow | null;
    if (!b) return "skipped";

    const conn = await loadConnection(b.tutor_id);
    if (!conn || !conn.push_enabled) return "skipped";

    const { data: prior } = await db
      .from("google_calendar_events")
      .select("state, starts_at, ends_at")
      .eq("booking_id", b.id)
      .eq("user_id", b.tutor_id)
      .maybeSingle();

    const wantPresent = LIVE.has(b.status);
    const sameTimes =
      prior &&
      new Date(prior.starts_at).getTime() === new Date(b.starts_at).getTime() &&
      new Date(prior.ends_at).getTime() === new Date(b.ends_at).getTime();

    if (wantPresent && prior?.state === "present" && sameTimes) return "unchanged";
    if (!wantPresent && (!prior || prior.state === "removed")) return "unchanged";

    const token = await tokenFor(conn);
    if (!token) return "failed";

    const eventId = eventIdFor(b.id);

    if (wantPresent) {
      const roomUrl = b.room_session_id ? `${APP_URL}/room/${b.room_session_id}` : null;
      const e = toCalendarEvent(
        {
          id: b.id,
          starts_at: b.starts_at,
          ends_at: b.ends_at,
          status: b.status,
          duration_minutes: b.duration_minutes,
          student_name: one(b.student)?.name ?? null,
          room_url: roomUrl,
        },
        "tutor",
        APP_URL
      );
      await upsertEvent(token, conn.calendar_id, eventId, {
        summary: e.title,
        description: e.description,
        location: e.location,
        start: { dateTime: e.start.toISOString() },
        end: { dateTime: e.end.toISOString() },
        source: { title: "FrancoLink", url: roomUrl || `${APP_URL}/tutor/sessions` },
        extendedProperties: { private: { francolinkBookingId: b.id } },
        reminders: { useDefault: true },
      });
    } else {
      await deleteEvent(token, conn.calendar_id, eventId);
    }

    await db.from("google_calendar_events").upsert(
      {
        booking_id: b.id,
        user_id: b.tutor_id,
        google_event_id: eventId,
        state: wantPresent ? "present" : "removed",
        starts_at: b.starts_at,
        ends_at: b.ends_at,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "booking_id,user_id" }
    );

    return wantPresent ? "pushed" : "removed";
  } catch (e) {
    console.error("[google-calendar] push failed", bookingId, e);
    return "failed";
  }
}

/* ------------------------------------------------------------ busy pull ---- */

/**
 * Short per-process cache. A student flicking between weeks on a tutor's
 * profile, then booking, would otherwise hit Google three or four times in a
 * minute; a couple of minutes' staleness is fine because the booking route
 * re-checks with a fresh lookup (`fresh: true`).
 */
const busyCache = new Map<string, { at: number; from: number; to: number; busy: { start: Date; end: Date }[] }>();
const BUSY_TTL_MS = 2 * 60_000;

export async function googleBusyFor(
  tutorId: string,
  from: Date,
  to: Date,
  opts: { fresh?: boolean } = {}
): Promise<{ start: Date; end: Date }[]> {
  try {
    const hit = busyCache.get(tutorId);
    if (
      !opts.fresh &&
      hit &&
      Date.now() - hit.at < BUSY_TTL_MS &&
      hit.from <= from.getTime() &&
      hit.to >= to.getTime()
    ) {
      return hit.busy;
    }

    const conn = await loadConnection(tutorId);
    if (!conn || !conn.block_busy) return [];
    const token = await tokenFor(conn);
    if (!token) return [];

    const busy = await freeBusy(token, conn.calendar_id, from, to);
    busyCache.set(tutorId, { at: Date.now(), from: from.getTime(), to: to.getTime(), busy });
    return busy;
  } catch (e) {
    console.error("[google-calendar] freeBusy failed for tutor", tutorId, e);
    return [];
  }
}
