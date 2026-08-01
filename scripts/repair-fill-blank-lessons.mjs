// scripts/repair-fill-blank-lessons.mjs
// Repairs already-stored fill_in_blank_dialogue(_extended) sections across all
// tutor_lessons, mirroring src/lib/lessons/convert.ts:repairFillBlanks:
//   1. In sections that mix inline "(N)" markers, set each exchange's `blank`
//      to the actual marker number(s) in its own text (not a blanket `true`).
//   2. Top up answer_pool so every blank's first valid answer has at least as
//      many copies in the pool as the number of blanks that need it.
// This does NOT rewrite any sentence text or answers — additive/metadata only.
//
// DRY-RUN by default. Pass --apply to write changes.
// Usage:
//   node scripts/repair-fill-blank-lessons.mjs
//   node scripts/repair-fill-blank-lessons.mjs --apply

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const MARKER = /\(\d+\)/;

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function die(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function repairSection(section) {
  let changed = false;
  const anyMarkers = (section.exchanges || []).some((e) => MARKER.test(e.text || ""));
  if (anyMarkers) {
    for (const ex of section.exchanges) {
      const nums = Array.from(String(ex.text || "").matchAll(/\((\d+)\)/g), (m) => parseInt(m[1], 10));
      const next = nums.length === 0 ? undefined : nums.length === 1 ? nums[0] : nums;
      const before = JSON.stringify(ex.blank ?? null);
      const after = JSON.stringify(next ?? null);
      if (before !== after) {
        ex.blank = next;
        changed = true;
      }
    }
  }

  const need = {};
  for (const answers of Object.values(section.valid_answers_by_blank || {})) {
    const first = (answers || [])[0];
    if (first) need[first] = (need[first] || 0) + 1;
  }
  if (Object.keys(need).length > 0) {
    const pool = section.answer_pool || (section.answer_pool = []);
    const have = {};
    for (const p of pool) have[p] = (have[p] || 0) + 1;
    for (const [word, count] of Object.entries(need)) {
      const missing = count - (have[word] || 0);
      for (let i = 0; i < missing; i++) {
        pool.push(word);
        changed = true;
      }
    }
  }
  return changed;
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    die("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (check .env.local).");
  }
  console.log(APPLY ? "🔴 APPLY mode — writing changes.\n" : "🟢 DRY-RUN — nothing will be written. Pass --apply to write.\n");

  const { data: lessons, error } = await supa.from("tutor_lessons").select("id, title, content");
  if (error) die(`Failed to read tutor_lessons: ${error.message}`);

  let touched = 0;
  const report = [];
  for (const lesson of lessons || []) {
    const sections = lesson.content?.sections || [];
    let lessonChanged = false;
    for (const section of sections) {
      if (section.kind !== "fill_in_blank_dialogue" && section.kind !== "fill_in_blank_dialogue_extended") continue;
      if (repairSection(section)) lessonChanged = true;
    }
    if (lessonChanged) {
      touched++;
      report.push({ id: lesson.id, title: lesson.title });
      if (APPLY) {
        const { error: upErr } = await supa.from("tutor_lessons").update({ content: lesson.content }).eq("id", lesson.id);
        if (upErr) console.error(`  ⚠️ failed to save "${lesson.title}" (${lesson.id}): ${upErr.message}`);
      }
    }
  }

  console.log(`Lessons needing repair: ${touched} / ${lessons?.length ?? 0}`);
  for (const r of report.slice(0, 30)) console.log(`  • ${r.title}  (${r.id})`);
  if (report.length > 30) console.log(`  … and ${report.length - 30} more`);

  console.log(APPLY ? "\n✅ Applied." : "\n🟢 DRY-RUN complete. Re-run with --apply to write the above.");
}

main().catch((e) => die(e.message || String(e)));
