// POST — create a run and enqueue its items.
// GET  — list recent runs for the admin dashboard.
//
// Creating a run does no AI work. The queue is drained by repeated calls to
// /api/admin/lesson-worker/[runId]/step, which is what keeps a 400-lesson sweep
// inside the function timeout and lets the UI show live progress.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/lessons/worker/guard";
import { adminClient, contentHash } from "@/lib/lessons/worker/process";
import { findGaps } from "@/lib/lessons/worker/gaps";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const supa = adminClient();
  const { data, error } = await supa
    .from("lesson_worker_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ runs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const {
    language = "fr",
    levels = [] as string[],
    statuses = ["published", "review"] as string[],
    only_stale = true,
    include_missing = false,
    auto_apply = true,
    apply_findings = false,
    skip_critique = false,
    critique_model = "gpt-4o",
    repair_model = "gpt-4o-mini",
    limit = 1000,
  } = body ?? {};

  const supa = adminClient();

  let query = supa
    .from("tutor_lessons")
    .select("id, slug, title, level, content, ai_pass_hash")
    .eq("language", language)
    .order("level", { ascending: true })
    .limit(limit);

  if (levels.length) query = query.in("level", levels);
  if (statuses.length) query = query.in("status", statuses);

  const { data: lessons, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Staleness: skip anything whose content hasn't changed since its last pass.
  // This is what makes re-running the sweep cheap instead of a full re-spend.
  const candidates = (lessons ?? []).filter((l) =>
    only_stale ? l.ai_pass_hash !== contentHash(l.content) : true
  );

  const items = candidates.map((l) => ({
    lesson_id: l.id,
    slug: l.slug,
    title: l.title,
    level: l.level,
    kind: "repair" as const,
  }));

  if (include_missing) {
    const gaps = findGaps(
      (lessons ?? []).map((l) => ({ slug: l.slug, title: l.title, level: l.level }))
    );
    for (const g of gaps) {
      items.push({
        lesson_id: null as unknown as string,
        slug: g.slugPrefix,
        title: `Missing: ${g.category} ${g.level} #${g.sequence}`,
        level: g.level,
        kind: "create" as unknown as "repair",
      });
    }
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "Nothing to do — every matching lesson is already up to date." }, { status: 400 });
  }

  const { data: run, error: runErr } = await supa
    .from("lesson_worker_runs")
    .insert({
      status: "queued",
      scope: { language, levels, statuses, only_stale, include_missing },
      options: { auto_apply, apply_findings, skip_critique, critique_model, repair_model },
      total_items: items.length,
      started_by: auth.userId,
    })
    .select("*")
    .single();

  if (runErr) return NextResponse.json({ error: runErr.message }, { status: 500 });

  const { error: itemsErr } = await supa
    .from("lesson_worker_items")
    .insert(items.map((i) => ({ ...i, run_id: run.id })));

  if (itemsErr) {
    await supa.from("lesson_worker_runs").delete().eq("id", run.id);
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  return NextResponse.json({ run });
}
