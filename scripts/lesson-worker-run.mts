// Run the lesson worker from the terminal — no dev server, no browser.
//
//   npx tsx scripts/lesson-worker-run.mts --levels A1 --dry
//   npx tsx scripts/lesson-worker-run.mts --levels A1 --apply
//   npx tsx scripts/lesson-worker-run.mts --apply --critique      # the full pass
//   npx tsx scripts/lesson-worker-run.mts --revert <runId>
//   npx tsx scripts/lesson-worker-run.mts --runs                  # recent runs
//
// This is the same pipeline the admin page drives, minus Next.js. It writes
// the same run/item/revision rows, so a run started here shows up in
// /admin/lesson-worker and can be undone from either place.
//
// Flags:
//   --levels A1,B1   restrict to CEFR levels (default: all)
//   --language fr    default fr
//   --limit N        cap how many lessons the run queues
//   --dry            report only, write nothing (DEFAULT — you must pass --apply)
//   --apply          write repairs to the lessons
//   --critique       include the AI review stage (~10x the cost)
//   --findings       also act on editorial findings (implies --critique)
//   --all            include lessons already passed since their last edit

/* eslint-disable @typescript-eslint/no-explicit-any */

import { config } from "dotenv";
config({ path: ".env.local" });

import { adminClient, contentHash, processLesson, type RunOptions } from "../src/lib/lessons/worker/process";
import { revertEdits } from "../src/lib/lessons/worker/revert";
import { normalizeLesson } from "../src/lib/lessons/worker/normalize";
import { validateLesson, summarize } from "../src/lib/lessons/worker/validate";

const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
const val = (f: string) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};

const C = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

const supa = adminClient();

// ── --runs / --revert ───────────────────────────────────────────────────────

if (has("--runs")) {
  const { data } = await supa
    .from("lesson_worker_runs")
    .select("id, status, total_items, done_items, applied_count, cost_usd, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
  console.log(C.bold("\nRecent runs\n"));
  for (const r of data ?? []) {
    console.log(
      `  ${r.id}  ${String(r.status).padEnd(9)} ${String(r.applied_count).padStart(4)} edited  ` +
        `$${Number(r.cost_usd).toFixed(3).padStart(7)}  ${new Date(r.created_at).toLocaleString()}`
    );
  }
  console.log();
  process.exit(0);
}

const revertId = val("--revert");
if (revertId) {
  const result = await revertEdits(supa, { runId: revertId });
  console.log(`Reverted ${result.reverted} lesson${result.reverted === 1 ? "" : "s"}.`);
  process.exit(0);
}

// ── build the queue ─────────────────────────────────────────────────────────

const apply = has("--apply");
const critique = has("--critique") || has("--findings");
const language = val("--language") ?? "fr";
const levels = (val("--levels") ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
const limit = parseInt(val("--limit") ?? "5000", 10);

const opts: RunOptions = {
  auto_apply: apply,
  skip_critique: !critique,
  apply_findings: has("--findings"),
  critique_model: "gpt-4o",
  repair_model: "gpt-4o-mini",
};

let q = supa
  .from("tutor_lessons")
  .select("id, slug, title, level, language, content, ai_pass_hash")
  .eq("language", language)
  .limit(limit);
if (levels.length) q = q.in("level", levels);

const { data: lessons, error } = await q;
if (error) {
  console.error(C.red(`Could not load lessons: ${error.message}`));
  process.exit(1);
}

const queue = (lessons ?? []).filter((l) =>
  has("--all") ? true : l.ai_pass_hash !== contentHash(l.content)
);

console.log(C.bold(`\nLesson worker`));
console.log(
  C.dim(
    `  language=${language}  levels=${levels.length ? levels.join(",") : "all"}  ` +
      `queued=${queue.length}  critique=${critique ? "on" : "off"}  ` +
      (apply ? C.green("APPLY — will write") : C.yellow("DRY RUN — writes nothing"))
  ) + "\n"
);

if (queue.length === 0) {
  console.log("Nothing to do — every matching lesson is already up to date.\n");
  process.exit(0);
}

// A run row so this shows up in the admin history and can be reverted there.
const { data: run } = await supa
  .from("lesson_worker_runs")
  .insert({
    status: "running",
    scope: { language, levels, via: "cli" },
    options: opts as any,
    total_items: queue.length,
  })
  .select("*")
  .single();

let done = 0, failed = 0, appliedCount = 0, cost = 0;
const started = Date.now();

for (const row of queue) {
  const { data: item } = await supa
    .from("lesson_worker_items")
    .insert({ run_id: run.id, lesson_id: row.id, slug: row.slug, title: row.title, level: row.level })
    .select("*")
    .single();

  const pre = summarize(
    validateLesson(normalizeLesson({ ...(row.content as any), level: row.level, title: row.title }).lesson)
  );

  const n = `${done + failed + 1}/${queue.length}`.padStart(9);

  try {
    const out = await processLesson(supa, row as never, opts, { runId: run.id, itemId: item.id });
    cost += out.costUsd;
    if (out.applied) appliedCount++;
    done++;

    const post = apply
      ? summarize(
          validateLesson(
            normalizeLesson({
              ...((await supa.from("tutor_lessons").select("content").eq("id", row.id).single()).data!
                .content as any),
              level: row.level,
              title: row.title,
            }).lesson
          )
        )
      : pre;

    const tag = !apply
      ? C.dim("dry")
      : post.errors < pre.errors
        ? C.green("improved")
        : post.errors > pre.errors
          ? C.red("REGRESSED")
          : C.dim("no change");

    console.log(
      `${n}  ${row.slug.slice(0, 40).padEnd(40)} ${String(pre.errors).padStart(2)}→${String(post.errors).padEnd(2)} errors  ${tag}`
    );

    await supa
      .from("lesson_worker_items")
      .update({
        status: "done",
        defects: out.defects as any,
        findings: out.findings as any,
        repairs: out.repairs as any,
        applied: out.applied,
        cost_usd: out.costUsd,
        finished_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  } catch (err) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`${n}  ${row.slug.slice(0, 40).padEnd(40)} ${C.red("failed")} ${C.dim(msg.slice(0, 60))}`);
    await supa
      .from("lesson_worker_items")
      .update({ status: "failed", error: msg, finished_at: new Date().toISOString() })
      .eq("id", item.id);
  }

  await supa
    .from("lesson_worker_runs")
    .update({ done_items: done, failed_items: failed, applied_count: appliedCount, cost_usd: cost })
    .eq("id", run.id);
}

await supa
  .from("lesson_worker_runs")
  .update({ status: "done", finished_at: new Date().toISOString() })
  .eq("id", run.id);

const mins = ((Date.now() - started) / 60000).toFixed(1);
console.log(C.bold(`\n  ${done} processed, ${failed} failed, ${appliedCount} edited`));
console.log(`  $${cost.toFixed(4)} in ${mins} min`);
console.log(C.dim(`  run id: ${run.id}`));
if (apply && appliedCount > 0) {
  console.log(C.dim(`  undo:   npx tsx scripts/lesson-worker-run.mts --revert ${run.id}`));
  console.log(C.dim(`  diff:   npx tsx scripts/lesson-worker-diff.mts --run ${run.id}`));
}
console.log();
