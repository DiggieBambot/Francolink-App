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

/**
 * Height of one hour.
 *
 * 3.5rem was too tight: a 25-minute lesson came out 1.5rem tall, which is not
 * enough for a time and a name, so every short block truncated and the grid
 * read as grey slivers. 4.5 gives a 25 a readable two lines.
 */
const ROW_REM = 4.5;

/**
 * What each state looks like.
 *
 * Solid blocks with a colour that MEANS something, rather than one pale tint
 * for everything — a week should be readable at a glance from across the desk,
 * and "which of these already happened" is the first thing a tutor scans for.
 *
 * The palette is the site's own. Navy is the lesson that is still to come,
 * amber is the one happening now (the only thing on the page that needs you
 * this minute), slate is done and asks nothing, red is the one that went
 * wrong. Nothing here is decorative: four states, four colours, and no fifth
 * colour looking for a job.
 */
const TONE = {
  live: {
    block: "border-secondary-600 bg-secondary-500 text-white shadow-sm",
    dot: "bg-secondary-500",
    label: "Happening now",
  },
  upcoming: {
    block: "border-primary-700 bg-primary-500 text-white shadow-sm",
    dot: "bg-primary-500",
    label: "Upcoming",
  },
  done: {
    // Slate-200 with slate-700 text, not slate-100 with slate-500. A lesson
    // that already happened should recede, not disappear — on a week that is
    // mostly taught, the near-white version left the grid looking empty.
    block: "border-slate-400 bg-slate-200 text-slate-700",
    dot: "bg-slate-400",
    label: "Taught",
  },
  missed: {
    block: "border-accent bg-accent-light text-accent",
    dot: "bg-accent",
    label: "No-show",
  },
} as const;

type Tone = keyof typeof TONE;

function toneFor(b: CalendarBooking, now: number): Tone {
  if (b.status.startsWith("no_show")) return "missed";
  if (b.status === "completed") return "done";
  const start = new Date(b.startsAt).getTime();
  const end = start + b.durationMinutes * 60_000;
  if (now >= start && now < end) return "live";
  return now >= end ? "done" : "upcoming";
}

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
  const nowMs = today.getTime();
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

      {/* A legend, because a colour that has to be guessed at is decoration.
          Only the states actually present this week — an unused key is noise. */}
      {inWeek.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-slate-50 px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Key
          </span>
          {(Object.keys(TONE) as Tone[])
            .filter((t) => inWeek.some((b) => toneFor(b, nowMs) === t))
            .map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <span className={cn("h-3 w-3 rounded-sm", TONE[t].dot)} />
                {TONE[t].label}
              </span>
            ))}
        </div>
      ) : null}

      {view === "agenda" ? (
        <Agenda bookings={inWeek} now={nowMs} />
      ) : (
        // Horizontally scrollable: seven columns of readable width do not fit
        // a phone, and squeezing them until they do makes a grid nobody can
        // read rather than one they must scroll.
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Inline, not an arbitrary Tailwind class: `repeat(7, 1fr)` inside
                brackets is not reliably generated, and when it is missing the
                whole grid silently collapses to one column — seven day headers
                stacked vertically, which is exactly what it did. */}
            <div
              className="grid overflow-hidden rounded-t-xl border border-b-0 bg-slate-50"
              style={{ gridTemplateColumns: "3.25rem repeat(7, minmax(0, 1fr))" }}
            >
              <span />
              {days.map((d) => {
                const isToday = d.toDateString() === todayKey;
                return (
                  <span
                    key={d.toISOString()}
                    className={cn(
                      "border-l py-2 text-center text-xs font-semibold",
                      isToday ? "bg-primary-50 text-primary-700" : "text-slate-500"
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

            <div
              className="relative grid overflow-hidden rounded-b-xl border"
              style={{ gridTemplateColumns: "3.25rem repeat(7, minmax(0, 1fr))" }}
            >
              {/* Hour labels + rules */}
              <div className="relative" style={{ height: `${(endHour - startHour) * ROW_REM}rem` }}>
                {hours.map((h, i) => (
                  <span
                    key={h}
                    // Sits just BELOW its line rather than centred on it. Centred,
                    // the first label is half above the grid and the container's
                    // overflow-hidden cuts it in two.
                    className="absolute right-1.5 pt-0.5 text-[10px] leading-none tabular-nums text-slate-400"
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
                    className={cn(
                      "relative border-l border-slate-200",
                      dayKey === todayKey
                        ? "bg-primary-50/60"
                        : d.getDay() === 0 || d.getDay() === 6
                          ? "bg-slate-50/60"
                          : undefined
                    )}
                    style={{ height: `${(endHour - startHour) * ROW_REM}rem` }}
                  >
                    {/* Alternating bands rather than hairlines alone. Tracking
                        a row across seven columns is the thing a week grid is
                        FOR, and a 1px line does not survive the journey. */}
                    {hours.map((h, i) => (
                      <span
                        key={h}
                        className={cn(
                          "absolute inset-x-0 border-t border-slate-200",
                          i % 2 === 1 && "bg-slate-50/70"
                        )}
                        style={{
                          top: `${(i / (endHour - startHour)) * 100}%`,
                          height: `${(1 / (endHour - startHour)) * 100}%`,
                        }}
                      />
                    ))}

                    {dayKey === todayKey && nowOffset !== null ? (
                      <span
                        aria-hidden
                        className="absolute inset-x-0 z-30 border-t-2 border-accent"
                        style={{ top: `${nowOffset}%` }}
                      >
                        <span className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-accent" />
                      </span>
                    ) : null}

                    {dayBookings.map((b) => {
                      const s = new Date(b.startsAt);
                      const top = ((minutesInto(s) - startHour * 60) / totalMinutes) * 100;
                      const height = (b.durationMinutes / totalMinutes) * 100;
                      const tone = toneFor(b, nowMs);
                      return (
                        <Link
                          key={b.id}
                          href={b.roomId ? `/room/${b.roomId}` : "#"}
                          className={cn(
                            "absolute inset-x-1 z-20 overflow-hidden rounded-lg border-l-4 px-2 py-1.5 text-[11px] leading-tight shadow-sm transition hover:-translate-y-px hover:shadow-md",
                            TONE[tone].block,
                            tone === "live" && "ring-2 ring-secondary-300"
                          )}
                          style={{ top: `${top}%`, minHeight: "1.75rem", height: `${height}%` }}
                          title={`${b.studentName} · ${b.durationMinutes} min · ${TONE[tone].label}`}
                        >
                          <span className="block truncate text-[10px] font-bold uppercase tracking-wide opacity-80 tabular-nums">
                            {s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </span>
                          <span className="block truncate text-xs font-semibold">
                            {b.studentName}
                          </span>
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
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-600">
            Nothing booked this week
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            Lessons students book appear here automatically. Open more hours in
            Availability to be bookable.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Agenda({ bookings, now }: { bookings: CalendarBooking[]; now: number }) {
  if (bookings.length === 0) return null;
  return (
    <ul className="divide-y divide-slate-100">
      {bookings.map((b) => {
        const s = new Date(b.startsAt);
        const tone = toneFor(b, now);
        return (
          <li key={b.id} className="flex items-center gap-3 py-2.5">
            {/* Same four colours as the grid, so the toggle changes the
                layout and not the vocabulary. */}
            <span className={cn("h-8 w-1 shrink-0 rounded-full", TONE[tone].dot)} />
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
