// Inspect what the lesson worker actually did.
//
//   npx tsx scripts/lesson-worker-diff.mts                 # last run: every lesson it changed
//   npx tsx scripts/lesson-worker-diff.mts --run <runId>   # a specific run
//   npx tsx scripts/lesson-worker-diff.mts --slug <slug>   # one lesson, full field-level diff
//   npx tsx scripts/lesson-worker-diff.mts --audit         # re-validate the WHOLE catalogue as it stands now
//
// The revisions table holds the pre-edit content, so this diffs the live lesson
// against what it looked like before the worker touched it. That is the check
// that matters: not "did the worker report success" but "is the lesson better".

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { validateLesson, summarize } from "../src/lib/lessons/worker/validate";
import { normalizeLesson } from "../src/lib/lessons/worker/normalize";

/* eslint-disable @typescript-eslint/no-explicit-any */

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const C = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

/** Walk two objects and report every leaf that differs. */
function diffLeaves(before: any, after: any, path = ""): { path: string; before: any; after: any }[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];

  const isObj = (v: any) => v && typeof v === "object";
  if (!isObj(before) || !isObj(after) || Array.isArray(before) !== Array.isArray(after)) {
    return [{ path, before, after }];
  }

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const out: { path: string; before: any; after: any }[] = [];
  for (const k of keys) {
    out.push(...diffLeaves(before[k], after[k], path ? `${path}.${k}` : k));
  }
  return out;
}

function short(v: any, n = 90): string {
  if (v === undefined) return C.dim("(absent)");
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ── --audit: re-validate the catalogue as it stands ─────────────────────────

if (args.includes("--audit")) {
  const { data } = await supa.from("tutor_lessons").select("slug,title,level,content").limit(1000);
  let errors = 0, warnings = 0, clean = 0;
  const byCode = new Map<string, number>();

  for (const row of data!) {
    const lesson = normalizeLesson({ ...(row.content as any), level: row.level, title: row.title }).lesson;
    const d = validateLesson(lesson);
    const s = summarize(d);
    errors += s.errors;
    warnings += s.warnings;
    if (s.errors === 0) clean++;
    for (const x of d) byCode.set(x.code, (byCode.get(x.code) ?? 0) + 1);
  }

  console.log(C.bold(`\nCatalogue audit — ${data!.length} lessons\n`));
  console.log(`  ${C.green(String(clean))} lessons with zero errors`);
  console.log(`  ${C.red(String(errors))} errors, ${warnings} warnings total\n`);
  [...byCode].sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${String(n).padStart(5)}  ${c}`));
  console.log();
  process.exit(0);
}

// ── diff mode ───────────────────────────────────────────────────────────────

const slug = flag("--slug");
let runId = flag("--run");

if (!runId && !slug) {
  const { data } = await supa
    .from("lesson_worker_runs")
    .select("id,created_at,applied_count")
    .order("created_at", { ascending: false })
    .limit(1);
  if (!data?.length) {
    console.log("No runs yet. Start one at /admin/lesson-worker.");
    process.exit(0);
  }
  runId = data[0].id;
  console.log(C.dim(`Latest run ${runId} — ${data[0].applied_count} lessons edited\n`));
}

let q = supa
  .from("tutor_lesson_revisions")
  .select("id, lesson_id, content, reason, created_at, reverted_at")
  .order("created_at", { ascending: false });

if (runId) q = q.eq("run_id", runId);

const { data: revisions } = await q;
if (!revisions?.length) {
  console.log("No edits recorded — the worker changed nothing.");
  process.exit(0);
}

// Current state of each edited lesson.
const ids = [...new Set(revisions.map((r) => r.lesson_id))];
const { data: current } = await supa
  .from("tutor_lessons")
  .select("id, slug, title, level, content")
  .in("id", ids);
const byId = new Map(current!.map((l) => [l.id, l]));

let shown = 0;
for (const rev of revisions) {
  const live = byId.get(rev.lesson_id);
  if (!live) continue;
  if (slug && live.slug !== slug) continue;

  const before = rev.content as any;
  const after = live.content as any;

  const bd = summarize(validateLesson({ ...before, level: live.level, title: live.title }));
  const ad = summarize(validateLesson({ ...after, level: live.level, title: live.title }));

  const verdict =
    ad.errors < bd.errors ? C.green("improved") : ad.errors > bd.errors ? C.red("REGRESSED") : C.dim("same error count");

  console.log(C.bold(`\n${live.slug}`) + C.dim(` (${live.level})  ${verdict}`));
  console.log(
    C.dim(`  errors ${bd.errors} → ${ad.errors}   warnings ${bd.warnings} → ${ad.warnings}`) +
      (rev.reverted_at ? C.dim("   [reverted]") : "")
  );
  console.log(C.dim(`  reason: ${rev.reason ?? "—"}`));
  console.log(C.dim(`  view:   http://localhost:3000/tutor/lessons/${live.slug}`));

  const leaves = diffLeaves(before, after);
  // Without --slug, keep it to a summary; the full leaf dump is noisy.
  const limit = slug ? leaves.length : 6;
  for (const l of leaves.slice(0, limit)) {
    console.log(`    ${l.path}`);
    console.log(`      ${C.red("−")} ${short(l.before)}`);
    console.log(`      ${C.green("+")} ${short(l.after)}`);
  }
  if (leaves.length > limit) console.log(C.dim(`    … ${leaves.length - limit} more changed fields (use --slug ${live.slug})`));

  shown++;
}

console.log(C.dim(`\n${shown} lesson(s) shown. Anything marked REGRESSED should be reverted from /admin/lesson-worker.\n`));
