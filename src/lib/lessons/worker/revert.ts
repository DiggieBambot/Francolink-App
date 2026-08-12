// Undoing what the worker wrote.
//
// Lives here rather than inline in the route so the undo path is reachable
// from a script and can be tested — an undo that has never been executed is
// not a safety net, and this is the one operation whose failure mode is
// "the catalogue is now wrong and you cannot get back".

import type { SupabaseClient } from "@supabase/supabase-js";
import { contentHash } from "./process";

export interface RevertResult {
  reverted: number;
  lessonIds: string[];
}

/** Restore lessons to the content they had before an AI edit.
 *
 *  Pass `revisionId` for a single lesson, or `runId` to undo an entire run.
 *  For a run, each lesson is restored to its OLDEST unreverted revision — the
 *  state before the run began — not merely one step back. */
export async function revertEdits(
  supa: SupabaseClient,
  target: { revisionId?: string; runId?: string }
): Promise<RevertResult> {
  if (!target.revisionId && !target.runId) {
    throw new Error("Pass revisionId or runId.");
  }

  let query = supa
    .from("tutor_lesson_revisions")
    .select("id, lesson_id, content")
    .is("reverted_at", null)
    // Oldest last, so the per-lesson map below ends up holding the oldest —
    // i.e. the pre-run state rather than an intermediate one.
    .order("created_at", { ascending: false });

  if (target.revisionId) query = query.eq("id", target.revisionId);
  else query = query.eq("run_id", target.runId!);

  const { data: revisions, error } = await query;
  if (error) throw new Error(error.message);
  if (!revisions?.length) return { reverted: 0, lessonIds: [] };

  const perLesson = new Map<string, (typeof revisions)[number]>();
  for (const r of revisions) perLesson.set(r.lesson_id, r);

  const lessonIds: string[] = [];

  for (const rev of perLesson.values()) {
    // Snapshot the current content first, so the undo is itself undoable.
    const { data: current } = await supa
      .from("tutor_lessons")
      .select("content")
      .eq("id", rev.lesson_id)
      .single();

    if (current) {
      await supa.from("tutor_lesson_revisions").insert({
        lesson_id: rev.lesson_id,
        content: current.content,
        reason: "Snapshot taken before a revert.",
      });
    }

    const { error: updateErr } = await supa
      .from("tutor_lessons")
      .update({
        content: rev.content,
        ai_pass_hash: contentHash(rev.content),
        // Clear the marker so a later sweep re-examines this lesson rather
        // than skipping it as already-passed.
        ai_pass_at: null,
      })
      .eq("id", rev.lesson_id);

    if (updateErr) continue;

    await supa
      .from("tutor_lesson_revisions")
      .update({ reverted_at: new Date().toISOString() })
      .eq("id", rev.id);

    lessonIds.push(rev.lesson_id);
  }

  return { reverted: lessonIds.length, lessonIds };
}
