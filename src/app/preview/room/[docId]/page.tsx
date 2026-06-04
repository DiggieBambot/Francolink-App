// Demo room: render the lesson side-by-side as tutor + student in one window.
// Shares highlights + TTS broadcast in-memory. No DB, no Realtime, no auth.

import { notFound } from "next/navigation";
import { extractDocId } from "@/lib/lessons/convert";
import { buildLesson } from "@/lib/lessons/build-lesson";
import { DemoRoom } from "@/components/lesson-v2/demo-room";
import type { Lesson } from "@/lib/lessons/types";

export const dynamic = "force-dynamic";

export default async function PreviewRoomPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId: raw } = await params;
  const docId = extractDocId(decodeURIComponent(raw));
  if (!docId) notFound();

  let lesson: Lesson;
  try {
    lesson = await buildLesson(docId);
  } catch (err) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-3 text-xl font-bold">Conversion failed</h1>
        <p className="text-sm text-slate-600">
          Could not preview Google Doc <code>{docId}</code>.
        </p>
        <pre className="mt-4 overflow-x-auto rounded bg-slate-100 p-3 text-xs">
          {err instanceof Error ? err.message : String(err)}
        </pre>
      </div>
    );
  }

  return <DemoRoom lesson={lesson} />;
}
