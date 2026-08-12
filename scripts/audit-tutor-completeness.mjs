// scripts/audit-tutor-completeness.mjs
// READ-ONLY. Audits tutor_lessons (v2 schema) for incomplete teacher resources.
// Reports, per lesson: section count, section kinds present, whether tutor_overview
// (teaching_tips / common_mistakes) exists, and how many sections lack tutor_instruction.
// Usage: node scripts/audit-tutor-completeness.mjs [--status published,review,draft]

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const arg = (process.argv.find((a) => a.startsWith("--status=")) || "").split("=")[1];
const statusFilter = (arg || "published,review").split(",").map((s) => s.trim());

// A "complete" tutor lesson is expected to have these pillars.
const VOCAB = ["warmup_vocabulary", "vocabulary_with_examples"];
const READING = ["reading_comprehension"];
const PRACTICE = ["fill_in_blank_dialogue", "fill_in_blank_dialogue_extended", "word_order", "matching_qa", "image_question_prompts"];
const SPEAK = ["dialogue_read_aloud", "free_response"];

async function main() {
  const { data: lessons, error } = await supa
    .from("tutor_lessons")
    .select("id, slug, title, level, language, status, content, conversion_notes")
    .in("status", statusFilter)
    .order("level")
    .order("slug");
  if (error) throw error;

  console.log(`\nAuditing ${lessons.length} tutor lessons (status: ${statusFilter.join(", ")})\n`);

  const incomplete = [];
  for (const l of lessons) {
    const c = l.content || {};
    const secs = Array.isArray(c.sections) ? c.sections : [];
    const kinds = new Set(secs.map((s) => s.kind));

    const problems = [];
    if (secs.length === 0) problems.push("NO SECTIONS");
    if (![...VOCAB].some((k) => kinds.has(k))) problems.push("no vocab");
    if (![...READING].some((k) => kinds.has(k))) problems.push("no reading");
    if (![...PRACTICE].some((k) => kinds.has(k))) problems.push("no practice");
    if (![...SPEAK].some((k) => kinds.has(k))) problems.push("no speaking");

    const ov = c.tutor_overview || {};
    const hasTips = Array.isArray(ov.teaching_tips) && ov.teaching_tips.length > 0;
    const hasMistakes = Array.isArray(ov.common_mistakes) && ov.common_mistakes.length > 0;
    if (!hasTips) problems.push("no teaching_tips");
    if (!hasMistakes) problems.push("no common_mistakes");

    const missingTutorInstr = secs.filter((s) => !s.tutor_instruction || !String(s.tutor_instruction).trim()).length;
    if (missingTutorInstr > 0) problems.push(`${missingTutorInstr}/${secs.length} sections missing tutor_instruction`);

    if (problems.length > 0) {
      incomplete.push({ l, problems, secCount: secs.length });
    }
  }

  if (incomplete.length === 0) {
    console.log("✅ All audited lessons have complete teacher resources.\n");
    return;
  }

  console.log(`⚠️  ${incomplete.length}/${lessons.length} lessons have gaps:\n`);
  for (const { l, problems, secCount } of incomplete) {
    console.log(`● [${l.level}] ${l.title}`);
    console.log(`    slug: ${l.slug}  status: ${l.status}  sections: ${secCount}`);
    console.log(`    gaps: ${problems.join(" · ")}`);
    if (l.conversion_notes) console.log(`    conversion_notes: ${String(l.conversion_notes).slice(0, 160)}`);
    console.log("");
  }

  // Summary of most common gaps
  const tally = {};
  for (const { problems } of incomplete)
    for (const p of problems) {
      const key = p.includes("sections missing tutor_instruction") ? "sections missing tutor_instruction" : p;
      tally[key] = (tally[key] || 0) + 1;
    }
  console.log("─".repeat(60));
  console.log("Gap frequency across lessons:");
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(v).padStart(3)}  ${k}`);
  console.log("");
}

main().catch((e) => { console.error(e); process.exit(1); });
