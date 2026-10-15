"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock, Gift, Globe2, Loader2 } from "lucide-react";
import type { BookableSlot } from "@/lib/booking/availability";
import { formatPrice } from "@/lib/site/pricing";
import { cn } from "@/lib/utils";

/**
 * Slot picker on a tutor's public profile.
 *
 * Lessons are paid for out of a plan or a starter pack, never one at a time,
 * so the prices shown are the real ones: what a lesson costs on a plan, and
 * the pack. A per-lesson "Book — $X" here used to quote a number checkout
 * never charged. The free 25-minute first lesson is called out because it is
 * the reason to pick a 2+ lessons-a-week plan.
 *
 * Times render in the VISITOR's timezone, not the tutor's. Showing a Douala
 * clock to someone in Montreal is how people miss lessons — the tutor's zone is
 * shown once, as context, and never used for the times themselves.
 */
export function SlotPicker({
  slots,
  tutorTimezone,
  tutorName,
  tutorSlug,
  pricing,
  appUrl,
  profileUrl,
}: {
  slots: BookableSlot[];
  tutorTimezone: string;
  tutorName: string;
  tutorSlug: string;
  pricing: {
    /** Cheapest a 50-minute lesson gets on a plan covering this tutor. */
    planFromCents: number | null;
    pack: { lessons: number; priceCents: number } | null;
    currency: string;
    /** Plans of this many lessons a week or more include the free lesson. */
    freeTrialMinPerWeek: number;
    freeTrialMinutes: number;
  };
  appUrl: string;
  profileUrl: string;
}) {
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const durations = useMemo(
    () => [...new Set(slots.map((s) => s.durationMinutes))].sort((a, b) => a - b),
    [slots]
  );
  const [duration, setDuration] = useState<number | null>(durations[0] ?? null);
  const [selected, setSelected] = useState<string | null>(null);

  // The visitor's own zone, resolved in the browser.
  const viewerTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  const forDuration = slots.filter(
    (s) => duration === null || s.durationMinutes === duration
  );

  // Group by the visitor's local day.
  const days = useMemo(() => {
    const map = new Map<string, BookableSlot[]>();
    for (const s of forDuration) {
      const key = new Date(s.start).toLocaleDateString("en-CA", {
        timeZone: viewerTz,
      });
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [forDuration, viewerTz]);

  /**
   * Hands off to the app host rather than calling its API from here.
   *
   * The session cookie belongs to app.francolink.net, so a cross-origin fetch
   * from the website would need third-party cookies — which Safari blocks
   * outright and Chrome is phasing out. Navigating makes the request
   * first-party, and /book picks it up from there.
   */
  function book(slot: BookableSlot) {
    setBooking(true);
    setBookError(null);
    const params = new URLSearchParams({
      tutor: tutorSlug,
      start: slot.start,
      duration: String(slot.durationMinutes),
      from: profileUrl,
    });
    window.location.href = `${appUrl}/book?${params.toString()}`;
  }

  const money = (cents: number) => formatPrice(cents, pricing.currency);

  /** What a lesson of this length costs, in the units students actually buy. */
  const costLine = (mins: number) => {
    const share = mins >= 50 ? 1 : 0.5;
    const parts = [
      share === 1 ? "Uses 1 lesson from your plan or pack" : "Uses half a lesson from your plan or pack",
    ];
    if (pricing.planFromCents) {
      parts.push(`plans from ${money(Math.round(pricing.planFromCents * share))}`);
    }
    return parts.join(" · ");
  };

  if (slots.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 text-center">
        <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">
          {tutorName.split(" ")[0]} has no open slots in the next three weeks.
          Message them after booking a first lesson to arrange a time.
        </p>
      </div>
    );
  }

  // Within the chosen length: the same start time exists once per duration,
  // and picking 15:00 in the 50-minute view must not book the 25-minute slot.
  const chosen = forDuration.find((s) => s.start === selected);
  const freeTrialNote = `Your first ${pricing.freeTrialMinutes}-minute lesson is free with a plan of ${pricing.freeTrialMinPerWeek} or more lessons a week.`;

  return (
    <div>
      <div className="mb-5 p-4 rounded-2xl bg-secondary-50 border border-secondary-100 text-sm text-gray-700">
        <p className="flex items-start gap-2 font-semibold text-primary">
          <Gift className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
          {freeTrialNote}
        </p>
        {(pricing.planFromCents || pricing.pack) && (
          <p className="mt-1.5 pl-6 text-gray-600">
            {pricing.planFromCents && (
              <>Lessons from {money(pricing.planFromCents)} (50 min) on a plan</>
            )}
            {pricing.planFromCents && pricing.pack && ", or "}
            {pricing.pack && (
              <>
                {pricing.planFromCents ? "a" : "A"} {pricing.pack.lessons}-lesson starter
                pack for {money(pricing.pack.priceCents)}
              </>
            )}
            .
          </p>
        )}
      </div>

      {durations.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-sm font-bold text-primary mr-1">Lesson length</span>
          {durations.map((d) => {
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDuration(d);
                  setSelected(null);
                }}
                aria-pressed={duration === d}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-colors",
                  duration === d
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {d} min
              </button>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <Globe2 className="w-3.5 h-3.5" />
        Times shown in your timezone ({viewerTz}). {tutorName.split(" ")[0]}{" "}
        teaches from {tutorTimezone}.
      </p>

      <div className="space-y-4 max-h-[26rem] overflow-y-auto pr-1">
        {days.map(([day, daySlots]) => (
          <div key={day}>
            <h4 className="font-heading font-bold text-sm text-primary mb-2">
              {new Date(daySlots[0].start).toLocaleDateString("en-GB", {
                timeZone: viewerTz,
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h4>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((s) => (
                <button
                  key={`${s.start}-${s.durationMinutes}`}
                  type="button"
                  onClick={() => setSelected(s.start)}
                  aria-pressed={selected === s.start}
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm font-semibold tabular-nums transition-colors",
                    selected === s.start
                      ? "bg-primary text-white"
                      : "bg-success-light text-green-800 hover:bg-green-100"
                  )}
                >
                  {new Date(s.start).toLocaleTimeString("en-GB", {
                    timeZone: viewerTz,
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {chosen && (
        <div className="mt-6 p-5 rounded-2xl bg-primary-50 border border-primary-100">
          <p className="flex items-center gap-2 font-heading font-bold text-primary">
            <Clock className="w-4 h-4" />
            {new Date(chosen.start).toLocaleString("en-GB", {
              timeZone: viewerTz,
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" · "}
            {chosen.durationMinutes} min
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {chosen.durationMinutes === pricing.freeTrialMinutes
              ? `Free if it's your first lesson and you're on a plan of ${pricing.freeTrialMinPerWeek}+ lessons a week. Otherwise: ${costLine(chosen.durationMinutes).toLowerCase()}.`
              : `${costLine(chosen.durationMinutes)}.`}
          </p>
          <button
            type="button"
            onClick={() => book(chosen)}
            disabled={booking}
            className="inline-flex items-center justify-center gap-2 mt-4 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-800 disabled:opacity-60"
          >
            {booking && <Loader2 className="w-4 h-4 animate-spin" />}
            {booking ? "Starting checkout…" : "Book this slot"}
          </button>
          {bookError && (
            <p className="mt-3 text-sm text-red-600">{bookError}</p>
          )}
          <p className="mt-3 text-xs text-gray-500">
            Free cancellation up to 12 hours before the lesson.
          </p>
        </div>
      )}
    </div>
  );
}
