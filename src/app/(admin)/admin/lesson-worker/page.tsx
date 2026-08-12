// /admin/lesson-worker — start and watch an AI pass over the lesson catalogue.

import { adminClient } from "@/lib/lessons/worker/process";
import { LessonWorkerConsole } from "@/components/admin/lesson-worker-console";
import { Bot } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LessonWorkerPage() {
  const supa = adminClient();

  const [{ data: runs }, { data: levels }] = await Promise.all([
    supa.from("lesson_worker_runs").select("*").order("created_at", { ascending: false }).limit(10),
    supa.from("tutor_lessons").select("level").eq("language", "fr"),
  ]);

  const levelOptions = [...new Set((levels ?? []).map((l) => l.level))].sort();

  return (
    <div className="p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Bot className="h-6 w-6 text-primary" />
        Lesson worker
      </h1>
      <p className="mb-6 mt-1 max-w-2xl text-sm text-muted-foreground">
        Validates every lesson against the section schema, has a model review the
        language and pedagogy, then repairs the broken sections one at a time.
        Every edit is written to a revision log and can be undone.
      </p>

      <LessonWorkerConsole
        initialRuns={runs ?? []}
        levelOptions={levelOptions.length ? levelOptions : ["A1", "A2", "B1", "B2", "C1", "C2"]}
      />
    </div>
  );
}
