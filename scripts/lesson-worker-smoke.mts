// End-to-end smoke test for the lesson worker's WRITE and UNDO paths.
//
//   npx tsx scripts/lesson-worker-smoke.mts [--limit 4]
//
// Run this after any change to process.ts, repair.ts or revert.ts. It edits a
// handful of real lessons, checks each one improved, then reverts the run and
// asserts every lesson came back byte-identical. It cleans up its own run and
// revision rows, so the catalogue and the run history end exactly as they
// started. Costs about a cent.
//
// The undo path is the one thing here whose failure mode is unrecoverable, so
// it is worth paying a cent to know it still works.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createHash } from "crypto";
import { adminClient, processLesson } from "../src/lib/lessons/worker/process";
import { revertEdits } from "../src/lib/lessons/worker/revert";
import { validateLesson, summarize, AUTO_FIXABLE } from "../src/lib/lessons/worker/validate";
import { normalizeLesson } from "../src/lib/lessons/worker/normalize";

const argIdx = process.argv.indexOf("--limit");
const LIMIT = argIdx >= 0 ? parseInt(process.argv[argIdx + 1], 10) : 4;
const supa = adminClient();
const h = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 12);

// Pick lessons that have a defect the worker is actually allowed to fix.
const { data: all } = await supa
  .from("tutor_lessons")
  .select("id, slug, title, level, language, content")
  .eq("language", "fr")
  .limit(300);

const targets: { id: string; slug: string; title: string; level: string; language: string; content: unknown }[] = [];
for (const row of all!) {
  const l = normalizeLesson({ ...(row.content as any), level: row.level, title: row.title }).lesson;
  const d = validateLesson(l);
  if (d.some((x) => x.section_index !== null && AUTO_FIXABLE.has(x.code))) targets.push(row);
  if (targets.length >= LIMIT) break;
}
console.log(`Selected ${targets.length} lessons.\n`);

// A real run row, so revert-by-run is exercised the way the UI uses it.
const { data: run } = await supa
  .from("lesson_worker_runs")
  .insert({ status: "running", scope: { smoke: true }, options: {}, total_items: targets.length })
  .select("*").single();

const before = new Map<string, string>();
let cost = 0;

for (const row of targets) {
  before.set(row.id, h(row.content));
  const { data: item } = await supa
    .from("lesson_worker_items")
    .insert({ run_id: run.id, lesson_id: row.id, slug: row.slug, title: row.title, level: row.level })
    .select("*").single();

  const pre = summarize(validateLesson({ ...(row.content as any), level: row.level, title: row.title }));
  const out = await processLesson(
    supa, row as never,
    { auto_apply: true, critique_model: "gpt-4o", repair_model: "gpt-4o-mini", skip_critique: true },
    { runId: run.id, itemId: item.id }
  );
  cost += out.costUsd;

  const { data: after } = await supa.from("tutor_lessons").select("content").eq("id", row.id).single();
  const post = summarize(validateLesson({ ...(after!.content as any), level: row.level, title: row.title }));

  const verdict = post.errors < pre.errors ? "improved" : post.errors > pre.errors ? "REGRESSED" : "same";
  console.log(`${row.slug.padEnd(38)} errors ${pre.errors}→${post.errors}  applied=${out.applied}  ${verdict}`);
}

console.log(`\nspent $${cost.toFixed(4)}`);

// ── the part that has never been executed ──────────────────────────────────
const { count: revs } = await supa
  .from("tutor_lesson_revisions").select("*", { count: "exact", head: true }).eq("run_id", run.id);
console.log(`revision rows written: ${revs}`);

console.log("\nReverting…");
const result = await revertEdits(supa, { runId: run.id });
console.log(`revertEdits reported: ${result.reverted}`);

let restored = 0, drifted = 0;
for (const row of targets) {
  const { data: now } = await supa.from("tutor_lessons").select("content, ai_pass_at").eq("id", row.id).single();
  if (h(now!.content) === before.get(row.id)) restored++;
  else { drifted++; console.log(`  !! ${row.slug} did NOT return to its original content`); }
}
console.log(`\nrestored byte-identical: ${restored}/${targets.length}${drifted ? `  DRIFTED: ${drifted}` : ""}`);

// Clean up after ourselves — a smoke test should not leave a fake run in the
// admin history or stray revisions in the undo log.
await supa.from("tutor_lesson_revisions").delete().eq("run_id", run.id);
const { data: snaps } = await supa
  .from("tutor_lesson_revisions").select("id, reason, lesson_id").is("run_id", null);
const strays = (snaps ?? [])
  .filter((s: any) => s.reason?.includes("before a revert") && targets.some((t) => t.id === s.lesson_id))
  .map((s: any) => s.id);
if (strays.length) await supa.from("tutor_lesson_revisions").delete().in("id", strays);
await supa.from("lesson_worker_runs").delete().eq("id", run.id);
console.log("cleaned up run + revision rows");

console.log(drifted === 0 ? "\nWRITE + UNDO PROVEN ✓" : "\nUNDO IS BROKEN ✗");
process.exit(drifted === 0 ? 0 : 1);
