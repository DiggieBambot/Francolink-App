// AI homework generation. Given a library lesson (v2 JSON), produce a small set
// of homework questions that reinforce the lesson's vocabulary and objectives.
// Output is a DRAFT — a tutor edits/approves before it goes live.

import { chatCompletion } from "@/lib/ai/client";
import type { Lesson } from "@/lib/lessons/types";
import type { HomeworkQuestion } from "./types";

/** Pull a compact, token-cheap summary of the lesson for the prompt. */
function lessonDigest(lesson: Lesson): string {
  const objectives = (lesson.objectives || [])
    .map((o) => `- ${o.student_label} (${o.skill})`)
    .join("\n");

  const vocab: string[] = [];
  for (const s of lesson.sections || []) {
    const items = (s as { items?: { term: string; translation?: string }[] }).items;
    if (Array.isArray(items)) {
      for (const it of items) {
        if (it?.term) vocab.push(it.translation ? `${it.term} — ${it.translation}` : it.term);
      }
    }
  }

  return [
    `Title: ${lesson.title}`,
    `Language: ${lesson.language}   Level: ${lesson.level}`,
    objectives ? `Objectives:\n${objectives}` : "",
    vocab.length ? `Key vocabulary:\n${vocab.slice(0, 40).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export interface GeneratedHomework {
  title: string;
  instructions: string;
  questions: HomeworkQuestion[];
}

export async function generateHomeworkDraft(lesson: Lesson): Promise<GeneratedHomework> {
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
    `from THIS lesson (e.g. use a target word in a sentence, translate a key phrase, answer a question ` +
    `using lesson vocabulary). Each item: {"prompt": string in ${langName}, ` +
    `"prompt_translation": English gloss of the prompt, "hint": short optional tip, ` +
    `"type": "short" for one-line answers or "long" for a few sentences}\n\n` +
    `Return JSON: {"title": string, "instructions": string, "questions": [...] }`;

  const { content } = await chatCompletion({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.6,
    jsonMode: true,
    maxTokens: 1200,
  });

  let parsed: GeneratedHomework;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI returned invalid JSON for homework");
  }

  // Normalise / validate.
  const questions: HomeworkQuestion[] = Array.isArray(parsed.questions)
    ? parsed.questions
        .filter((q) => q && typeof q.prompt === "string" && q.prompt.trim())
        .slice(0, 5)
        .map((q) => ({
          prompt: q.prompt.trim(),
          prompt_translation: q.prompt_translation?.trim() || undefined,
          hint: q.hint?.trim() || undefined,
          type: q.type === "long" ? "long" : "short",
        }))
    : [];

  if (questions.length === 0) throw new Error("AI produced no usable homework questions");

  return {
    title: parsed.title?.trim() || "Homework",
    instructions: parsed.instructions?.trim() || "",
    questions,
  };
}
