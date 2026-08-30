// Telling both people about a lesson: booked, cancelled, starting soon.
//
// Every one of those events has to reach two people through three channels —
// in-app inbox, web push, and email — and each person needs the time written in
// their own timezone. That is enough shared machinery that doing it inline at
// the three call sites would have meant writing the timezone handling three
// times and getting it subtly different three times.
//
// Nothing here throws. A lesson that is booked and paid for must stay booked
// even if Resend is down, so every failure is logged and swallowed.

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notifyUser } from "@/lib/notifications/create";
import { sendTransactionalEmail, firstNameOf } from "@/lib/email/transactional";
import {
  renderLessonBooked,
  renderLessonCancelled,
  renderLessonReminder,
  type LessonEmailFacts,
} from "@/lib/email/booking";
import { toCalendarEvent, toIcsCalendar } from "@/lib/booking/calendar";
import { APP_URL } from "@/lib/site/hosts";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

interface Party {
  id: string;
  name: string | null;
  email: string | null;
  timezone: string | null;
}

export interface BookingContext {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  duration_minutes: number;
  room_session_id: string | null;
  tutor: Party;
  student: Party;
}

/* ------------------------------------------------------------- loading ---- */

/** Everything the three channels need, in one query. Null if the row is gone. */
export async function loadBookingContext(
  bookingId: string
): Promise<BookingContext | null> {
  const { data, error } = await svc()
    .from("bookings")
    .select(
      `id, starts_at, ends_at, status, duration_minutes, room_session_id,
       tutor:users!bookings_tutor_id_fkey ( id, name, email, timezone ),
       student:users!bookings_student_id_fkey ( id, name, email, timezone )`
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[booking/notify] context load failed", bookingId, error);
    return null;
  }

  const one = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;

  const tutor = one(data.tutor as unknown as Party | Party[] | null);
  const student = one(data.student as unknown as Party | Party[] | null);
  if (!tutor || !student) return null;

  return { ...(data as unknown as BookingContext), tutor, student };
}

/* ---------------------------------------------------------- formatting ---- */

/**
 * A lesson time as the recipient reads it.
 *
 * An unset or invalid timezone falls back to UTC with the zone name shown, so
 * the reader can at least tell that it is not local time — silently printing
 * UTC as if it were theirs is how someone misses a lesson by five hours.
 */
function formatWhen(
  startsAt: string,
  timezone: string | null
): { whenLong: string; whenShort: string } {
  const d = new Date(startsAt);
  const tz = timezone || "UTC";

  const fmt = (opts: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: tz }).format(d);
    } catch {
      return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" }).format(d);
    }
  };

  return {
    whenLong: fmt({
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }),
    whenShort: fmt({
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function joinUrl(b: BookingContext): string {
  return b.room_session_id ? `${APP_URL}/room/${b.room_session_id}` : `${APP_URL}/dashboard`;
}

function factsFor(b: BookingContext, audience: "tutor" | "student"): LessonEmailFacts {
  const me = audience === "tutor" ? b.tutor : b.student;
  const other = audience === "tutor" ? b.student : b.tutor;
  const { whenLong, whenShort } = formatWhen(b.starts_at, me.timezone);

  return {
    whenLong,
    whenShort,
    otherName: other.name || (audience === "tutor" ? "your student" : "your tutor"),
    durationMinutes: b.duration_minutes,
    joinUrl: joinUrl(b),
  };
}

/** The .ics for one participant, ready to attach. */
function icsFor(b: BookingContext, audience: "tutor" | "student"): string {
  const event = toCalendarEvent(
    {
      id: b.id,
      starts_at: b.starts_at,
      ends_at: b.ends_at,
      status: b.status,
      duration_minutes: b.duration_minutes,
      tutor_name: b.tutor.name,
      student_name: b.student.name,
      room_url: b.room_session_id ? `${APP_URL}/room/${b.room_session_id}` : null,
    },
    audience,
    APP_URL
  );
  return toIcsCalendar([event], "FrancoLink lesson");
}

/* ------------------------------------------------------------- sending ---- */

/**
 * Lesson confirmed — both sides, all three channels.
 *
 * Called from confirmBooking, which is the single point every payment path
 * funnels through, so a lesson bought with credits and one bought through
 * Stripe produce identical mail.
 */
export async function notifyBookingConfirmed(bookingId: string): Promise<void> {
  const b = await loadBookingContext(bookingId);
  if (!b) return;

  await Promise.all(
    (["student", "tutor"] as const).map(async (audience) => {
      const me = audience === "tutor" ? b.tutor : b.student;
      const f = factsFor(b, audience);

      await notifyUser({
        userId: me.id,
        type: "lesson_booked",
        title: audience === "tutor" ? "New lesson booked" : "Lesson confirmed",
        body: `${f.whenLong} with ${f.otherName}`,
        url: `/lessons/booked`,
      });

      if (!me.email) return;
      const { subject, html, text } = renderLessonBooked(
        firstNameOf(me.name, me.email),
        f,
        audience
      );
      await sendTransactionalEmail(me.email, subject, html, text, [
        {
          filename: "lesson.ics",
          content: icsFor(b, audience),
          contentType: "text/calendar",
        },
      ]);
    })
  );
}

/**
 * Lesson cancelled. `cancelledBy` is a user id.
 *
 * `outcome` carries one sentence per side, worked out by the cancel route and
 * passed in rather than recomputed here — otherwise the email could contradict
 * the API response the canceller just read on screen. The two sides differ
 * because they care about different money: the student's refund, the tutor's
 * pay for a slot they held.
 */
export async function notifyBookingCancelled(
  bookingId: string,
  cancelledBy: string,
  outcome: { student: string; tutor: string }
): Promise<void> {
  const b = await loadBookingContext(bookingId);
  if (!b) return;

  await Promise.all(
    (["student", "tutor"] as const).map(async (audience) => {
      const me = audience === "tutor" ? b.tutor : b.student;
      const f = factsFor(b, audience);
      const byRecipient = me.id === cancelledBy;

      await notifyUser({
        userId: me.id,
        type: "lesson_cancelled",
        title: byRecipient ? "Lesson cancelled" : `${f.otherName} cancelled your lesson`,
        body: f.whenLong,
        url: audience === "student" ? "/lessons/booked" : "/tutor",
      });

      if (!me.email) return;
      const { subject, html, text } = renderLessonCancelled(
        firstNameOf(me.name, me.email),
        f,
        audience,
        byRecipient,
        outcome[audience]
      );
      await sendTransactionalEmail(me.email, subject, html, text);
    })
  );
}

/**
 * A reminder for one participant.
 *
 * '24h' gets email plus push — there is time to act on it. '15m' is push only:
 * mail that arrives two minutes before a lesson is read after it.
 */
export async function notifyLessonReminder(
  b: BookingContext,
  audience: "tutor" | "student",
  kind: "24h" | "15m"
): Promise<void> {
  const me = audience === "tutor" ? b.tutor : b.student;
  const f = factsFor(b, audience);

  await notifyUser({
    userId: me.id,
    type: `lesson_reminder_${kind}`,
    title: kind === "24h" ? "Lesson tomorrow" : "Your lesson starts soon",
    body:
      kind === "24h"
        ? `${f.whenLong} with ${f.otherName}`
        : `With ${f.otherName}, in about 15 minutes. Tap to join.`,
    // Straight into the room for the imminent one: at that point the only
    // thing anybody wants is the join button.
    url:
      kind === "15m"
        ? b.room_session_id
          ? `/room/${b.room_session_id}`
          : "/dashboard"
        : "/lessons/booked",
  });

  if (kind !== "24h" || !me.email) return;

  const { subject, html, text } = renderLessonReminder(
    firstNameOf(me.name, me.email),
    f,
    audience
  );
  await sendTransactionalEmail(me.email, subject, html, text, [
    { filename: "lesson.ics", content: icsFor(b, audience), contentType: "text/calendar" },
  ]);
}
