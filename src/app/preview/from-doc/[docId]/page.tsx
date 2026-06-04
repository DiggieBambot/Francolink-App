// On-demand preview for any Google Doc — fetch, convert, hydrate images, render.
// No DB write. Cached in-memory by docId until server restart.

import { notFound } from "next/navigation";
import { LessonRenderer } from "@/components/lesson-v2/lesson-renderer";
import { extractDocId } from "@/lib/lessons/convert";
import { buildLesson } from "@/lib/lessons/build-lesson";
import type { Lesson } from "@/lib/lessons/types";

export const dynamic = "force-dynamic";

export default async function PreviewFromDocPage({
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
        <p className="mt-4 text-xs text-slate-500">
          Make sure the doc is shared with &quot;Anyone with the link&quot;.
        </p>
      </div>
    );
  }

  return <LessonRenderer lesson={lesson} initialView="tutor" />;
}
