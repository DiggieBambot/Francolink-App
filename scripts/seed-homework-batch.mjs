// Generate + publish + enable AI homework for a batch of /library lessons.
//
// Usage:
//   node scripts/seed-homework-batch.mjs                 # default batch 1
//   node scripts/seed-homework-batch.mjs slug-a slug-b   # explicit slugs
//   node scripts/seed-homework-batch.mjs --draft slug-a  # generate as draft (not live)
//
// Homework is created enabled+published by default so it's testable right away.
// Re-running a slug regenerates and overwrites its questions.

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const DEFAULT_BATCH = ["comment-ca-va", "famille-famille-immediate", "fruits", "corps", "combien"];

const args = process.argv.slice(2);
const draftOnly = args.includes("--draft");
const slugs = args.filter((a) => !a.startsWith("--"));
const batch = slugs.length ? slugs : DEFAULT_BATCH;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function lessonDigest(lesson) {
  const objectives = (lesson.objectives || [])
    .map((o) => `- ${o.student_label} (${o.skill})`)
    .join("\n");
  const vocab = [];
  for (const s of lesson.sections || []) {
    if (Array.isArray(s.items)) {
      for (const it of s.items) {
        if (it?.term) vocab.push(it.translation ? `${it.term} — ${it.translation}` : it.term);
      }
    }
  }
  return [
    `Title: ${lesson.title}`,
    `Language: ${lesson.language}   Level: ${lesson.level}`,
    objectives ? `Objectives:\n${objectives}` : "",
    vocab.length ? `Key vocabulary:\n${vocab.slice(0, 40).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");
}

async function generate(lesson) {
  const langName = lesson.language === "en" ? "English" : "French";
  const system =
    `You are a ${langName} teacher writing short homework that ASSESSES whether a CEFR ${lesson.level} ` +
    `student understood THIS specific lesson. Every question must test recall or correct use of the ` +
    `lesson's own vocabulary, structures, and objectives — not generic ${langName}. A student who did ` +
    `not study this lesson should not be able to answer well. Mix comprehension checks with short ` +
    `production tasks that force the student to USE the target words/structures. Keep it doable ` +
    `independently after the lesson and encouraging. Avoid multiple choice. Return STRICT JSON only.`;
  const user =
    `Lesson digest:\n\n${lessonDigest(lesson)}\n\n` +
    `Write homework that checks the student's understanding of the lesson above.\n` +
    `- "title": a short friendly title\n` +
    `- "instructions": 1-2 sentences telling the student what to do overall\n` +
    `- "questions": 3 to 5 items that each directly test a vocabulary item, structure, or objective ` +
    `from THIS lesson. Each: {"prompt": string in ${langName}, ` +
    `"prompt_translation": English gloss, "hint": short optional tip, ` +
    `"type": "short" or "long"}\n\n` +
    `Return JSON: {"title": string, "instructions": string, "questions": [...] }`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const parsed = JSON.parse(res.choices[0].message.content);
  const questions = (parsed.questions || [])
    .filter((q) => q && typeof q.prompt === "string" && q.prompt.trim())
    .slice(0, 5)
    .map((q) => ({
      prompt: q.prompt.trim(),
      prompt_translation: q.prompt_translation?.trim() || undefined,
      hint: q.hint?.trim() || undefined,
      type: q.type === "long" ? "long" : "short",
    }));
  if (!questions.length) throw new Error("no usable questions");
  return { title: parsed.title?.trim() || "Homework", instructions: parsed.instructions?.trim() || "", questions };
}

async function main() {
  console.log(`Seeding homework for ${batch.length} lesson(s)${draftOnly ? " (draft)" : " (live)"}:\n`);
  for (const slug of batch) {
    const { data: lesson, error } = await supabase
      .from("tutor_lessons")
      .select("id, slug, content, status")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !lesson) { console.log(`  ✖ ${slug} — lesson not found`); continue; }
    if (lesson.status !== "published") { console.log(`  ✖ ${slug} — not published`); continue; }

    try {
      const draft = await generate(lesson.content);
      const { error: upErr } = await supabase.from("lesson_homework").upsert(
        {
          lesson_id: lesson.id,
          lesson_slug: lesson.slug,
          title: draft.title,
          instructions: draft.instructions,
          questions: draft.questions,
          status: draftOnly ? "draft" : "published",
          enabled: !draftOnly,
        },
        { onConflict: "lesson_id" }
      );
      if (upErr) { console.log(`  ✖ ${slug} — ${upErr.message}`); continue; }
      console.log(`  ✔ ${slug} — ${draft.questions.length} questions (${draft.title})`);
    } catch (e) {
      console.log(`  ✖ ${slug} — ${e.message}`);
    }
  }
  console.log("\nDone.");
}

main();
