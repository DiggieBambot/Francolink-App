// scripts/generate-vocab-images.mjs
// Usage: node scripts/generate-vocab-images.mjs
// Generates images for all vocab words missing images and uploads to Supabase

import { createClient } from "@supabase/supabase-js";
// Using Cloudflare Workers AI — free, 100k requests/day
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


const BUCKET = "lesson-images";
const DELAY_MS = 3000; // 3s between requests to avoid rate limiting

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function termToFilename(term) {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

const CF_WORKER_URL = "https://francolink-image-gen.precious-bambot.workers.dev";

async function generateImage(term, translation, partOfSpeech) {
  const prompt = 
    `Flat vector illustration for French language learning app. ` +
    `Clearly representing: "${translation}" (French: "${term}"). ` +
    `Clean minimal educational colorful flat design, white background, no text, no letters, iconic simple representation.` +
    (partOfSpeech === "verb" ? " Show the action being performed." : " Show the object or concept clearly.");

  const response = await fetch(CF_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudflare error: ${response.status} ${err}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return { arrayBuffer, type: "image/jpeg" };
}

async function uploadImage(blob, filename) {
  const { arrayBuffer, type } = blob;
  const buffer = Buffer.from(arrayBuffer);
  const ext = type.includes("png") ? "png" : "jpg";
  const path = `vocab/${filename}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: blob.type, upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return publicUrl;
}

async function updateVocabImage(lessonId, content, termIndex, imageUrl) {
  content.vocabulary[termIndex].image = imageUrl;
  const { error } = await supabase
    .from("lessons")
    .update({ content })
    .eq("id", lessonId);
  if (error) throw new Error(`DB update failed: ${error.message}`);
}

async function main() {
  console.log("🚀 FrancoLink Vocab Image Generator\n");

  // Check env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) { console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL"); process.exit(1); }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) { console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  if (!process.env.HUGGINGFACE_API_KEY) { console.error("❌ Missing HUGGINGFACE_API_KEY"); process.exit(1); }

  // Fetch all lessons with vocabulary
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id, title, slug, content")
    .order("created_at");

  if (error) { console.error("❌ Failed to fetch lessons:", error.message); process.exit(1); }

  const lessonsWithVocab = lessons.filter((l) => {
    const vocab = l.content?.vocabulary;
    if (!vocab?.length) return false;
    // Only process French lessons (have term + translation fields)
    const first = vocab[0];
    return first && (first.term || first.word) && (first.translation || first.definition);
  });

  console.log(`📚 Found ${lessonsWithVocab.length} lessons with vocabulary\n`);

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const lesson of lessonsWithVocab) {
    const vocabulary = lesson.content.vocabulary;

    const missing = vocabulary
      .map((v, i) => ({ ...v, _index: i }))
      .filter((v) => {
        const img = v.image || "";
        return !img || img.startsWith("/images/vocab/") || img.endsWith(".svg");
      });

    if (missing.length === 0) {
      console.log(`✅ ${lesson.title} — all ${vocabulary.length} images present`);
      totalSkipped += vocabulary.length;
      continue;
    }

    console.log(`\n📖 ${lesson.title}`);
    console.log(`   ${missing.length} missing / ${vocabulary.length} total\n`);

    for (const word of missing) {
      const term = (word.term || word.word || word.french || "").trim();
      const translation = (word.translation || word.definition || word.meaning || "").trim();
      
      if (!term || !translation) {
        totalSkipped++;
        continue;
      }

      const filename = termToFilename(term) || `word-${word._index}`;
      process.stdout.write(`  🎨 "${term}" (${translation})... `);

      try {
        const blob = await generateImage(term, translation, word.partOfSpeech);
        const imageUrl = await uploadImage(blob, filename);
        await updateVocabImage(lesson.id, lesson.content, word._index, imageUrl);
        console.log(`✅`);
        totalGenerated++;
        await sleep(DELAY_MS);
      } catch (err) {
        console.log(`❌ ${err.message}`);
        totalErrors++;
        await sleep(1000);
      }
    }
  }

  console.log(`\n${"─".repeat(40)}`);
  console.log(`🏁 Done!`);
  console.log(`  ✅ Generated: ${totalGenerated}`);
  console.log(`  ⏭️  Skipped:   ${totalSkipped}`);
  console.log(`  ❌ Errors:    ${totalErrors}`);
}

main().catch(console.error);
