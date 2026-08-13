// Calendar export for lessons.
//
// Two mechanisms, both one-way and neither needing OAuth or a Google Cloud
// project:
//
//   * A per-booking "Add to Google Calendar" link — instant, one lesson.
//   * A personal ICS feed the tutor or student subscribes to once, which then
//     tracks every lesson. Google refreshes subscribed feeds on its own
//     schedule (often hours), so the per-booking link stays the fast path.
//
// `toCalendarEvent` deliberately produces a plain event shape rather than ICS
// text directly: when two-way Google sync is added, the OAuth pusher can reuse
// it unchanged and only the serialiser differs.

export interface CalendarEvent {
  uid: string;
  start: Date;
  end: Date;
  title: string;
  description: string;
  /** Join URL — becomes the ICS LOCATION and the Google `location` field. */
  location: string;
  /** Bumped on every change so subscribers pick up edits. */
  sequence: number;
  cancelled: boolean;
}

export interface BookingForCalendar {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  duration_minutes: number;
  tutor_name?: string | null;
  student_name?: string | null;
  room_url?: string | null;
}

/** Who the event is being generated for — changes the title and wording. */
export type CalendarAudience = "tutor" | "student";

export function toCalendarEvent(
  booking: BookingForCalendar,
  audience: CalendarAudience,
  appUrl: string
): CalendarEvent {
  const other =
    audience === "tutor"
      ? booking.student_name || "your student"
      : booking.tutor_name || "your FrancoLink tutor";

  const cancelled = booking.status.startsWith("cancelled");
  const join = booking.room_url || `${appUrl}/dashboard`;

  return {
    // Stable per booking so an update replaces rather than duplicates.
    uid: `booking-${booking.id}@francolink.net`,
    start: new Date(booking.starts_at),
    end: new Date(booking.ends_at),
    title: cancelled
      ? `Cancelled: FrancoLink lesson with ${other}`
      : `FrancoLink lesson with ${other}`,
    description: [
      `${booking.duration_minutes}-minute lesson with ${other}.`,
      "",
      `Join here: ${join}`,
      "",
      "Free cancellation up to 12 hours before the lesson.",
    ].join("\n"),
    location: join,
    sequence: 0,
    cancelled,
  };
}

/* ------------------------------------------------------------------ ICS ---- */

/** ICS wants 20260812T140000Z. */
function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * ICS escaping: backslash, semicolon, comma and newline are all special.
 * Getting this wrong doesn't error — it silently corrupts the feed, which is
 * why it's a named function rather than inline.
 */
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 asks for lines under 75 octets, folded with a leading space. */
function fold(line: string): string {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length > 72) {
    parts.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  if (rest.length) parts.push(" " + rest);
  return parts.join("\r\n");
}

export function toIcsCalendar(events: CalendarEvent[], name: string): string {
  const now = icsStamp(new Date());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FrancoLink//Lessons//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(name)}`,
    // Hint to clients how often to re-poll. Google largely ignores it, but
    // Apple Calendar and Outlook honour it.
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsStamp(e.start)}`,
      `DTEND:${icsStamp(e.end)}`,
      `SEQUENCE:${e.sequence}`,
      fold(`SUMMARY:${icsEscape(e.title)}`),
      fold(`DESCRIPTION:${icsEscape(e.description)}`),
      fold(`LOCATION:${icsEscape(e.location)}`),
      // A cancelled lesson is published as CANCELLED rather than dropped, so
      // subscribers actually remove it instead of keeping a stale event.
      `STATUS:${e.cancelled ? "CANCELLED" : "CONFIRMED"}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/* --------------------------------------------------- Add to Google link ---- */

/** Google's template URL wants 20260812T140000Z/20260812T145000Z. */
export function googleCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${icsStamp(e.start)}/${icsStamp(e.end)}`,
    details: e.description,
    location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Outlook / Office 365, for the same event. */
export function outlookCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: e.title,
    startdt: e.start.toISOString(),
    enddt: e.end.toISOString(),
    body: e.description,
    location: e.location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
