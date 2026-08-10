// Shared read-only timeline of covered lessons, grouped by date. Used by the
// student history page, the tutor's per-student history, and the admin overview.

import Link from "next/link";
import { BookOpen, Clock, CalendarDays } from "lucide-react";
import type { CoverageEntry } from "@/lib/lessons/coverage";

function formatDay(iso: string): string {
  // covered_on is a bare date (YYYY-MM-DD); parse as UTC so it doesn't shift a
  // day backwards for users west of GMT.
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

const LEVEL_STYLES: Record<string, string> = {
  A1: "bg-emerald-50 text-emerald-700",
  A2: "bg-teal-50 text-teal-700",
  B1: "bg-sky-50 text-sky-700",
  B2: "bg-indigo-50 text-indigo-700",
  C1: "bg-purple-50 text-purple-700",
  C2: "bg-fuchsia-50 text-fuchsia-700",
};

export function CoverageTimeline({
  entries,
  partnerLabel,
  emptyHint,
}: {
  entries: CoverageEntry[];
  /** What the other person is called here — "Tutor" or "Student". */
  partnerLabel: string;
  emptyHint: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <BookOpen className="mx-auto mb-3 h-8 w-8 text-gray-300" />
        <p className="font-semibold text-gray-700">No lessons recorded yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{emptyHint}</p>
      </div>
    );
  }

  // Group by day, preserving the newest-first order the query returned.
  const days: Array<{ day: string; items: CoverageEntry[] }> = [];
  for (const entry of entries) {
    const last = days[days.length - 1];
    if (last && last.day === entry.coveredOn) last.items.push(entry);
    else days.push({ day: entry.coveredOn, items: [entry] });
  }

  return (
    <div className="space-y-6">
      {days.map(({ day, items }) => (
        <div key={day}>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDay(day)}
          </div>

          <ul className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {items.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <BookOpen className="h-4 w-4 text-primary" />
                </span>

                <div className="min-w-0 flex-1">
                  {entry.lessonSlug ? (
                    <Link
                      href={`/library/lesson/${entry.lessonSlug}`}
                      className="font-semibold text-gray-900 hover:text-primary hover:underline"
                    >
                      {entry.lessonTitle}
                    </Link>
                  ) : (
                    <span className="font-semibold text-gray-900">{entry.lessonTitle}</span>
                  )}
                  <p className="text-xs text-gray-500">
                    {partnerLabel}: {entry.partnerName}
                  </p>
                </div>

                {entry.level && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      LEVEL_STYLES[entry.level] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {entry.level}
                  </span>
                )}

                {entry.minutes != null && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 tabular-nums">
                    <Clock className="h-3 w-3" />
                    {entry.minutes} min
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
