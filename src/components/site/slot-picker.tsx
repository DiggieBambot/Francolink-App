"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock, Globe2 } from "lucide-react";
import type { BookableSlot } from "@/lib/booking/availability";
import { formatPrice, type TierPrice } from "@/lib/site/pricing";
import { cn } from "@/lib/utils";

/**
 * Slot picker on a tutor's public profile.
 *
 * Times render in the VISITOR's timezone, not the tutor's. Showing a Douala
 * clock to someone in Montreal is how people miss lessons — the tutor's zone is
 * shown once, as context, and never used for the times themselves.
 */
export function SlotPicker({
  slots,
  tutorTimezone,
  tutorName,
  prices,
  trial,
  trialAvailable,
  bookHref,
}: {
  slots: BookableSlot[];
  tutorTimezone: string;
  tutorName: string;
  prices: TierPrice[];
  trial: TierPrice | null;
  trialAvailable: boolean;
  /** Where "continue" goes until checkout exists. */
  bookHref: string;
}) {
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

  const priceFor = (mins: number) =>
    prices.find((p) => p.durationMinutes === mins) ?? null;

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

  const chosen = slots.find((s) => s.start === selected);
  const chosenPrice = chosen
    ? trialAvailable && trial && chosen.durationMinutes === trial.durationMinutes
      ? trial
      : priceFor(chosen.durationMinutes)
    : null;

  return (
    <div>
      {durations.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-sm font-bold text-primary mr-1">Lesson length</span>
          {durations.map((d) => {
            const p = priceFor(d);
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
                {p && (
                  <span className="ml-2 font-semibold opacity-80">
                    {formatPrice(p.priceCents, p.currency)}
                  </span>
                )}
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
          {chosenPrice && (
            <p className="mt-1 text-sm text-gray-600">
              {formatPrice(chosenPrice.priceCents, chosenPrice.currency)}
              {chosenPrice === trial && " — discounted first lesson"}
            </p>
          )}
          <a
            href={bookHref}
            className="inline-flex items-center justify-center gap-2 mt-4 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-800"
          >
            Continue
          </a>
          <p className="mt-3 text-xs text-gray-500">
            Free cancellation up to 12 hours before the lesson.
          </p>
        </div>
      )}
    </div>
  );
}
