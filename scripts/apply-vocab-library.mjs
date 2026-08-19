#!/usr/bin/env node
// scripts/apply-vocab-library.mjs
//
// Repoints an existing lesson's vocab images at the shared picture library
// (src/lib/vocab-library), replacing the Pexels stock photos hydration first
// fetched. Items whose concept isn't in the library keep the photo they have.
//
// Usage:
//   node --env-file=.env.local scripts/apply-vocab-library.mjs --slug=corps --dry
//   node --env-file=.env.local scripts/apply-vocab-library.mjs --slug=corps

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
const DRY = process.argv.includes("--dry");
if (!SLUG) { console.error("Usage: --slug=<lesson-slug>"); process.exit(1); }

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
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z ]+/g, " ")
    .replace(/\s+/g, " ").trim();
}
// Exact match only — mirrors conceptFor() in src/lib/vocab-library/concepts.ts.
function conceptFor(...hints) {
  for (const hint of hints) {
    const n = normalize(hint);
    if (!n) continue;
    const hit = CONCEPTS.find((c) => c.slug === n || c.aliases.includes(n));
    if (hit) return hit;
  }
  return null;
}
const urlFor = (slug) =>
  `${SUPA_URL.replace(/\/$/, "")}/storage/v1/object/public/lesson-images/vocab-library/${slug}.png`;

const { data, error } = await supabase
  .from("tutor_lessons")
  .select("id, slug, content")
  .eq("slug", SLUG)
  .limit(1)
  .single();
if (error) { console.error(error.message); process.exit(1); }

const content = data.content;
let changed = 0, missed = 0;
console.log(`\n🖼  ${SLUG}${DRY ? " (dry run)" : ""}\n`);

for (const s of content.sections || []) {
  if (s.kind !== "warmup_vocabulary" && s.kind !== "vocabulary_with_examples") continue;
  for (const it of s.items || []) {
    const c = conceptFor(it.image_query, it.translation, it.term);
    if (!c) { console.log(`  ${String(it.term).padEnd(14)} —  no concept (keeps photo)`); missed++; continue; }
    it.image_url = urlFor(c.slug);
    console.log(`  ${String(it.term).padEnd(14)} →  ${c.slug}`);
    changed++;
  }
}

if (!DRY && changed) {
  const { error: upErr } = await supabase
    .from("tutor_lessons")
    .update({ content })
    .eq("id", data.id);
  if (upErr) { console.error(upErr.message); process.exit(1); }
}
console.log(`\n${DRY ? "Would update" : "Updated"} ${changed} item(s), ${missed} left on photos.\n`);
