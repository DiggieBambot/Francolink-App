// /student/history — the lessons this student has covered in live classes,
// newest first. Fed by lesson_coverage, which the room records automatically.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentCoverage } from "@/lib/lessons/coverage";
import { CoverageTimeline } from "@/components/coverage/coverage-timeline";
import { History, BookOpen, CalendarCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/student/history");

  const entries = await getStudentCoverage(user.id);

  const distinctLessons = new Set(entries.map((e) => e.lessonId)).size;
  const distinctDays = new Set(entries.map((e) => e.coveredOn)).size;
  const totalMinutes = entries.reduce((sum, e) => sum + (e.minutes || 0), 0);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <History className="h-6 w-6 text-primary" />
          Lessons covered
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Everything you&apos;ve worked through with your tutor in a live class.
        </p>
      </div>

      {entries.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Stat icon={BookOpen} value={distinctLessons} label="lessons" />
          <Stat icon={CalendarCheck} value={distinctDays} label="class days" />
          <Stat icon={History} value={Math.round(totalMinutes / 60)} label="hours" />
        </div>
      )}

      <CoverageTimeline
        entries={entries}
        partnerLabel="Tutor"
        emptyHint="Once you've worked through a lesson in a live class with your tutor, it'll show up here automatically."
      />
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
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <Icon className="mb-2 h-4 w-4 text-primary" />
      <p className="text-2xl font-bold leading-none text-gray-900 tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}
