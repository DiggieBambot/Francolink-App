// POST — drain part of a run's queue.
//
// One call processes items until it runs out of work or out of time budget,
// then returns progress. The admin UI calls this in a loop, which gives live
// progress, keeps every invocation well inside the function timeout, and makes
// a cancelled or crashed run resumable — the queue is in the database, not in
// a process.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/lessons/worker/guard";
import { adminClient, processLesson, type RunOptions } from "@/lib/lessons/worker/process";
import { createLessonForGap } from "@/lib/lessons/worker/create";
import { findGaps } from "@/lib/lessons/worker/gaps";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Stop starting new items past this point, so the response always comes back
 *  before the platform timeout even if the last item was slow. */
const TIME_BUDGET_MS = 200_000;

export async function POST(request: NextRequest, context: { params: Promise<{ runId: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { runId } = await context.params;
  const supa = adminClient();

  const { data: run, error: runErr } = await supa
    .from("lesson_worker_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (runErr || !run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (run.status === "cancelled") return NextResponse.json({ run, finished: true });
  if (run.status === "done") return NextResponse.json({ run, finished: true });

  if (run.status === "queued") {
    await supa.from("lesson_worker_runs").update({ status: "running" }).eq("id", runId);
  }

  const opts = run.options as RunOptions;
  const started = Date.now();
  let processed = 0;

  while (Date.now() - started < TIME_BUDGET_MS) {
    // Re-read cancellation each iteration so Cancel takes effect mid-batch
    // rather than at the end of it.
    const { data: fresh } = await supa
      .from("lesson_worker_runs")
      .select("status")
      .eq("id", runId)
      .single();
    if (fresh?.status === "cancelled") break;

    const { data: item } = await supa
      .from("lesson_worker_items")
      .select("*")
      .eq("run_id", runId)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!item) break;

    await supa.from("lesson_worker_items").update({ status: "running" }).eq("id", item.id);

    try {
      if (item.kind === "create") {
        const scope = run.scope as { language?: string };
        const language = scope.language ?? "fr";

        // Recompute the gap now rather than trusting the one captured at
        // enqueue time — earlier items in this run may have filled it.
        const { data: siblings } = await supa
          .from("tutor_lessons")
          .select("slug, title, level")
          .eq("language", language);

        const gap = findGaps(siblings ?? []).find((g) => g.slugPrefix === item.slug);

        if (!gap) {
          await supa
            .from("lesson_worker_items")
            .update({ status: "skipped", error: "Gap no longer exists.", finished_at: new Date().toISOString() })
            .eq("id", item.id);
        } else {
          const out = await createLessonForGap(supa, gap, language, opts.repair_model, {
            runId,
            itemId: item.id,
          });
          await supa
            .from("lesson_worker_items")
            .update({
              status: out.created ? "done" : "failed",
              lesson_id: out.lessonId,
              slug: out.slug,
              defects: out.defects,
              applied: out.created,
              cost_usd: out.costUsd,
              error: out.created ? null : "Generated lesson failed validation; not stored.",
              finished_at: new Date().toISOString(),
            })
            .eq("id", item.id);
        }
      } else {
        const { data: lesson } = await supa
          .from("tutor_lessons")
          .select("id, slug, title, level, language, content")
          .eq("id", item.lesson_id)
          .single();

        if (!lesson) {
          await supa
            .from("lesson_worker_items")
            .update({ status: "skipped", error: "Lesson no longer exists.", finished_at: new Date().toISOString() })
            .eq("id", item.id);
        } else {
          const out = await processLesson(supa, lesson as never, opts, { runId, itemId: item.id });
          await supa
            .from("lesson_worker_items")
            .update({
              status: "done",
              defects: out.defects,
              findings: out.findings,
              repairs: out.repairs,
              applied: out.applied,
              cost_usd: out.costUsd,
              finished_at: new Date().toISOString(),
            })
            .eq("id", item.id);
        }
      }
    } catch (err) {
      // One bad lesson must never stop the sweep.
      await supa
        .from("lesson_worker_items")
        .update({
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
          finished_at: new Date().toISOString(),
        })
        .eq("id", item.id);
    }

    processed++;
  }

  // Roll item state up onto the run.
  const { data: all } = await supa
    .from("lesson_worker_items")
    .select("status, applied, cost_usd")
    .eq("run_id", runId);

  const rows = all ?? [];
  const pending = rows.filter((r) => r.status === "pending" || r.status === "running").length;
  const { data: current } = await supa.from("lesson_worker_runs").select("status").eq("id", runId).single();

  const finished = pending === 0 || current?.status === "cancelled";

  const { data: updated } = await supa
    .from("lesson_worker_runs")
    .update({
      status: current?.status === "cancelled" ? "cancelled" : finished ? "done" : "running",
      done_items: rows.filter((r) => r.status === "done").length,
      failed_items: rows.filter((r) => r.status === "failed").length,
      applied_count: rows.filter((r) => r.applied).length,
      cost_usd: rows.reduce((sum, r) => sum + Number(r.cost_usd ?? 0), 0),
      finished_at: finished ? new Date().toISOString() : null,
    })
    .eq("id", runId)
    .select("*")
    .single();

  return NextResponse.json({ run: updated, processed, finished });
}
