// scripts/audit-images.mjs
//
// Audit + fill lesson images across the whole tutor_lessons table.
//   node scripts/audit-images.mjs            # audit only (counts, no changes)
//   node scripts/audit-images.mjs --fill     # re-hydrate missing images via Pexels
//   node scripts/audit-images.mjs --fill --limit=20
//
// hydrateImages is idempotent — it skips items that already have a hosted image,
// so --fill only fetches the gaps.

import { config } from "dotenv";
config({ path: ".env.local" });

const { hydrateImages } = await import("../src/lib/lessons/hydrate-images.ts");
const { createClient } = await import("@supabase/supabase-js");

const FILL = process.argv.includes("--fill");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function countImages(lesson) {
  let need = 0, have = 0;
  for (const s of lesson.sections || []) {
    if (s.kind === "warmup_vocabulary" || s.kind === "vocabulary_with_examples") {
      for (const it of s.items || []) { need++; if (it.image_url) have++; }
    } else if (s.kind === "image_question_prompts") {
      for (const p of s.prompts || []) { need++; if (p.image_url) have++; }
    } else if (s.kind === "reading_comprehension") {
      need++; if (s.image_url) have++;
    } else if (s.kind === "dialogue_read_aloud") {
      need++; if (s.context_image_url) have++;
    }
  }
  // hero
  need++; if (lesson.hero_image_url) have++;
  return { need, have, missing: need - have };
}

const { data: rows, error } = await supabase
  .from("tutor_lessons")
  .select("id, slug, content")
  .order("created_at");
if (error) { console.error(error.message); process.exit(1); }

let totNeed = 0, totHave = 0, lessonsWithGaps = 0;
const gappy = [];
for (const r of rows) {
  const c = countImages(r.content);
  totNeed += c.need; totHave += c.have;
  if (c.missing > 0) { lessonsWithGaps++; gappy.push({ id: r.id, slug: r.slug, ...c }); }
}

console.log(`Lessons: ${rows.length}`);
console.log(`Image slots: ${totNeed} | filled: ${totHave} | missing: ${totNeed - totHave}`);
console.log(`Lessons with at least one gap: ${lessonsWithGaps}`);
console.log();
console.log("Top 15 gappy lessons:");
for (const g of gappy.sort((a, b) => b.missing - a.missing).slice(0, 15)) {
  console.log(`  ${String(g.missing).padStart(3)} missing / ${g.need}  ${g.slug}`);
}

if (!FILL) {
  console.log("\n(audit only — run with --fill to fetch missing images via Pexels)");
  process.exit(0);
}

console.log(`\n--- FILLING (${Math.min(gappy.length, LIMIT)} lessons) ---`);
let filled = 0;
const targets = gappy.slice(0, LIMIT);
for (let i = 0; i < targets.length; i++) {
  const g = targets[i];
  const { data: row } = await supabase.from("tutor_lessons").select("content").eq("id", g.id).single();
  const lesson = row.content;
  try {
    const res = await hydrateImages(lesson);
    await supabase.from("tutor_lessons").update({ content: lesson }).eq("id", g.id);
    const after = countImages(lesson);
    filled += g.missing - after.missing;
    console.log(`[${i + 1}/${targets.length}] ${g.slug}: ${g.missing}→${after.missing} missing (+${g.missing - after.missing}) stats=${JSON.stringify(res.stats)}`);
  } catch (err) {
    console.log(`[${i + 1}/${targets.length}] ${g.slug}: ✗ ${err.message?.slice(0, 120)}`);
  }
}
console.log(`\nDone. Filled ~${filled} images.`);
