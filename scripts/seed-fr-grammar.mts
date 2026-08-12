// @ts-nocheck — run only via tsx (npx tsx scripts/seed-fr-grammar.mts [--publish]);
// the .ts import extension is a tsx-runtime convention, not for the app's tsc build.
// One-off seeder for the fr-grammar A1 lessons + interactive homework.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { frGrammarLessons, grammarHomework } from "../src/lib/seed/fr-grammar/index.ts";

// Minimal .env.local parser (no dotenv dependency assumed).
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const status = process.argv.includes("--publish") ? "published" : "review";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

for (const lesson of frGrammarLessons) {
  const row = {
    slug: lesson.slug,
    title: lesson.title,
    language: lesson.language,
    level: lesson.level,
    duration_minutes: lesson.duration_minutes ?? null,
    topic_tags: lesson.topic_tags,
    source_url: "seed:fr-grammar",
    status,
    content: lesson,
    conversion_notes: null,
    published_at: status === "published" ? new Date().toISOString() : null,
  };
  const { data: existing } = await db.from("tutor_lessons").select("id").eq("slug", lesson.slug).maybeSingle();
  let lessonId: string;
  if (existing?.id) {
    const { error } = await db.from("tutor_lessons").update(row).eq("id", existing.id);
    if (error) throw new Error(`${lesson.slug}: ${error.message}`);
    lessonId = existing.id;
    console.log(`updated  ${lesson.slug}`);
  } else {
    const { data, error } = await db.from("tutor_lessons").insert(row).select("id").single();
    if (error) throw new Error(`${lesson.slug}: ${error.message}`);
    lessonId = data.id;
    console.log(`inserted ${lesson.slug}`);
  }

  const spec = grammarHomework.find((h) => h.lesson_slug === lesson.slug);
  if (spec) {
    const hwRow = {
      lesson_id: lessonId,
      lesson_slug: lesson.slug,
      title: spec.title,
      instructions: spec.instructions,
      questions: spec.questions,
      status: "published",
      enabled: true,
    };
    const { data: exHw } = await db.from("lesson_homework").select("id").eq("lesson_slug", lesson.slug).maybeSingle();
    if (exHw?.id) {
      const { error } = await db.from("lesson_homework").update(hwRow).eq("id", exHw.id);
      if (error) throw new Error(`homework ${lesson.slug}: ${error.message}`);
      console.log(`  homework updated`);
    } else {
      const { error } = await db.from("lesson_homework").insert(hwRow);
      if (error) throw new Error(`homework ${lesson.slug}: ${error.message}`);
      console.log(`  homework inserted`);
    }
  }
}
console.log(`\nDone. status=${status}`);
