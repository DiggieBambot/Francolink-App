#!/usr/bin/env node
// scripts/lint-lessons.mjs
//
// SEO quality gate for the public lesson catalogue.
//
// ~650 published lessons are indexable at /library/lesson/<slug>. A spot check
// found template artefacts shipping live: objectives rendered as a bare "Vous",
// and generic filler vocabulary (routine/schedule/habit/manage) copy-pasted
// into lessons whose topic has nothing to do with it. Indexing pages like that
// at scale is a sitewide quality risk, so this script decides which lessons
// are good enough to stay in the sitemap.
//
// Read-only by default. `--apply` writes the verdict to `seo_indexable` so the
// sitemap and the page's robots meta can honour it.
//
// Usage:
//   node --env-file=.env.local scripts/lint-lessons.mjs
//   node --env-file=.env.local scripts/lint-lessons.mjs --json=out.json
//   node --env-file=.env.local scripts/lint-lessons.mjs --apply

import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const JSON_OUT = process.argv.find((a) => a.startsWith("--json="))?.split("=")[1];
const VERBOSE = process.argv.includes("--verbose");

// Rules from docs/SEO-FIX-CHECKLIST.md A2.
const MIN_SECTIONS = 4;
const MIN_UNIQUE_WORDS = 150;
const VOCAB_OVERLAP_LIMIT = 0.5;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/** Objectives that are a bare pronoun or an obvious truncation stub. */
const STUB_OBJECTIVE = /^(vous|you|tu|je|il|elle|nous|ils|elles)\.?$/i;

/**
 * Phrases produced by the lesson generator's fallback template, with only the
 * topic string swapped in. 266 published lessons carry the same two dialogue
 * lines. A page built from these is not a lesson about its topic — it is the
 * template wearing the topic's name — so any hit fails the lesson outright,
 * regardless of how long it is.
 */
const TEMPLATE_PHRASES = [
  /let'?s talk about .{1,80}\. what do you think\?/i,
  /i think .{1,80} is very interesting\./i,
  /is a topic that affects many aspects of modern life/i,
  /represents one of the more intellectually demanding areas/i,
  /by the end, you should feel more confident/i,
];

/**
 * Words that carry no lesson-specific meaning. Excluded from the unique-word
 * count so boilerplate instructions ("Repeat new words out loud") can't lift a
 * thin lesson over the threshold.
 */
const BOILERPLATE = new Set([
  "repeat", "new", "words", "out", "loud", "several", "times", "try", "to", "use",
  "the", "a", "an", "and", "or", "of", "in", "on", "at", "for", "with", "this",
  "that", "these", "those", "your", "you", "is", "are", "be", "it", "as", "by",
  "lesson", "tips", "learn", "talk", "about", "read", "understand", "passages",
  "confidence", "vous", "le", "la", "les", "de", "des", "du", "un", "une", "et",
  "est", "sont", "ce", "cette", "votre", "avec", "pour", "dans", "sur", "que",
]);

function words(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Every string in the lesson body, flattened — used for the word count. */
function lessonText(lesson) {
  const out = [];
  const walk = (node) => {
    if (node == null) return;
    if (typeof node === "string") { out.push(node); return; }
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        // Skip machine fields — URLs and hints aren't reader-facing content.
        if (/_url$|_query$|_hint$|^kind$|^number$|^slug$/.test(k)) continue;
        walk(v);
      }
    }
  };
  walk(lesson.sections);
  walk(lesson.objectives);
  return out.join(" ");
}

/** Vocabulary headwords, for the cross-lesson duplication check. */
function vocabTerms(lesson) {
  const terms = new Set();
  for (const section of lesson.sections || []) {
    for (const item of section.items || section.vocabulary || []) {
      if (item && typeof item.term === "string") terms.add(item.term.toLowerCase().trim());
    }
  }
  return terms;
}

function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / Math.min(a.size, b.size);
}

const { data, error } = await supabase
  .from("tutor_lessons")
  .select("id, slug, title, level, language, topic_tags, source_url, content")
  .eq("status", "published")
  .order("slug");

if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

console.log(`Linting ${data.length} published lessons…\n`);

// Pass 1 — per-lesson checks.
const results = [];
for (const row of data) {
  const lesson = row.content || {};
  const failures = [];

  const objectives = lesson.objectives || [];
  const labels = objectives.map((o) => String(o?.student_label ?? "").trim());

  if (!objectives.length) {
    failures.push("no objectives");
  } else {
    const stubs = labels.filter((l) => !l || STUB_OBJECTIVE.test(l));
    if (stubs.length) failures.push(`stub objective(s): ${JSON.stringify(stubs)}`);
    const unique = new Set(labels.filter(Boolean));
    if (labels.length > 1 && unique.size === 1) failures.push("all objectives identical");
  }

  const sectionCount = (lesson.sections || []).length;
  if (sectionCount < MIN_SECTIONS) failures.push(`${sectionCount} sections (min ${MIN_SECTIONS})`);

  const unique = new Set(words(lessonText(lesson)).filter((w) => !BOILERPLATE.has(w) && w.length > 2));
  if (unique.size < MIN_UNIQUE_WORDS) failures.push(`${unique.size} unique words (min ${MIN_UNIQUE_WORDS})`);

  // Generator-template prose. Checked against the raw JSON so it catches the
  // phrase wherever it sits — dialogue, reading passage or prompt.
  const raw = JSON.stringify(lesson);
  const templated = TEMPLATE_PHRASES.filter((re) => re.test(raw));
  if (templated.length) failures.push(`generator template prose (${templated.length} pattern(s))`);

  results.push({
    slug: row.slug,
    title: row.title,
    language: row.language,
    level: row.level,
    tags: row.topic_tags || [],
    sections: sectionCount,
    uniqueWords: unique.size,
    vocab: vocabTerms(lesson),
    failures,
  });
}

// Pass 2 — cross-lesson vocabulary duplication. Lessons sharing a topic tag are
// expected to share words; lessons that don't are a template artefact.
for (let i = 0; i < results.length; i++) {
  for (let j = i + 1; j < results.length; j++) {
    const a = results[i];
    const b = results[j];
    if (a.vocab.size < 4 || b.vocab.size < 4) continue;
    const sameTopic = a.tags.some((t) => b.tags.includes(t));
    if (sameTopic) continue;
    const ov = overlap(a.vocab, b.vocab);
    if (ov > VOCAB_OVERLAP_LIMIT) {
      const note = `vocab ${Math.round(ov * 100)}% shared with unrelated lesson "${b.slug}"`;
      if (!a.failures.some((f) => f.startsWith("vocab "))) a.failures.push(note);
      const noteB = `vocab ${Math.round(ov * 100)}% shared with unrelated lesson "${a.slug}"`;
      if (!b.failures.some((f) => f.startsWith("vocab "))) b.failures.push(noteB);
    }
  }
}

const failed = results.filter((r) => r.failures.length);
const passed = results.filter((r) => !r.failures.length);

// Report.
const byReason = {};
for (const r of failed) {
  for (const f of r.failures) {
    const key = f.split(":")[0].replace(/\d+/g, "N").replace(/ with unrelated.*/, "");
    byReason[key] = (byReason[key] || 0) + 1;
  }
}

console.log(`PASS ${passed.length}   FAIL ${failed.length}   (${Math.round((failed.length / results.length) * 100)}% would be de-indexed)\n`);
console.log("Failures by reason:");
for (const [reason, n] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${reason}`);
}

if (VERBOSE) {
  console.log("\nFailing lessons:");
  for (const r of failed) console.log(`  ${r.slug}\n      ${r.failures.join("\n      ")}`);
}

if (JSON_OUT) {
  writeFileSync(
    JSON_OUT,
    JSON.stringify(
      { generated: new Date().toISOString(), total: results.length, passed: passed.length, failed: failed.length,
        failing: failed.map(({ vocab, ...r }) => r) },
      null, 2
    )
  );
  console.log(`\nWrote ${JSON_OUT}`);
}

if (APPLY) {
  console.log("\nApplying seo_indexable…");
  let ok = 0, err = 0;
  for (const r of results) {
    const { error: e } = await supabase
      .from("tutor_lessons")
      .update({ seo_indexable: r.failures.length === 0 })
      .eq("slug", r.slug);
    if (e) { err++; if (err < 4) console.error(`  ${r.slug}: ${e.message}`); } else ok++;
  }
  console.log(`  updated ${ok}, errors ${err}`);
  if (err) console.log("  (does the seo_indexable column exist? see supabase/ migration)");
} else {
  console.log("\nRead-only. Re-run with --apply to write seo_indexable.");
}
