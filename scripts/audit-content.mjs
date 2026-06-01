// scripts/audit-content.mjs
// Read-only audit of FrancoLink content in Supabase.
// Usage: node scripts/audit-content.mjs

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TTS_BUCKET = "tts-cache";
const IMG_BUCKET = "lesson-images";

function isPlaceholderImage(v) {
  if (!v) return true;
  const s = String(v).trim();
  if (!s) return true;
  if (s.startsWith("/images/vocab/")) return true;
  if (s.endsWith(".svg")) return true;
  return false;
}

function vocabFields(item) {
  return {
    term: item.term ?? item.word ?? item.french ?? null,
    translation: item.translation ?? item.definition ?? item.meaning ?? null,
    pronunciation: item.pronunciation ?? null,
    partOfSpeech: item.partOfSpeech ?? item.pos ?? null,
    image: item.image ?? null,
    example: item.exampleSentence ?? item.example ?? null,
  };
}

async function main() {
  console.log("─".repeat(64));
  console.log("FrancoLink content audit");
  console.log("─".repeat(64));

  // 1. courses, units, lessons, exercises counts
  const tables = ["courses", "units", "lessons", "exercises"];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`  ${t.padEnd(10)} ERROR: ${error.message}`);
    } else {
      console.log(`  ${t.padEnd(10)} ${count}`);
    }
  }

  // 2. courses breakdown
  console.log("\nCourses:");
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, language, level")
    .order("created_at");
  if (courses) {
    for (const c of courses) {
      const { count: lessonCount } = await supabase
        .from("lessons")
        .select("*, unit:units!inner(course_id)", { count: "exact", head: true })
        .eq("unit.course_id", c.id);
      console.log(
        `  · ${(c.title || c.slug || c.id).padEnd(40)} ${(c.language || "?").padEnd(8)} ${(c.level || "?").padEnd(4)} lessons=${lessonCount ?? "?"}`
      );
    }
  }

  // 3. lesson content shape + vocab coverage
  console.log("\nLessons with vocabulary:");
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, slug, content")
    .order("created_at");

  let lessonsWithVocab = 0;
  let totalVocab = 0;
  let vocabMissingImage = 0;
  let vocabMissingPronunciation = 0;
  let vocabMissingExample = 0;
  let vocabMissingTranslation = 0;
  let vocabMissingTerm = 0;
  let lessonsMissingGrammar = 0;
  let lessonsMissingDialogue = 0;
  let exerciseCount = 0;
  const shapeVariants = new Map();

  if (lessons) {
    for (const l of lessons) {
      const c = l.content || {};
      const vocab = Array.isArray(c.vocabulary) ? c.vocabulary : [];
      if (vocab.length) {
        lessonsWithVocab++;
        totalVocab += vocab.length;
        for (const v of vocab) {
          const f = vocabFields(v);
          if (!f.term) vocabMissingTerm++;
          if (!f.translation) vocabMissingTranslation++;
          if (!f.pronunciation) vocabMissingPronunciation++;
          if (!f.example) vocabMissingExample++;
          if (isPlaceholderImage(f.image)) vocabMissingImage++;
          // shape variant: which key names used?
          const keys = Object.keys(v).sort().join(",");
          shapeVariants.set(keys, (shapeVariants.get(keys) || 0) + 1);
        }
      }
      if (!c.grammar || (Array.isArray(c.grammar) && c.grammar.length === 0)) lessonsMissingGrammar++;
      if (!c.dialogue) lessonsMissingDialogue++;
    }
  }

  const { count: exCount } = await supabase
    .from("exercises")
    .select("*", { count: "exact", head: true });
  exerciseCount = exCount || 0;

  console.log(`  lessonsWithVocab          ${lessonsWithVocab} / ${lessons?.length ?? 0}`);
  console.log(`  totalVocabItems           ${totalVocab}`);
  console.log(`  vocab missing term        ${vocabMissingTerm}`);
  console.log(`  vocab missing translation ${vocabMissingTranslation}`);
  console.log(`  vocab missing image       ${vocabMissingImage}  (${pct(vocabMissingImage, totalVocab)})`);
  console.log(`  vocab missing pronun.     ${vocabMissingPronunciation}  (${pct(vocabMissingPronunciation, totalVocab)})`);
  console.log(`  vocab missing example     ${vocabMissingExample}  (${pct(vocabMissingExample, totalVocab)})`);
  console.log(`  lessons missing grammar   ${lessonsMissingGrammar} / ${lessons?.length ?? 0}`);
  console.log(`  lessons missing dialogue  ${lessonsMissingDialogue} / ${lessons?.length ?? 0}`);
  console.log(`  total exercises           ${exerciseCount}`);
  if (lessons?.length) {
    console.log(`  exercises per lesson      avg=${(exerciseCount / lessons.length).toFixed(1)}`);
  }

  // 4. exercise type distribution
  const { data: exTypes } = await supabase
    .from("exercises")
    .select("exercise_type");
  if (exTypes) {
    const tally = {};
    for (const r of exTypes) tally[r.exercise_type] = (tally[r.exercise_type] || 0) + 1;
    console.log("\nExercise types:");
    for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${k.padEnd(20)} ${v}`);
    }
  }

  // 5. vocab JSONB shape drift
  console.log("\nVocab JSONB key signatures (top 5):");
  const variants = [...shapeVariants.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  for (const [keys, n] of variants) {
    console.log(`  ${n.toString().padStart(5)} × {${keys}}`);
  }

  // 6. Storage buckets
  console.log("\nStorage buckets:");
  for (const bucket of [TTS_BUCKET, IMG_BUCKET]) {
    const { data: files, error } = await supabase.storage.from(bucket).list("", { limit: 1 });
    if (error) {
      console.log(`  ${bucket.padEnd(18)} ERROR: ${error.message}`);
    } else {
      console.log(`  ${bucket.padEnd(18)} OK (sample present: ${files?.length ? "yes" : "no"})`);
    }
  }

  // count files in tts-cache/french
  const ttsCount = await countBucketFolder(TTS_BUCKET, "french");
  const vocabImgCount = await countBucketFolder(IMG_BUCKET, "vocab");
  console.log(`  ${TTS_BUCKET}/french   files=${ttsCount}`);
  console.log(`  ${IMG_BUCKET}/vocab    files=${vocabImgCount}`);

  // 7. user activity
  console.log("\nUser activity:");
  const { count: userCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });
  console.log(`  users                     ${userCount}`);
  const { count: progressCount } = await supabase
    .from("lesson_progress")
    .select("*", { count: "exact", head: true });
  console.log(`  lesson_progress rows      ${progressCount}`);
  const { count: completedCount } = await supabase
    .from("lesson_progress")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");
  console.log(`  completed lessons         ${completedCount}`);

  console.log("\nDone.");
}

function pct(n, d) {
  if (!d) return "—";
  return `${((n / d) * 100).toFixed(0)}%`;
}

async function countBucketFolder(bucket, prefix) {
  let total = 0;
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) return `err: ${error.message}`;
    if (!data || data.length === 0) break;
    total += data.length;
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return total;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
