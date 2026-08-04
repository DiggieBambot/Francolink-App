// Turns a tutor's recurring weekly availability into concrete bookable slots.
//
// Everything here is pure and works in UTC instants. The only timezone-aware
// step is expanding a weekly rule (e.g. "Mondays 09:00–12:00 in Europe/Paris")
// into real UTC instants for specific dates — which must respect daylight
// saving, since 09:00 Paris is 07:00 UTC in winter and 08:00 UTC in summer.
//
// Keeping this pure means it can be tested without a database, and the same
// function decides what to show a student and what the booking route accepts.

export interface WeeklyRule {
  /** 0 = Sunday … 6 = Saturday, in the tutor's own timezone. */
  weekday: number;
  /** Minutes from midnight, in the tutor's own timezone. */
  start_minute: number;
  end_minute: number;
}

export interface Interval {
  start: Date;
  end: Date;
}

export interface Slot {
  start: Date;
  end: Date;
  durationMinutes: number;
}

export interface SlotOptions {
  /** The tutor's IANA timezone, e.g. "Europe/Paris". */
  timezone: string;
  rules: WeeklyRule[];
  /** Live bookings and one-off blackouts — a slot may not overlap these. */
  busy: Interval[];
  /** Lesson lengths to offer, e.g. [25, 50]. */
  durations: number[];
  /** Start of the window to generate for (usually now). */
  from: Date;
  /** End of the window (usually now + 21 days). */
  to: Date;
  /** A student may not book closer than this to the lesson start. */
  minNoticeHours: number;
  /**
   * Gap left after each lesson, so back-to-back bookings don't collide.
   * A 50-minute lesson in a 60-minute slot means buffer = 10.
   */
  bufferMinutes: number;
  /**
   * Slots are offered on this cadence within an availability block. 30 means
   * a 09:00–12:00 block offers 09:00, 09:30, 10:00 … rather than every minute.
   */
  stepMinutes?: number;
}

const MINUTE = 60_000;

/**
 * The UTC offset, in minutes, that `timeZone` was at a given instant.
 * Derived from Intl rather than a timezone table, so it is DST-correct and
 * needs no dependency.
 */
function offsetMinutesAt(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  // What the wall clock reads in that zone, read back as if it were UTC.
  const asUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
  return (asUTC - instant.getTime()) / MINUTE;
}

/**
 * Converts a wall-clock time in `timeZone` to the matching UTC instant.
 *
 * Offset depends on the instant, and the instant depends on the offset, so we
 * resolve iteratively — twice is enough for every real zone, including DST
 * transition days.
 */
export function zonedTimeToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  minutesFromMidnight: number,
  timeZone: string
): Date {
  const naive = Date.UTC(year, month - 1, day, 0, minutesFromMidnight);
  let instant = new Date(naive);
  for (let i = 0; i < 2; i++) {
    const offset = offsetMinutesAt(instant, timeZone);
    instant = new Date(naive - offset * MINUTE);
  }
  return instant;
}

/** The calendar date, in `timeZone`, that an instant falls on. */
function zonedDateParts(instant: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = dtf.formatToParts(instant);
  const val = (t: string) => parts.find((p) => p.type === t)!.value;
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return {
    year: Number(val("year")),
    month: Number(val("month")),
    day: Number(val("day")),
    weekday: weekdayMap[val("weekday")],
  };
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Every slot a student may book, sorted by start time.
 *
 * A slot is offered only if the lesson *plus its buffer* fits inside an
 * availability block and touches nothing busy — otherwise a 50-minute booking
 * at the end of a block would run past the tutor's finish time.
 */
export function generateSlots(options: SlotOptions): Slot[] {
  const {
    timezone,
    rules,
    busy,
    durations,
    from,
    to,
    minNoticeHours,
    bufferMinutes,
    stepMinutes = 30,
  } = options;

  if (rules.length === 0 || durations.length === 0) return [];

  const earliest = new Date(from.getTime() + minNoticeHours * 60 * MINUTE);
  const slots: Slot[] = [];

  // Walk day by day in the tutor's zone. Start one day early so a block that
  // begins late in the previous local day is not missed by UTC skew.
  const cursor = new Date(from.getTime() - 24 * 60 * MINUTE);
  const lastDay = new Date(to.getTime() + 24 * 60 * MINUTE);

  while (cursor <= lastDay) {
    const { year, month, day, weekday } = zonedDateParts(cursor, timezone);

    for (const rule of rules) {
      if (rule.weekday !== weekday) continue;

      const blockStart = zonedTimeToUtc(year, month, day, rule.start_minute, timezone);
      const blockEnd = zonedTimeToUtc(year, month, day, rule.end_minute, timezone);

      for (const duration of durations) {
        const needed = (duration + bufferMinutes) * MINUTE;

        for (
          let t = blockStart.getTime();
          t + needed <= blockEnd.getTime() + bufferMinutes * MINUTE;
          t += stepMinutes * MINUTE
        ) {
          const start = new Date(t);
          const end = new Date(t + duration * MINUTE);

          // The lesson itself must finish within the block.
          if (end.getTime() > blockEnd.getTime()) break;
          if (start < earliest) continue;
          if (start < from || start > to) continue;

          // Reserve the buffer too, so the next lesson can't start immediately.
          const held: Interval = {
            start,
            end: new Date(end.getTime() + bufferMinutes * MINUTE),
          };
          if (busy.some((b) => overlaps(held, b))) continue;

          slots.push({ start, end, durationMinutes: duration });
        }
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Deduplicate: a slot can be produced twice around a DST shift.
  const seen = new Set<string>();
  return slots
    .filter((s) => {
      const key = `${s.start.getTime()}-${s.durationMinutes}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime() || a.durationMinutes - b.durationMinutes);
}

/**
 * Whether one specific slot is bookable. The booking route calls this rather
 * than trusting the client, so a stale or hand-crafted request can't book
 * outside the tutor's hours.
 */
export function isSlotBookable(
  start: Date,
  durationMinutes: number,
  options: Omit<SlotOptions, "durations" | "from" | "to"> & { now: Date }
): boolean {
  const slots = generateSlots({
    ...options,
    durations: [durationMinutes],
    from: options.now,
    // A one-minute window around the requested start is enough to test it.
    to: new Date(start.getTime() + MINUTE),
  });
  return slots.some(
    (s) => s.start.getTime() === start.getTime() && s.durationMinutes === durationMinutes
  );
}
