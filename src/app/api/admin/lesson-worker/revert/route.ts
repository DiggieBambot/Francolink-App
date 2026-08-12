// POST — restore a lesson to the content it had before an AI edit.
//
// Reverting writes a fresh revision of the *current* content first, so undo is
// itself undoable and the history stays linear.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/lessons/worker/guard";
import { adminClient, contentHash } from "@/lib/lessons/worker/process";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { revisionId, runId } = await request.json().catch(() => ({}));
  const supa = adminClient();

  // Reverting a whole run is the panic button: undo every edit it made, newest
  // first so each lesson lands on its oldest pre-run state.
  const query = supa
    .from("tutor_lesson_revisions")
    .select("id, lesson_id, content")
    .is("reverted_at", null)
    .order("created_at", { ascending: false });

  const { data: revisions, error } = revisionId
    ? await query.eq("id", revisionId)
    : runId
      ? await query.eq("run_id", runId)
      : { data: null, error: new Error("Pass revisionId or runId.") as never };

  if (error) return NextResponse.json({ error: String((error as Error).message) }, { status: 400 });
  if (!revisions?.length) return NextResponse.json({ error: "Nothing to revert." }, { status: 404 });

  // One revision per lesson — the oldest, i.e. the state before this run began.
  const perLesson = new Map<string, (typeof revisions)[number]>();
  for (const r of revisions) perLesson.set(r.lesson_id, r);

  let reverted = 0;
  for (const rev of perLesson.values()) {
    const { data: current } = await supa
      .from("tutor_lessons")
      .select("content")
      .eq("id", rev.lesson_id)
      .single();

    if (current) {
      await supa.from("tutor_lesson_revisions").insert({
        lesson_id: rev.lesson_id,
        content: current.content,
        reason: "Snapshot taken before an admin revert.",
      });
    }

    const { error: updateErr } = await supa
      .from("tutor_lessons")
      .update({
        content: rev.content,
        ai_pass_hash: contentHash(rev.content),
        ai_pass_at: null,
      })
      .eq("id", rev.lesson_id);

    if (!updateErr) {
      await supa
        .from("tutor_lesson_revisions")
        .update({ reverted_at: new Date().toISOString() })
        .eq("id", rev.id);
      reverted++;
    }
  }

  return NextResponse.json({ reverted });
}
