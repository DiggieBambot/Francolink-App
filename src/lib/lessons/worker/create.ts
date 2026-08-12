// Generating a lesson for a syllabus gap.
//
// New lessons always land with status 'review', never 'published' — auto-apply
// governs *repairs to existing lessons*, which are bounded edits to content a
// human already approved. A net-new lesson is unreviewed content, and pushing
// it straight into the live catalogue is a different risk entirely.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lesson } from "../types";
import { askJson } from "./ai";
import type { Gap } from "./gaps";
import { contentHash } from "./process";
import { validateLesson, type Defect } from "./validate";

const SYSTEM = `You are a CEFR curriculum author. You write one complete language lesson as JSON.
Output ONLY valid JSON matching the schema described by the user. Every field named in the schema must be present.
The target-language content must be natural, idiomatic and factually accurate, and pitched exactly at the stated CEFR level.
Translations are into English.`;

const SCHEMA_HINT = `{
  "title": "French title of the lesson",
  "title_translation": "English title",
  "objectives": [{ "student_label": "...", "skill": "speaking|listening|reading|writing|grammar|vocabulary", "cefr_can_do": "..." }],
  "learning_tips": ["2-4 short encouraging notes"],
  "sections": [
    { "kind": "warmup_vocabulary", "number": 1, "title": "...", "student_instruction": "...", "tutor_instruction": "...",
      "items": [{ "term": "...", "translation": "...", "part_of_speech": "...", "pronunciation": "/IPA/", "gender": "m|f", "example": "...", "example_translation": "...", "image_query": "concrete English scene for a stock-photo search" }] },
    { "kind": "grammar_explainer", "number": 2, "title": "...", "student_instruction": "...", "tutor_instruction": "...",
      "explanation": "...", "explanation_translation": "...",
      "table": { "headers": ["...", "..."], "rows": [{ "cells": ["...", "..."] }], "speak_col": 1 },
      "examples": [{ "text": "...", "translation": "..." }],
      "common_mistakes": [{ "wrong": "...", "right": "...", "note": "..." }],
      "tips": ["..."] },
    { "kind": "reading_comprehension", "number": 3, "title": "...", "student_instruction": "...", "tutor_instruction": "...",
      "passage": "paragraphs separated by \\n\\n, lesson vocabulary wrapped in **double asterisks**",
      "passage_translation": "...",
      "questions": [{ "question": "...", "answer": "a DIFFERENT, specific answer for each question" }] },
    { "kind": "fill_in_blank_dialogue", "number": 4, "title": "...", "student_instruction": "...", "tutor_instruction": "...",
      "exchanges": [{ "speaker": "...", "speaker_role": "tutor|student", "text": "line with ___ where the blank is", "translation": "...", "blank": 1 }],
      "answer_pool": ["every valid answer, plus 2-3 plausible distractors"],
      "valid_answers_by_blank": { "1": ["..."] } },
    { "kind": "word_order", "number": 5, "title": "...", "student_instruction": "...", "tutor_instruction": "...",
      "items": [{ "scrambled": "words in the wrong order", "correct": "the SAME words correctly ordered" }] },
    { "kind": "free_response", "number": 6, "title": "...", "student_instruction": "...", "tutor_instruction": "...",
      "questions": ["..."], "question_translations": ["..."], "example_answer": "...", "example_answer_translation": "..." }
  ]
}`;

const LEVEL_WORDS: Record<string, number> = {
  A1: 130, A2: 170, B1: 240, B2: 310, C1: 390, C2: 460,
};

export interface CreateOutcome {
  slug: string;
  lessonId: string | null;
  defects: Defect[];
  costUsd: number;
  created: boolean;
}

export async function createLessonForGap(
  supa: SupabaseClient,
  gap: Gap,
  language: string,
  model: string,
  ctx: { runId: string; itemId: string }
): Promise<CreateOutcome> {
  const words = LEVEL_WORDS[gap.level] ?? LEVEL_WORDS.B1;

  const context = [
    gap.before ? `The previous lesson in this series is "${gap.before}".` : null,
    gap.after ? `The next lesson in this series is "${gap.after}".` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const { data, costUsd } = await askJson<Partial<Lesson>>(
    model,
    SYSTEM,
    `Write lesson ${gap.sequence} of the "${gap.category}" series, at CEFR level ${gap.level}, in ${language === "fr" ? "French" : language}.
${context}
Choose the topic that logically belongs in this slot between those two lessons — it must not duplicate either.

Requirements:
- 10-14 vocabulary items.
- The reading passage: about ${words} words across 4-6 paragraphs.
- Exactly 5 comprehension questions, each with its own DISTINCT model answer drawn from the passage.
- 6-8 fill-in-the-blank exchanges; every blank id in "blank" must have an entry in "valid_answers_by_blank", and every valid answer must also appear in "answer_pool".
- In word_order, "correct" must contain exactly the same words as "scrambled", reordered.

Return JSON in this exact shape:
${SCHEMA_HINT}`,
    { temperature: 0.6, maxTokens: 8000 }
  );

  const slugBase = `${gap.slugPrefix}-${(data.title ?? `lesson-${gap.sequence}`)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)}`;

  const lesson: Lesson = {
    slug: slugBase,
    title: data.title ?? `Leçon ${gap.sequence}`,
    title_translation: data.title_translation,
    language,
    level: gap.level,
    topic_tags: [gap.category],
    objectives: data.objectives ?? [],
    learning_tips: data.learning_tips,
    sections: (data.sections ?? []).map((s, i) => ({ ...s, number: i + 1 })),
  };

  const defects = validateLesson(lesson);

  // A generated lesson with structural errors is not worth storing — it would
  // just become someone's cleanup job. Report and move on.
  if (defects.some((d) => d.severity === "error")) {
    return { slug: slugBase, lessonId: null, defects, costUsd, created: false };
  }

  const { data: inserted, error } = await supa
    .from("tutor_lessons")
    .insert({
      slug: slugBase,
      title: lesson.title,
      language,
      level: gap.level,
      topic_tags: [gap.category],
      status: "review", // deliberate: net-new content is never auto-published
      content: lesson,
      conversion_notes: `Generated by the lesson worker (run ${ctx.runId}) to fill the ${gap.slugPrefix} gap.`,
      ai_pass_hash: contentHash(lesson),
      ai_pass_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);

  return { slug: slugBase, lessonId: inserted?.id ?? null, defects, costUsd, created: true };
}
