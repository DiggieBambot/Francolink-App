/**
 * Batch-hydrate images for all English tutor lessons.
 * Uses the existing hydrateImages() function with Pexels API.
 *
 * Rate-limited to ~200 Pexels calls/hour, so this will take a while
 * for 279 lessons. Run and leave it going.
 *
 * Usage: npx tsx scripts/hydrate-english-images.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { hydrateImages } from "../src/lib/lessons/hydrate-images";
import type { Lesson } from "../src/lib/lessons/types";

// Ensure env is loaded (dotenv reads .env, but our file is .env.local)
import { config } from "dotenv";
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE env vars. Check .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log("ENV check:");
  console.log("  PEXELS_API_KEY:", process.env.PEXELS_API_KEY ? "set ✓" : "MISSING ✗");
  console.log("  NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "set ✓" : "MISSING ✗");
  console.log("  SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_KEY ? "set ✓" : "MISSING ✗");

  if (!process.env.PEXELS_API_KEY) {
    console.error("\nMissing PEXELS_API_KEY env var");
    process.exit(1);
  }

  // Quick connectivity test
  console.log("\nTesting Pexels API connectivity...");
  try {
    const testRes = await fetch("https://api.pexels.com/v1/search?query=cat&per_page=1", {
      headers: { Authorization: process.env.PEXELS_API_KEY, Accept: "application/json" },
    });
    const testJson = await testRes.json() as any;
    console.log(`  Pexels OK: ${testRes.status}, ${testJson.total_results} results for "cat"\n`);
  } catch (err) {
    console.error(`  Pexels FAILED: ${err instanceof Error ? err.message : err}`);
    console.error("  Network issue detected. Exiting.");
    process.exit(1);
  }

  // Fetch all English lessons that need images
  const { data: lessons, error } = await supabase
    .from("tutor_lessons")
    .select("id, slug, content")
    .eq("language", "en")
    .eq("status", "published")
    .order("slug");

  if (error || !lessons) {
    console.error("Failed to fetch lessons:", error?.message);
    process.exit(1);
  }

  console.log(`Found ${lessons.length} English lessons to hydrate.\n`);

  let done = 0;
  let skipped = 0;
  let errors = 0;
  let totalVocab = 0;
  let totalPrompts = 0;

  for (const row of lessons) {
    const lesson = row.content as Lesson;
    const hasHero = lesson.hero_image_url?.includes("lesson-images");

    // Check if already hydrated (has hero + vocab images)
    const vocabSections = lesson.sections.filter(
      (s: any) => s.kind === "warmup_vocabulary" || s.kind === "vocabulary_with_examples"
    );
    const vocabImages = vocabSections
      .flatMap((s: any) => s.items || [])
      .filter((i: any) => i.image_url?.includes("lesson-images"));

    if (hasHero && vocabImages.length > 0) {
      skipped++;
      continue;
    }

    try {
      console.log(`  [${done + 1}/${lessons.length - skipped}] Hydrating ${row.slug}...`);
      const result = await hydrateImages(lesson, { shareVocabBucket: true });

      // Save back to DB
      const { error: updateErr } = await supabase
        .from("tutor_lessons")
        .update({ content: lesson })
        .eq("id", row.id);

      if (updateErr) {
        console.error(`    ✗ Update failed: ${updateErr.message}`);
        errors++;
      } else {
        totalVocab += result.stats.vocab;
        totalPrompts += result.stats.prompts;
        console.log(`    ✓ ${result.stats.vocab} vocab, ${result.stats.prompts} prompts, ${result.stats.misses} misses`);
      }
    } catch (err) {
      console.error(`    ✗ Error: ${err instanceof Error ? err.message : err}`);
      errors++;
    }

    done++;

    // Progress every 20 lessons
    if (done % 20 === 0) {
      console.log(`\n  --- Progress: ${done} done, ${skipped} skipped, ${errors} errors ---\n`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Complete!`);
  console.log(`  Processed: ${done}`);
  console.log(`  Skipped (already hydrated): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total vocab images: ${totalVocab}`);
  console.log(`  Total prompt images: ${totalPrompts}`);
  console.log(`========================================`);
}

main().catch(console.error);
