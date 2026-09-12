// Fill in missing lesson images — vocabulary cards and hero photos.
//
//   npx tsx scripts/hydrate-lesson-images.mts --lang fr            # dry run
//   npx tsx scripts/hydrate-lesson-images.mts --lang fr --apply
//   npx tsx scripts/hydrate-lesson-images.mts --lang fr --apply --limit 20
//
// Runs hydrateImages() locally rather than through the production endpoint, so
// there is no function timeout to work around and the whole catalogue can go in
// one pass. Idempotent: hydrateImages skips anything already pointing at the
// bucket, so re-running only picks up what is still missing.
//
// The lesson worker populates image_query on vocabulary items, which is what
// this reads — so it wants running after a worker sweep, not before.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { config } from "dotenv";
config({ path: ".env.local" });

import { adminClient, contentHash } from "../src/lib/lessons/worker/process";
import { hydrateImages } from "../src/lib/lessons/hydrate-images";

const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
const val = (f: string) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};

const apply = has("--apply");
const language = val("--lang") ?? "fr";
const limit = parseInt(val("--limit") ?? "5000", 10);
const excl = (val("--exclude") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const supa = adminClient();

/** Count what a lesson is still missing, so the dry run is meaningful. */
function missingOf(content: any): { vocab: number; hero: number; prompts: number } {
  let vocab = 0, prompts = 0;
  for (const s of content?.sections ?? []) {
    if (["warmup_vocabulary", "vocabulary_with_examples"].includes(s.kind))
      for (const it of s.items ?? []) if (!it.image_url) vocab++;
    for (const p of s.prompts ?? []) if (!p.image_url) prompts++;
  }
  return { vocab, hero: content?.hero_image_url ? 0 : 1, prompts };
}

const { data: lessons, error } = await supa
  .from("tutor_lessons")
  .select("id, slug, title, level, language, content")
  .eq("language", language)
  .limit(limit);

if (error) {
  console.error(`Could not load lessons: ${error.message}`);
  process.exit(1);
}

const queue = (lessons ?? [])
  .filter((l) => !excl.some((p) => l.slug.startsWith(p)))
  .map((l) => ({ ...l, missing: missingOf(l.content) }))
  .filter((l) => l.missing.vocab + l.missing.hero + l.missing.prompts > 0);

const totals = queue.reduce(
  (a, l) => ({ vocab: a.vocab + l.missing.vocab, hero: a.hero + l.missing.hero, prompts: a.prompts + l.missing.prompts }),
  { vocab: 0, hero: 0, prompts: 0 }
);

console.log(`\nlanguage=${language}  lessons needing images: ${queue.length}`);
console.log(`  vocab cards: ${totals.vocab}   hero images: ${totals.hero}   prompt images: ${totals.prompts}`);
console.log(apply ? "  APPLY — will fetch and write\n" : "  DRY RUN — pass --apply to fetch\n");

if (!apply || queue.length === 0) process.exit(0);

let done = 0, failed = 0, filled = 0;
const started = Date.now();

for (const row of queue) {
  const n = `${done + failed + 1}/${queue.length}`.padStart(9);
  try {
    const lesson = { ...(row.content as any), slug: row.slug, title: row.title, level: row.level, language: row.language };
    const result = await hydrateImages(lesson as any);
    const after = missingOf(lesson);
    const got = row.missing.vocab + row.missing.hero + row.missing.prompts - (after.vocab + after.hero + after.prompts);
    filled += got;

    if (got > 0) {
      const { error: upErr } = await supa
        .from("tutor_lessons")
        .update({ content: lesson, ai_pass_hash: contentHash(lesson) })
        .eq("id", row.id);
      if (upErr) throw new Error(upErr.message);
    }
    done++;
    console.log(`${n}  ${row.slug.slice(0, 44).padEnd(44)} +${got} images  ${(result as any)?.stats?.misses ? `(${(result as any).stats.misses} not found)` : ""}`);
  } catch (err) {
    failed++;
    console.log(`${n}  ${row.slug.slice(0, 44).padEnd(44)} failed — ${err instanceof Error ? err.message.slice(0, 60) : err}`);
  }
}

console.log(`\n  ${done} lessons processed, ${failed} failed, ${filled} images filled in ${((Date.now() - started) / 60000).toFixed(1)} min\n`);
