"use client";

// A tutor's week, as a grid of time.
//
// The question behind this page is not "what is next" — a list answers that —
// but "how does my week actually look": where the gaps are, whether Thursday
// is already gone, whether there is room to open more availability. That is a
// question about SHAPE, and only a time grid has a shape.
//
// A month grid with dots was the first attempt and it was wrong for the same
// reason: it can tell you a day is busy but not that the busy-ness is three
// lessons back-to-back at 7am.
//
// Only bookings appear. The legacy tutor_sessions rows elsewhere on this page
// are a different flow with no money and no room attached, and mixing them in
// would draw a full week out of things nobody is coming to.

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, List, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CalendarBooking {
  id: string;
  startsAt: string;
  durationMinutes: number;
  studentName: string;
  roomId: string | null;
  status: string;
}

const DAY_MS = 86_400_000;

/** Monday of the week containing `d`, at local midnight. */
function weekStart(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  return s;
}

function minutesInto(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function BookingCalendar({ bookings }: { bookings: CalendarBooking[] }) {
  const [cursor, setCursor] = useState(() => weekStart(new Date()));
  const [view, setView] = useState<"week" | "agenda">("week");

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => new Date(cursor.getTime() + i * DAY_MS)),
    [cursor]
  );

  const inWeek = useMemo(() => {
    const from = cursor.getTime();
    const to = from + 7 * DAY_MS;
    return bookings
      .filter((b) => {
        const t = new Date(b.startsAt).getTime();
        return t >= from && t < to;
      })
      .sort((a, z) => a.startsAt.localeCompare(z.startsAt));
  }, [bookings, cursor]);

  // Only the hours that hold something, padded by one. A fixed 00:00–24:00
  // grid spends most of its height on the middle of the night.
  const [startHour, endHour] = useMemo(() => {
    if (inWeek.length === 0) return [8, 20];
    let lo = 24;
    let hi = 0;
    for (const b of inWeek) {
      const s = new Date(b.startsAt);
      lo = Math.min(lo, s.getHours());
      hi = Math.max(hi, Math.ceil((minutesInto(s) + b.durationMinutes) / 60));
    }
    return [Math.max(0, lo - 1), Math.min(24, Math.max(hi + 1, lo + 4))];
  }, [inWeek]);

  const totalMinutes = (endHour - startHour) * 60;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const today = new Date();
  const todayKey = today.toDateString();
  const nowOffset =
    minutesInto(today) >= startHour * 60 && minutesInto(today) <= endHour * 60
      ? ((minutesInto(today) - startHour * 60) / totalMinutes) * 100
      : null;

  const label = `${cursor.toLocaleDateString([], { day: "numeric", month: "short" })} – ${new Date(
    cursor.getTime() + 6 * DAY_MS
  ).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => setCursor(new Date(cursor.getTime() - 7 * DAY_MS))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-500 transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => setCursor(new Date(cursor.getTime() + 7 * DAY_MS))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-500 transition hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(weekStart(new Date()))}
            className="ml-1 rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Today
          </button>
        </div>

        <h2 className="text-sm font-bold text-slate-900 sm:text-base">{label}</h2>

        <div className="ml-auto flex items-center rounded-lg bg-slate-100 p-0.5">
          {(["week", "agenda"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold capitalize transition",
                view === v ? "bg-white text-primary-600 shadow-sm" : "text-slate-500"
              )}
            >
              {v === "week" ? <CalendarDays className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
              {v}
            </button>
          ))}
        </div>
      </header>

      {view === "agenda" ? (
        <Agenda bookings={inWeek} />
      ) : (
        // Horizontally scrollable: seven columns of readable width do not fit
        // a phone, and squeezing them until they do makes a grid nobody can
        // read rather than one they must scroll.
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b">
              <span />
              {days.map((d) => {
                const isToday = d.toDateString() === todayKey;
                return (
                  <span
                    key={d.toISOString()}
                    className={cn(
                      "pb-2 text-center text-xs font-semibold",
                      isToday ? "text-primary-600" : "text-slate-500"
                    )}
                  >
                    <span className="block">{d.toLocaleDateString([], { weekday: "short" })}</span>
                    <span
                      className={cn(
                        "mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                        isToday ? "bg-primary-500 font-bold text-white" : "text-slate-800"
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </span>
                );
              })}
            </div>

            <div className="relative grid grid-cols-[3rem_repeat(7,1fr)]">
              {/* Hour labels + rules */}
              <div className="relative" style={{ height: `${(endHour - startHour) * 3.5}rem` }}>
                {hours.map((h, i) => (
                  <span
                    key={h}
                    className="absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums text-slate-400"
                    style={{ top: `${(i / (endHour - startHour)) * 100}%` }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </span>
                ))}
              </div>

              {days.map((d) => {
                const dayKey = d.toDateString();
                const dayBookings = inWeek.filter(
                  (b) => new Date(b.startsAt).toDateString() === dayKey
                );
                return (
                  <div
                    key={dayKey}
                    className="relative border-l"
                    style={{ height: `${(endHour - startHour) * 3.5}rem` }}
                  >
                    {hours.map((h, i) => (
                      <span
                        key={h}
                        className="absolute inset-x-0 border-t border-slate-100"
                        style={{ top: `${(i / (endHour - startHour)) * 100}%` }}
                      />
                    ))}

                    {dayKey === todayKey && nowOffset !== null ? (
                      <span
                        aria-hidden
                        className="absolute inset-x-0 z-10 border-t-2 border-accent"
                        style={{ top: `${nowOffset}%` }}
                      />
                    ) : null}

                    {dayBookings.map((b) => {
                      const s = new Date(b.startsAt);
                      const top = ((minutesInto(s) - startHour * 60) / totalMinutes) * 100;
                      const height = (b.durationMinutes / totalMinutes) * 100;
                      const done = b.status === "completed";
                      return (
                        <Link
                          key={b.id}
                          href={b.roomId ? `/room/${b.roomId}` : "#"}
                          className={cn(
                            "absolute inset-x-0.5 z-20 overflow-hidden rounded-lg border-l-4 px-1.5 py-1 text-[11px] leading-tight transition hover:brightness-95",
                            done
                              ? "border-slate-300 bg-slate-100 text-slate-500"
                              : "border-primary-500 bg-primary-50 text-primary-800"
                          )}
                          style={{ top: `${top}%`, minHeight: "1.75rem", height: `${height}%` }}
                          title={`${b.studentName} · ${b.durationMinutes} min`}
                        >
                          <span className="block truncate font-bold">
                            {s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </span>
                          <span className="block truncate">{b.studentName}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {inWeek.length === 0 ? (
        <p className="pt-4 text-center text-sm text-slate-400">
          No lessons booked this week.
        </p>
      ) : null}
    </section>
  );
}

function Agenda({ bookings }: { bookings: CalendarBooking[] }) {
  if (bookings.length === 0) return null;
  return (
    <ul className="divide-y divide-slate-100">
      {bookings.map((b) => {
        const s = new Date(b.startsAt);
        return (
          <li key={b.id} className="flex items-center gap-3 py-2.5">
            <span className="w-28 shrink-0 text-xs font-semibold text-slate-500">
              {s.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
              {s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
              {b.studentName} · {b.durationMinutes} min
            </span>
            {b.roomId ? (
              <Link
                href={`/room/${b.roomId}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-600 transition hover:bg-primary-100"
              >
                <Video className="h-3 w-3" /> Room
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
