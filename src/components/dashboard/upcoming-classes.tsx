// Live and upcoming classes, at the top of the dashboard.
//
// The single most important thing on a student's screen, and until now it was
// not on it at all: the only route from "I have a lesson" to "I am in it" was
// a link in the confirmation email.
//
// A class in progress is a different kind of object from one next Tuesday, so
// it gets a different card rather than a row with a different label — you
// should be able to tell across the room whether you are late.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Video, ArrowRight } from "lucide-react";
import type { UpcomingClass } from "@/lib/booking/upcoming";
import { cn } from "@/lib/utils";

function countdown(seconds: number): string {
  if (seconds >= 86400) {
    const d = Math.floor(seconds / 86400);
    return `${d} day${d === 1 ? "" : "s"}`;
  }
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  if (seconds >= 60) return `${Math.floor(seconds / 60)} min`;
  return `${seconds}s`;
}

export function UpcomingClasses({
  classes,
  role,
}: {
  classes: UpcomingClass[];
  role: "student" | "tutor";
}) {
  // Rendered on the server, then kept honest on the client: a dashboard left
  // open in a tab must not still be saying "in 6 minutes" an hour later, and
  // the Join button has to turn itself on without a reload.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  if (classes.length === 0) return null;

  const live = classes.filter(
    (c) => new Date(c.startsAt).getTime() - 10 * 60_000 <= now && c.isOpen
  );
  const later = classes.filter((c) => !live.includes(c));

  return (
    <section className="mb-6 space-y-3">
      {live.map((c) => (
        <div
          key={c.bookingId}
          className="flex flex-col gap-3 rounded-2xl bg-primary-600 p-5 text-white shadow-lg sm:flex-row sm:items-center"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Video className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-bold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              {new Date(c.startsAt).getTime() <= now
                ? "Your class is on now"
                : `Class starts in ${countdown(Math.round((new Date(c.startsAt).getTime() - now) / 1000))}`}
            </p>
            <p className="mt-0.5 truncate text-sm text-white/80">
              {c.partnerName} · {c.durationMinutes} minutes
            </p>
          </div>
          {c.roomId ? (
            <Link
              href={`/room/${c.roomId}`}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-primary-700 transition hover:bg-white/90"
            >
              Join now <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      ))}

      {later.length > 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <CalendarClock className="h-4 w-4 text-primary-500" />
            Upcoming {role === "student" ? "lessons" : "classes"}
          </h2>
          <ul className="divide-y divide-gray-100">
            {later.slice(0, 4).map((c) => {
              const start = new Date(c.startsAt);
              const soon = c.opensInSeconds < 3600;
              return (
                <li key={c.bookingId} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {start.toLocaleString([], {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {c.partnerName} · {c.durationMinutes} min
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      soon
                        ? "bg-secondary-50 text-secondary-700"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    in {countdown(Math.max(0, Math.round((start.getTime() - now) / 1000)))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
