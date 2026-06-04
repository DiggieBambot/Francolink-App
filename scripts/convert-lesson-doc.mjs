// scripts/convert-lesson-doc.mjs
//
// Convert one Google Doc (French lesson template) into structured JSON
// via Gemini, validate, and upsert into tutor_lessons (status='review').
//
// Usage:
//   node scripts/convert-lesson-doc.mjs <docIdOrUrl>
//   node scripts/convert-lesson-doc.mjs <docIdOrUrl> --dry      # print JSON, no DB write
//   node scripts/convert-lesson-doc.mjs <docIdOrUrl> --overwrite # replace existing slug
//
// Env required (.env.local):
//   GEMINI_API_KEY
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

import OpenAI from "openai";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const VALID_KINDS = new Set([
  "warmup_vocabulary",
  "vocabulary_with_examples",
  "fill_in_blank_dialogue",
  "fill_in_blank_dialogue_extended",
  "dialogue_read_aloud",
  "matching_qa",
  "word_order",
  "image_question_prompts",
  "free_response",
]);

export function extractDocId(input) {
  if (!input) return null;
  const m = input.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) return input;
  return null;
}

export async function fetchDocText(docId) {
  const url = `https://docs.google.com/document/d/${docId}/export?format=txt`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Drive export failed: HTTP ${res.status}`);
  const text = await res.text();
  // Strip BOM.
  return text.replace(/^﻿/, "");
}

const PROMPT = (doc) => `You are converting a French language-learning lesson from a Google Doc into structured JSON. The same template repeats across 300 lessons.

SCHEMA (output exactly this shape, valid JSON only)
Top level: { slug, title, language, level, duration_minutes, topic_tags[], objectives[], tutor_overview{}, sections[] }

objectives: array of { student_label, skill, cefr_can_do }
tutor_overview: { skills_covered[], estimated_minutes, teaching_tips[], common_mistakes[] }

sections: array. EVERY section object MUST include a string property "kind" set to one of these exact values, which determines the additional fields:
- kind="warmup_vocabulary": { kind, number, title, student_instruction, tutor_instruction, items: [{ term, note? }] }
- kind="vocabulary_with_examples": { kind, number, title, student_instruction, tutor_instruction, items: [{ term, example }] }
- kind="fill_in_blank_dialogue": { kind, number, title, student_instruction, tutor_instruction, example: { tutor_line, student_line }, exchanges: [{ speaker, speaker_role, text, blank? }], answer_pool[], valid_answers_by_blank{} }
- kind="fill_in_blank_dialogue_extended": same as above but blanks is an array of ints when one line has multiple blanks. Also has student_role, tutor_role.
- kind="dialogue_read_aloud": { kind, number, title, student_instruction, tutor_instruction, context, student_role, tutor_role, lines: [{ speaker, role, text }] }
- kind="matching_qa": { kind, number, title, student_instruction, tutor_instruction, pairs: [{ question, answer }] }
- kind="word_order": { kind, number, title, student_instruction, tutor_instruction, example: { scrambled, correct }, items: [{ scrambled, expected_topic }] }
- kind="image_question_prompts": { kind, number, title, student_instruction, tutor_instruction, example: { student_question }, prompts: [{ question, image_hint }] }
- kind="free_response": { kind, number, title, student_instruction, tutor_instruction, example_answer, questions[] }

The "kind" field is REQUIRED on every section — never omit it. Map exercise types to kinds by their content shape, not the doc's heading text.

AUGMENTATION RULES
1. Every section needs a tutor_instruction. The doc only has student instructions — synthesize a useful tutor instruction (e.g. "Drill pronunciation. ~3 minutes.")
2. tutor_overview.teaching_tips and common_mistakes: invent 2-4 each based on what an experienced French tutor would say for this exact lesson content. Be specific to the words in the doc.
3. valid_answers_by_blank: for each blank, list the answer_pool items that semantically fit. If unsure, list all reasonable matches.
4. image_hint: a short concrete scene description ("shopping bags", "shoes with price tag") that Pexels could find a photo for.
5. skill on objectives: pick one of speaking, listening, reading, writing, grammar, vocabulary.
6. cefr_can_do: a single sentence in the CEFR "Can do" style.
7. slug: ascii kebab-case of title.
8. level: infer from content. BIAS UP — if the lesson uses passé composé, futur proche with multiple tenses, or topical vocabulary beyond basics, choose A2 or B1, NOT A1. Reserve A1 only for present tense + 5-10 basic words on greetings/numbers/family.
9. topic_tags: 3-5 relevant tags in French or grammar terms.
10. speaker_role values MUST be lowercase ("tutor" / "student"), never capitalized.
11. NUMBERING: the doc has "Exercise N" sections followed by "Pratiquons" subsections. Number Exercises as integers (1, 2, 3...). Number each "Pratiquons" subsection as the PRECEDING exercise + 0.5 (so Pratiquons after Exercise 1 is 1.5, after Exercise 2 is 2.5, etc).

WHAT'S LITERAL VS INVENTED
EVERYTHING from the doc must appear verbatim in the right field. Do NOT change the French content. Only ADD: tutor_instruction, tutor_overview, valid_answers_by_blank, image_hint, expected_topic, cefr_can_do.

INPUT DOCUMENT TEXT

${doc}

OUTPUT
Return ONLY valid JSON. No markdown, no commentary. Begin with { and end with }.`;

export async function geminiConvert(docText) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY in .env.local");
  const client = new OpenAI({ apiKey: key });
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You convert French language-learning lessons into structured JSON. Follow the user's schema exactly. Output valid JSON only.",
      },
      { role: "user", content: PROMPT(docText) },
    ],
  });
  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned no content");
  return JSON.parse(text);
}

function _shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function _tokensOf(s) {
  return String(s || "").trim().split(/\s+/).filter(Boolean);
}

export function repairWordOrder(lesson) {
  for (const section of lesson.sections || []) {
    if (section.kind !== "word_order") continue;
    if (section.example) {
      const target = (section.example.correct || "").trim();
      if (target) {
        section.example.correct = target;
        const toks = _tokensOf(target);
        let shuffled = _shuffle(toks).join(" ");
        if (shuffled === target && toks.length > 1) {
          const t = toks.slice();
          [t[0], t[t.length - 1]] = [t[t.length - 1], t[0]];
          shuffled = t.join(" ");
        }
        section.example.scrambled = shuffled;
      }
    }
    for (const item of section.items || []) {
      let target = (item.correct || "").trim();
      if (!target && item.expected_topic && /\s/.test(item.expected_topic)) {
        target = item.expected_topic.trim();
      }
      if (target) {
        item.correct = target;
        const toks = _tokensOf(target);
        let shuffled = _shuffle(toks).join(" ");
        if (shuffled === target && toks.length > 1) {
          const t = toks.slice();
          [t[0], t[t.length - 1]] = [t[t.length - 1], t[0]];
          shuffled = t.join(" ");
        }
        item.scrambled = shuffled;
      }
    }
  }
}

export function validateLesson(lesson) {
  const issues = [];
  if (!lesson || typeof lesson !== "object") {
    return ["root is not an object"];
  }
  for (const f of ["slug", "title", "language", "level", "sections"]) {
    if (!lesson[f]) issues.push(`missing required field: ${f}`);
  }
  if (!Array.isArray(lesson.sections)) {
    issues.push("sections is not an array");
    return issues;
  }
  lesson.sections.forEach((s, i) => {
    if (!s.kind) issues.push(`section[${i}] missing kind`);
    else if (!VALID_KINDS.has(s.kind)) issues.push(`section[${i}] unknown kind: ${s.kind}`);
    if (s.number == null) issues.push(`section[${i}] missing number`);
    if (Array.isArray(s.exchanges)) {
      s.exchanges.forEach((ex, j) => {
        if (ex.speaker_role && ex.speaker_role !== ex.speaker_role.toLowerCase()) {
          issues.push(`section[${i}].exchanges[${j}] non-lowercase speaker_role: ${ex.speaker_role}`);
        }
      });
    }
  });
  return issues;
}

export async function convertAndUpsert({ docIdOrUrl, dry = false, overwrite = false }) {
  const docId = extractDocId(docIdOrUrl);
  if (!docId) throw new Error(`Could not extract doc ID from: ${docIdOrUrl}`);

  console.log(`[${docId}] fetching…`);
  const docText = await fetchDocText(docId);
  if (docText.length < 100) throw new Error(`Doc text too short (${docText.length} chars) — is it public?`);

  console.log(`[${docId}] converting (${docText.length} chars)…`);
  const lesson = await geminiConvert(docText);
  repairWordOrder(lesson);

  const issues = validateLesson(lesson);
  const notes = issues.length ? issues.join("; ") : null;
  if (issues.length) {
    console.warn(`[${docId}] ⚠ ${issues.length} validation issue(s):`);
    for (const i of issues) console.warn(`  · ${i}`);
  } else {
    console.log(`[${docId}] ✓ schema valid`);
  }

  if (dry) {
    console.log(JSON.stringify(lesson, null, 2));
    return { lesson, issues, written: false };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const row = {
    slug: lesson.slug,
    title: lesson.title,
    language: lesson.language || "fr",
    level: lesson.level,
    duration_minutes: lesson.duration_minutes || null,
    topic_tags: Array.isArray(lesson.topic_tags) ? lesson.topic_tags : [],
    source_doc_id: docId,
    source_url: `https://docs.google.com/document/d/${docId}/edit`,
    status: "review",
    content: lesson,
    conversion_notes: notes,
  };

  const { data: existing } = await supabase
    .from("tutor_lessons")
    .select("id, slug")
    .eq("slug", lesson.slug)
    .maybeSingle();

  if (existing && !overwrite) {
    console.log(`[${docId}] slug "${lesson.slug}" already exists (id=${existing.id}). Use --overwrite to replace.`);
    return { lesson, issues, written: false, skipped: "exists" };
  }

  if (existing) {
    const { error } = await supabase
      .from("tutor_lessons")
      .update(row)
      .eq("id", existing.id);
    if (error) throw new Error(`update failed: ${error.message}`);
    console.log(`[${docId}] ✓ updated id=${existing.id}`);
    return { lesson, issues, written: true, id: existing.id, mode: "update" };
  }

  const { data: inserted, error } = await supabase
    .from("tutor_lessons")
    .insert(row)
    .select("id")
    .single();
  if (error) throw new Error(`insert failed: ${error.message}`);
  console.log(`[${docId}] ✓ inserted id=${inserted.id}`);
  return { lesson, issues, written: true, id: inserted.id, mode: "insert" };
}

// CLI entry
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node scripts/convert-lesson-doc.mjs <docIdOrUrl> [--dry] [--overwrite]");
    process.exit(1);
  }
  const dry = process.argv.includes("--dry");
  const overwrite = process.argv.includes("--overwrite");
  try {
    await convertAndUpsert({ docIdOrUrl: arg, dry, overwrite });
  } catch (err) {
    console.error("✗", err.message);
    process.exit(1);
  }
}
