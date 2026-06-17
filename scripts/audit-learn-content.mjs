#!/usr/bin/env node
// scripts/audit-learn-content.mjs
// Audit every self-learning lesson's content+exercises against the shapes
// the player actually expects, and report (or auto-fix with --fix) issues.
//
// Usage:
//   node --env-file=.env.local scripts/audit-learn-content.mjs           # report only
//   node --env-file=.env.local scripts/audit-learn-content.mjs --fix     # patch DB
//   node --env-file=.env.local scripts/audit-learn-content.mjs --lang=es # filter

import { createClient } from "@supabase/supabase-js";

const FIX = process.argv.includes("--fix");
const LANG_FILTER = process.argv.find((a) => a.startsWith("--lang="))?.split("=")[1];

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Audit a single lesson row. Returns { issues:[], patched:content|null }.
function auditLesson(lesson) {
  const issues = [];
  let content = lesson.content;
  if (!content || typeof content !== "object") {
    issues.push("content: missing/invalid");
    return { issues, patched: null };
  }
  // Shallow clone so we can mutate without touching the caller.
  content = JSON.parse(JSON.stringify(content));
  let mutated = false;

  // ── Dialogue: speaker MUST be a NAME (string), not a numeric index.
  const d = content.dialogue;
  if (d && Array.isArray(d.lines) && d.lines.length > 0) {
    const speakers = Array.isArray(d.speakers) ? d.speakers : [];
    for (let i = 0; i < d.lines.length; i++) {
      const line = d.lines[i];
      if (!line || typeof line !== "object") {
        issues.push(`dialogue.lines[${i}]: invalid`);
        continue;
      }
      if (typeof line.speaker === "number" || /^\d+$/.test(String(line.speaker))) {
        const idx = Number(line.speaker);
        const name = speakers[idx];
        if (typeof name === "string" && name.length > 0) {
          line.speaker = name;
          mutated = true;
        } else {
          issues.push(`dialogue.lines[${i}].speaker: numeric ${idx} but no speakers[${idx}]`);
        }
      } else if (typeof line.speaker !== "string") {
        issues.push(`dialogue.lines[${i}].speaker: not a string (${typeof line.speaker})`);
      }
      if (typeof line.text !== "string" || !line.text) {
        issues.push(`dialogue.lines[${i}].text: missing`);
      }
    }
  }

  // ── Grammar examples: prefer `translation`; if missing but `simplified`
  //    looks like an EN gloss, copy across so the UI shows something useful.
  if (Array.isArray(content.grammar)) {
    for (let gi = 0; gi < content.grammar.length; gi++) {
      const g = content.grammar[gi];
      if (!g) continue;
      if (Array.isArray(g.examples)) {
        for (let ei = 0; ei < g.examples.length; ei++) {
          const ex = g.examples[ei];
          if (!ex) continue;
          if (!ex.translation && ex.simplified) {
            ex.translation = ex.simplified;
            mutated = true;
          }
        }
      }
    }
  }

  // ── Vocabulary example: same `simplified` → `translation` backfill.
  if (Array.isArray(content.vocabulary)) {
    for (const v of content.vocabulary) {
      if (v && v.exampleSentence && !v.exampleSentence.translation && v.exampleSentence.simplified) {
        v.exampleSentence.translation = v.exampleSentence.simplified;
        mutated = true;
      }
    }
  }

  return { issues, patched: mutated ? content : null };
}

// ── Audit + normalize a single exercise. Returns { issues:[], patched|null }.
function auditExercise(ex) {
  const issues = [];
  if (!ex || !ex.exercise_type || !ex.content) {
    issues.push("exercise: missing type/content");
    return { issues, patched: null };
  }
  const c = JSON.parse(JSON.stringify(ex.content));
  let mutated = false;

  if (ex.exercise_type === "REORDER") {
    let words = Array.isArray(c.words) ? c.words.map(String) : [];
    let order = Array.isArray(c.correctOrder) ? c.correctOrder : [];
    const allNumeric = order.length > 0 && order.every((o) => typeof o === "number" || /^\d+$/.test(String(o)));
    if (allNumeric) {
      const remapped = order.map((i) => words[Number(i)]).filter((w) => w != null);
      if (remapped.length === order.length) { order = remapped; mutated = true; }
    } else {
      order = order.map(String);
    }
    if (words.length === 0 && order.length > 0) { words = [...order]; mutated = true; }
    if (!c.translation && c.meaning) { c.translation = c.meaning; mutated = true; }

    const norm = (a) => [...a].map((x) => x.trim()).sort().join("");
    const valid =
      words.length >= 2 && order.length === words.length && norm(words) === norm(order);
    if (!valid) {
      issues.push(`REORDER: words/correctOrder mismatch (words=${words.length}, order=${order.length})`);
    } else {
      if (mutated) { c.words = words; c.correctOrder = order; }
    }
  } else if (ex.exercise_type === "LISTENING") {
    if (!c.ttsText) issues.push("LISTENING: missing ttsText");
  } else if (ex.exercise_type === "MULTIPLE_CHOICE") {
    if (!Array.isArray(c.options) || c.options.length < 2) issues.push("MULTIPLE_CHOICE: <2 options");
    if (typeof c.correctIndex !== "number") issues.push("MULTIPLE_CHOICE: missing correctIndex");
  } else if (ex.exercise_type === "FILL_BLANK") {
    if (!c.sentence) issues.push("FILL_BLANK: missing sentence");
    // Player accepts both `answer` and `correctAnswer`. Only complain if
    // neither is present.
    if (!c.answer && !c.correctAnswer) issues.push("FILL_BLANK: missing answer");
  } else if (ex.exercise_type === "TRANSLATION") {
    if (!c.correctAnswer) issues.push("TRANSLATION: missing correctAnswer");
  } else if (ex.exercise_type === "SPEAK") {
    if (!c.targetText) issues.push("SPEAK: missing targetText");
  }

  return { issues, patched: mutated ? c : null };
}

async function main() {
  console.log(`\n🔎 Audit ${FIX ? "+ FIX" : "(report only)"} — self-learning content\n`);

  // Pull lessons (joined to course→language) so we can filter by language.
  let q = s
    .from("lessons")
    .select("id, slug, content, unit:units(id, course:courses(slug, language:languages(code)))")
    .eq("is_active", true);
  const { data: lessons, error } = await q;
  if (error) throw error;

  let totalIssues = 0;
  let totalLessonsPatched = 0;
  let totalExercisesPatched = 0;
  const byLang = {};

  for (const lesson of lessons) {
    const langCode = lesson.unit?.course?.language?.code || "unknown";
    if (LANG_FILTER && langCode !== LANG_FILTER) continue;
    byLang[langCode] = (byLang[langCode] || 0) + 1;

    const { issues: lIssues, patched } = auditLesson(lesson);
    if (lIssues.length || patched) {
      console.log(`\n[${langCode}] ${lesson.slug}`);
      lIssues.forEach((i) => console.log(`  ✗ ${i}`));
      if (patched) console.log(`  ↳ would patch content (dialogue speakers / translation backfill)`);
    }
    totalIssues += lIssues.length;

    if (FIX && patched) {
      const { error: upErr } = await s.from("lessons").update({ content: patched }).eq("id", lesson.id);
      if (upErr) console.error(`  ⚠️  update failed: ${upErr.message}`);
      else { totalLessonsPatched++; console.log(`  ✅ content patched`); }
    }

    // Exercises (only for lessons we processed).
    const { data: exes } = await s
      .from("exercises")
      .select("id, exercise_type, content")
      .eq("lesson_id", lesson.id);
    for (const ex of exes || []) {
      const { issues: eIssues, patched: ePatched } = auditExercise(ex);
      if (eIssues.length || ePatched) {
        console.log(`  · exercise ${ex.id} (${ex.exercise_type})`);
        eIssues.forEach((i) => console.log(`    ✗ ${i}`));
        if (ePatched) console.log(`    ↳ would patch content`);
      }
      totalIssues += eIssues.length;
      if (FIX && ePatched) {
        const { error: upErr } = await s.from("exercises").update({ content: ePatched }).eq("id", ex.id);
        if (upErr) console.error(`    ⚠️  update failed: ${upErr.message}`);
        else { totalExercisesPatched++; console.log(`    ✅ exercise patched`); }
      }
    }
  }

  console.log("\n─── Summary ───");
  console.log("Languages scanned:", byLang);
  console.log("Issues reported:", totalIssues);
  if (FIX) {
    console.log("Lessons patched:", totalLessonsPatched);
    console.log("Exercises patched:", totalExercisesPatched);
  }
  console.log();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
