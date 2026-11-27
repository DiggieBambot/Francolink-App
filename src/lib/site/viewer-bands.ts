// Re-cut a tutor's weekly availability into the VIEWER's time zone.
//
// Tutors enter availability as weekday + minutes in their own zone. The
// directory's "Morning / Afternoon / Evening" and weekday filters are asked
// from the student's side ("I'm free Tuesday evening"), so a Paris tutor free
// 18:00–20:00 must count as a Toronto student's Tuesday *afternoon*, not
// evening. queries.ts cuts bands in the tutor's zone (all a server can do
// without knowing the visitor); this redoes it in the browser.
//
// Approach: walk each slot in 30-minute steps, place each step on a real date
// in the coming week (so DST is whatever it is this week), and read off the
// viewer's weekday and minute. Coarse on purpose — the bands are three per day.

import type { AvailabilitySlot } from "@/lib/site/queries";
import { TIME_BANDS } from "@/lib/site/queries";

const STEP = 30;

/** Minutes the zone is ahead of UTC at `at`. Throws on an invalid zone. */
function offsetMinutes(timeZone: string, at: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(at));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((asUtc - Math.floor(at / 60_000) * 60_000) / 60_000);
}

/** Weekday (0 = Sun) and minute-of-day of an instant in a zone. */
function localWeekdayMinute(timeZone: string, at: number): { weekday: number; minute: number } {
  const shifted = new Date(at + offsetMinutes(timeZone, at) * 60_000);
  return {
    weekday: shifted.getUTCDay(),
    minute: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

export function isValidTimeZone(tz: string | null | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * "weekday-band" keys (e.g. "2-evening") for these tutor slots, as seen from
 * `viewerTz`. Returns null when either zone is unusable, so the caller can
 * fall back to the tutor-zone bands rather than pretend the tutor is never free.
 */
export function viewerBands(
  slots: AvailabilitySlot[],
  tutorTz: string | null,
  viewerTz: string | null,
  now: number = Date.now()
): string[] | null {
  if (!isValidTimeZone(tutorTz) || !isValidTimeZone(viewerTz)) return null;

  // Midnight UTC of today, used to find a concrete date for each weekday.
  const today = new Date(now);
  const base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  const out = new Set<string>();
  for (const slot of slots) {
    // The next calendar date (UTC) that falls on the slot's weekday.
    const dayOffset = (slot.weekday - today.getUTCDay() + 7) % 7;
    const dayStart = base + dayOffset * 86_400_000;

    for (let m = slot.start_minute; m < slot.end_minute; m += STEP) {
      // Wall-clock time in the tutor's zone → instant. Two passes settle the
      // offset on DST-change days.
      const wall = dayStart + m * 60_000;
      let at = wall - offsetMinutes(tutorTz, wall) * 60_000;
      at = wall - offsetMinutes(tutorTz, at) * 60_000;

      const v = localWeekdayMinute(viewerTz, at);
      for (const band of TIME_BANDS) {
        if (v.minute >= band.from && v.minute < band.to) out.add(`${v.weekday}-${band.key}`);
      }
    }
  }
  return [...out];
}
