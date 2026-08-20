// Server-side "what can this tutor actually be booked for".
//
// One function so the public picker and the booking route can never disagree:
// both call this, and the booking route re-checks the specific slot before
// taking money. Anything that narrows availability — time off, existing
// bookings, minimum notice — is applied here, once.

import { createClient } from "@supabase/supabase-js";
import {
  generateSlots,
  safeTimezone,
  type Interval,
  type Slot,
  type WeeklyRule,
} from "./slots";

/** Must match the availability editor's preview, or the two would disagree. */
export const BOOKING_DURATIONS = [25, 50];
export const BUFFER_MINUTES = 10;
export const MIN_NOTICE_HOURS = 12;
export const BOOKING_WINDOW_DAYS = 21;
/** How long a slot is held while the student is in Stripe checkout. */
export const HOLD_MINUTES = 15;

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface BookableSlot {
  /** ISO instant — what the client sends back to book. */
  start: string;
  end: string;
  durationMinutes: number;
}

export interface TutorAvailability {
  tutorId: string;
  timezone: string;
  slots: BookableSlot[];
}

/**
 * Every slot a student may book with this tutor, within the booking window.
 *
 * Expired holds are released first: a pending booking whose checkout was
 * abandoned must not keep blocking a slot, and the exclusion constraint that
 * prevents double-booking has no notion of expiry.
 */
export async function getBookableSlots(
  tutorId: string,
  opts: { durations?: number[]; now?: Date } = {}
): Promise<TutorAvailability> {
  const db = serviceClient();
  const now = opts.now ?? new Date();
  const to = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 24 * 60 * 60_000);

  // Best-effort: if this fails we simply show fewer slots, never more.
  // The query builder is a thenable, not a promise — it has no .catch, so the
  // failure has to be caught around the await.
  try {
    await db.rpc("expire_stale_bookings");
  } catch {
    // ignored on purpose
  }

  const [{ data: profile }, { data: rules }, { data: blackouts }, { data: booked }] =
    await Promise.all([
      db
        .from("tutor_public_profiles")
        .select("timezone, accepts_bookings, approval_status, is_public")
        .eq("user_id", tutorId)
        .maybeSingle(),
      db
        .from("tutor_availability")
        .select("weekday, start_minute, end_minute")
        .eq("tutor_id", tutorId),
      db
        .from("tutor_blackouts")
        .select("starts_at, ends_at")
        .eq("tutor_id", tutorId)
        .gte("ends_at", now.toISOString()),
      db
        .from("bookings")
        .select("starts_at, ends_at")
        .eq("tutor_id", tutorId)
        .in("status", ["pending_payment", "confirmed", "completed"])
        .gte("ends_at", now.toISOString()),
    ]);

  const bookable =
    profile?.approval_status === "approved" &&
    profile?.is_public &&
    profile?.accepts_bookings;

  const timezone = safeTimezone(profile?.timezone);
  if (!bookable || !rules || rules.length === 0) {
    return { tutorId, timezone, slots: [] };
  }

  const busy: Interval[] = [
    ...(blackouts ?? []).map((b) => ({
      start: new Date(b.starts_at),
      end: new Date(b.ends_at),
    })),
    ...(booked ?? []).map((b) => ({
      start: new Date(b.starts_at),
      end: new Date(b.ends_at),
    })),
  ];

  const slots = generateSlots({
    timezone,
    rules: rules as WeeklyRule[],
    busy,
    durations: opts.durations ?? BOOKING_DURATIONS,
    from: now,
    to,
    minNoticeHours: MIN_NOTICE_HOURS,
    bufferMinutes: BUFFER_MINUTES,
  });

  return {
    tutorId,
    timezone,
    slots: slots.map((s: Slot) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      durationMinutes: s.durationMinutes,
    })),
  };
}

/**
 * Whether one specific slot is still bookable. The booking route calls this
 * rather than trusting the client, so a stale page or a hand-made request
 * can't book outside the tutor's hours or on top of someone else.
 */
export async function isSlotStillBookable(
  tutorId: string,
  startIso: string,
  durationMinutes: number,
  now = new Date()
): Promise<boolean> {
  if (!BOOKING_DURATIONS.includes(durationMinutes)) return false;
  const { slots } = await getBookableSlots(tutorId, {
    durations: [durationMinutes],
    now,
  });
  return slots.some(
    (s) => s.start === startIso && s.durationMinutes === durationMinutes
  );
}
