// /admin/coverage — platform-wide view of which lessons tutors are actually
// covering with students. Useful for spotting unused lessons and inactive pairs.

import { getAllCoverage } from "@/lib/lessons/coverage";
import { History, BookOpen, Users, CalendarCheck } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function AdminCoveragePage() {
  const rows = await getAllCoverage(300);

  const distinctLessons = new Set(rows.map((r) => r.lessonId)).size;
  const distinctPairs = new Set(rows.map((r) => `${r.tutorName}|${r.partnerName}`)).size;
  const distinctDays = new Set(rows.map((r) => r.coveredOn)).size;

  // Most-taught lessons, so it's obvious what the catalogue is actually used for.
  const byLesson = new Map<string, number>();
  for (const r of rows) byLesson.set(r.lessonTitle, (byLesson.get(r.lessonTitle) || 0) + 1);
  const topLessons = [...byLesson.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <History className="h-6 w-6 text-primary" />
        Lesson coverage
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        The 300 most recent lessons covered in live classes across the platform.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={BookOpen} value={distinctLessons} label="distinct lessons" />
        <Stat icon={Users} value={distinctPairs} label="tutor–student pairs" />
        <Stat icon={CalendarCheck} value={distinctDays} label="class days" />
        <Stat icon={History} value={rows.length} label="records shown" />
      </div>

      {topLessons.length > 0 && (
        <div className="mb-6 rounded-2xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Most taught
          </h2>
          <ul className="space-y-1.5">
            {topLessons.map(([title, count]) => (
              <li key={title} className="flex items-center justify-between gap-4 text-sm">
                <span className="truncate">{title}</span>
                <span className="shrink-0 font-semibold tabular-nums text-muted-foreground">
                  {count}×
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          Nothing recorded yet. Coverage is logged automatically once a lesson has
          been open in a live room for a couple of minutes.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Lesson</th>
                <th className="px-4 py-2.5 font-semibold">Level</th>
                <th className="px-4 py-2.5 font-semibold">Tutor</th>
                <th className="px-4 py-2.5 font-semibold">Student</th>
                <th className="px-4 py-2.5 text-right font-semibold">Mins</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                    {formatDay(r.coveredOn)}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{r.lessonTitle}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.level || "—"}</td>
                  <td className="px-4 py-2.5">{r.tutorName}</td>
                  <td className="px-4 py-2.5">{r.partnerName}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {r.minutes ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <Icon className="mb-2 h-4 w-4 text-primary" />
      <p className="text-2xl font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
