// GET   — run status plus its items (what the admin UI polls).
// PATCH  — cancel a run.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/lessons/worker/guard";
import { adminClient } from "@/lib/lessons/worker/process";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ runId: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { runId } = await context.params;
  const supa = adminClient();

  const [{ data: run }, { data: items }] = await Promise.all([
    supa.from("lesson_worker_runs").select("*").eq("id", runId).single(),
    supa
      .from("lesson_worker_items")
      .select("*")
      .eq("run_id", runId)
      .order("created_at", { ascending: true }),
  ]);

  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  return NextResponse.json({ run, items: items ?? [] });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ runId: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { runId } = await context.params;
  const { action } = await request.json().catch(() => ({ action: null }));

  if (action !== "cancel") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const supa = adminClient();
  const { data, error } = await supa
    .from("lesson_worker_runs")
    .update({ status: "cancelled", finished_at: new Date().toISOString() })
    .eq("id", runId)
    .in("status", ["queued", "running"])
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ run: data });
}
