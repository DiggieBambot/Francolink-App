#!/usr/bin/env node
// scripts/apply-vocab-library.mjs
//
// Repoints an existing lesson's vocab images at the shared picture library
// (src/lib/vocab-library), replacing the Pexels stock photos hydration first
// fetched. Items whose concept isn't in the library keep the photo they have.
//
// Only touches items whose English hint matches a library concept exactly;
// everything else keeps the photo it already has.
//
// Usage:
//   node --env-file=.env.local scripts/apply-vocab-library.mjs --slug=corps --dry
//   node --env-file=.env.local scripts/apply-vocab-library.mjs --slug=corps
//   node --env-file=.env.local scripts/apply-vocab-library.mjs --kids --dry
//   node --env-file=.env.local scripts/apply-vocab-library.mjs --kids

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
const DRY = process.argv.includes("--dry");
// Children's material: the A1 course plus anything tagged for kids. These are
// the lessons where a cartoon beats a stock photo; B1+ business vocabulary is
// deliberately left alone.
const KIDS = process.argv.includes("--kids");
if (!SLUG && !KIDS) { console.error("Usage: --slug=<lesson-slug> | --kids"); process.exit(1); }

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabase = createClient(SUPA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Reuse the concept list + resolver from the app source, without a build step.
function loadConcepts() {
  const src = readFileSync(join(ROOT, "src/lib/vocab-library/concepts.ts"), "utf8");
  const m = src.match(/export const CONCEPTS: Concept\[\] = (\[[\s\S]*?\n\]);/);
  // eslint-disable-next-line no-eval
  return eval(m[1]);
}
const CONCEPTS = loadConcepts();

function normalize(s) {
  return String(s || "").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z ]+/g, " ")
    .replace(/\s+/g, " ").trim()
    .replace(/^(a|an|the) /, "");
}
// Exact match only — mirrors conceptFor() in src/lib/vocab-library/concepts.ts.
const BY_ALIAS = new Map();
for (const c of CONCEPTS) {
  BY_ALIAS.set(normalize(c.slug.replace(/-/g, " ")), c);
  for (const a of c.aliases) BY_ALIAS.set(normalize(a), c);
}
function conceptFor(...hints) {
  for (const hint of hints) {
    const n = normalize(hint);
    if (n && BY_ALIAS.has(n)) return BY_ALIAS.get(n);
  }
  return null;
}
const urlFor = (slug) =>
  `${SUPA_URL.replace(/\/$/, "")}/storage/v1/object/public/lesson-images/vocab-library/${slug}.png`;

// A concept only counts as usable once its picture is actually in the bucket.
// The catalog can run ahead of the generator (a quota runs out mid-build), and
// pointing a lesson at a file that isn't there would be worse than the photo
// it replaces.
const inLibrary = new Set();
for (let offset = 0; ; offset += 1000) {
  const { data, error } = await supabase.storage
    .from("lesson-images")
    .list("vocab-library", { limit: 1000, offset });
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  for (const f of data) inLibrary.add(f.name.replace(/\.png$/, ""));
  if (data.length < 1000) break;
}

let lessons;
if (SLUG) {
  const { data, error } = await supabase
    .from("tutor_lessons").select("id, slug, content").eq("slug", SLUG).limit(1);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data.length) { console.error(`No lesson with slug "${SLUG}"`); process.exit(1); }
  lessons = data;
} else {
  const { data, error } = await supabase
    .from("tutor_lessons").select("id, slug, level, topic_tags, content");
  if (error) { console.error(error.message); process.exit(1); }
  lessons = data.filter(
    (l) => l.level === "A1" || (l.topic_tags || []).some((t) => /kid|enfant|child/i.test(t))
  );
}

console.log(`\n🖼  ${lessons.length} lesson(s)${DRY ? " — dry run" : ""}\n`);
let changed = 0, missed = 0, touchedLessons = 0;

for (const lesson of lessons) {
  const content = lesson.content;
  let n = 0;
  const notes = [];
  for (const s of content?.sections || []) {
    if (s.kind !== "warmup_vocabulary" && s.kind !== "vocabulary_with_examples") continue;
    for (const it of s.items || []) {
      // image_query first: it is the most specific hint, and it is what keeps
      // "orange fruit" on the fruit and a bare "orange" on the colour swatch.
      const c = conceptFor(it.image_query, it.translation);
      // `hold` = the picture exists but failed review; never serve it.
      if (!c || c.hold || !inLibrary.has(c.slug)) { missed++; continue; }
      if (it.image_url === urlFor(c.slug)) continue;
      it.image_url = urlFor(c.slug);
      notes.push(`${String(it.term).slice(0, 18)}→${c.slug}`);
      n++;
    }
  }
  if (!n) continue;
  touchedLessons++;
  changed += n;
  console.log(`  ${lesson.slug.padEnd(42)} ${String(n).padStart(2)}  ${notes.slice(0, 6).join(" ")}`);
  if (!DRY) {
    const { error: upErr } = await supabase
      .from("tutor_lessons").update({ content }).eq("id", lesson.id);
    if (upErr) { console.error(`  ! ${lesson.slug}: ${upErr.message}`); process.exit(1); }
  }
}

console.log(`\n${DRY ? "Would update" : "Updated"} ${changed} item(s) across ${touchedLessons} lesson(s); ${missed} left on photos.\n`);
