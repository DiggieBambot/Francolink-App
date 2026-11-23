// src/lib/ai/tutor-lesson.ts
//
// Lets Professor Léon teach an actual published live-class lesson, step by
// step, the way a human tutor does in the lesson room.
//
// `tutor_lessons.content` is a `Lesson` (src/lib/lessons/types.ts): ordered
// sections with a `kind` (vocabulary, fill-in-the-blank dialogue, matching,
// word order, free response, ...), real items, answer keys and tutor
// instructions. The student sees the same lesson on screen during the class,
// so section N here is step N+1 on their screen. This module turns the step
// the student is on into teaching instructions that quote the real material,
// and turns what the student did in an on-screen exercise into a short report
// Léon can react to.

import type { Lesson, Section } from "@/lib/lessons/types";

export interface TutorLessonState {
  lessonId: string;
  title: string;
  totalSections: number;
  sectionIndex: number;
  /** Prompt text describing the lesson and the current section. */
  block: string;
  /** True when `sectionIndex` is past the last section. */
  finished: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySection = Section & Record<string, any>;

const MAX_ITEMS = 14;

function clip(list: string[], max = MAX_ITEMS): string {
  const shown = list.slice(0, max);
  return shown.join("; ") + (list.length > max ? `; (+${list.length - max} more)` : "");
}

function withGloss(text: string, gloss?: string | null): string {
  return gloss ? `${text} (${gloss})` : text;
}

/** The step's title as the student sees it. */
export function sectionLabel(section: Section | undefined, index: number): string {
  if (!section) return `Step ${index + 1}`;
  return `Step ${index + 1}${section.title ? ` "${section.title}"` : ""}`;
}

/** True for a fill-in where each exchange is a whole-line blank (answer = text). */
function isBlankPerExchange(s: AnySection): boolean {
  const ex = s.exchanges;
  if (!Array.isArray(ex) || ex.length === 0) return false;
  if (!ex.every((e: { blank?: unknown }) => e.blank === true)) return false;
  if (ex.some((e: { text?: string }) => /\(\d+\)/.test(e.text || ""))) return false;
  return true;
}

/**
 * Some whole-line fill-ins hold the question in `text` and the answers only in
 * the word bank. Then `text` is no answer key, and Léon judges for himself.
 */
function poolHoldsAnswers(s: AnySection): boolean {
  const pool = ((s.answer_pool ?? []) as string[]).map(norm);
  const ex = (s.exchanges ?? []) as Array<{ text?: string }>;
  return pool.length > 0 && !ex.some((e) => pool.includes(norm(e.text)));
}

/** How to run one step, quoting its real content. */
function describeSection(s: AnySection, index: number, total: number): string {
  const head = [
    `CURRENT STEP: ${sectionLabel(s, index)} of ${total} (${s.kind}).`,
    s.student_instruction ? `On the student's screen: "${s.student_instruction}"` : "",
    s.tutor_instruction ? `Teacher's note: ${s.tutor_instruction}` : "",
  ];
  const how: string[] = [];

  switch (s.kind) {
    case "warmup_vocabulary":
    case "vocabulary_with_examples": {
      const items = (s.items ?? []) as Array<{ term: string; translation?: string; example?: string }>;
      how.push(
        `The words, shown on screen with pictures: ${clip(items.map((i) => withGloss(i.term, i.translation)))}.`,
        `Teach them a few at a time: say a word, have the student repeat it, check pronunciation, then ask a quick question that makes them use it${
          items.some((i) => i.example) ? " (the example sentences on screen are good models)" : ""
        }. Finish with a mini quiz (you say the meaning, they say the word).`
      );
      break;
    }
    case "fill_in_blank_dialogue":
    case "fill_in_blank_dialogue_extended": {
      const ex = (s.exchanges ?? []) as Array<{ speaker?: string; text?: string; translation?: string }>;
      if (isBlankPerExchange(s) && poolHoldsAnswers(s)) {
        how.push(
          `Questions on screen, each to be answered by dragging an answer from the word bank: ${clip(
            ex.map((e, i) => `${i + 1}. ${e.text ?? ""}`)
          )}. Decide yourself which answer fits each question.`
        );
      } else if (isBlankPerExchange(s)) {
        how.push(
          `Questions on screen, each answered by dragging the right answer into it: ${clip(
            ex.map((e, i) => `${i + 1}. ${e.speaker ?? ""} → answer "${e.text}"`)
          )}.`
        );
      } else {
        const key = s.valid_answers_by_blank as Record<string, string[]> | undefined;
        how.push(
          `Dialogue on screen with numbered blanks: ${clip(ex.map((e) => `${e.speaker ?? ""}: ${e.text ?? ""}`))}.`,
          key ? `Answer key: ${clip(Object.entries(key).map(([n, v]) => `(${n}) ${v.join(" / ")}`))}.` : ""
        );
      }
      if (s.answer_pool?.length) how.push(`Word bank on screen: ${clip((s.answer_pool as string[]).map((w) => `"${w}"`))}.`);
      how.push(
        `The student can fill the blanks on screen or say the answers. Go through it line by line: ask for the next blank, confirm or correct, and have them say the full line aloud. Never read the answers out before they try.`
      );
      break;
    }
    case "dialogue_read_aloud": {
      const lines = (s.lines ?? []) as Array<{ speaker?: string; role?: string; text: string }>;
      how.push(
        s.context ? `Situation: ${s.context}` : "",
        `Dialogue on screen: ${clip(lines.map((l) => `${l.speaker ?? l.role ?? ""}: ${l.text}`), 16)}.`,
        `Read it as a role-play: you take the ${s.tutor_role ?? "tutor"} lines, the student reads the ${s.student_role ?? "student"} lines aloud, one line each turn. Correct pronunciation, then swap roles or ask one question about it.`
      );
      break;
    }
    case "reading_comprehension": {
      const qs = (s.questions ?? []) as Array<{ question: string; answer?: string }>;
      how.push(
        `Text on screen: "${String(s.passage ?? "").slice(0, 900)}"`,
        qs.length
          ? `Questions (answers for you only): ${clip(qs.map((q) => `${q.question}${q.answer ? ` → ${q.answer}` : ""}`))}.`
          : "",
        `Ask the student to read it (aloud if short), check they understood the hard words, then ask the questions one at a time.`
      );
      break;
    }
    case "matching_qa": {
      const pairs = (s.pairs ?? []) as Array<{ question: string; answer: string }>;
      how.push(
        `Matching exercise on screen (questions and a shuffled list of answers): ${clip(pairs.map((p) => `${p.question} → ${p.answer}`))}.`,
        `Ask each question in turn; the student answers aloud (or matches it on screen). Then have them ask you one of the questions.`
      );
      break;
    }
    case "word_order": {
      const items = (s.items ?? []) as Array<{ scrambled: string; correct?: string }>;
      how.push(
        `Word-order puzzles on screen (scrambled → correct): ${clip(items.map((i) => `"${i.scrambled}" → "${i.correct ?? "?"}"`))}.`,
        `The student builds each sentence on screen or says it. Take them one at a time; when they get it, have them say it aloud and use it in a sentence of their own.`
      );
      break;
    }
    case "image_question_prompts": {
      const prompts = (s.prompts ?? []) as Array<{ question: string; image_hint?: string }>;
      how.push(
        `Pictures on screen with questions: ${clip(prompts.map((p) => `${p.question}${p.image_hint ? ` [picture: ${p.image_hint}]` : ""}`))}.`,
        `Ask about one picture at a time and push for full sentences.`
      );
      break;
    }
    case "grammar_explainer": {
      how.push(
        `Grammar point on screen: ${String(s.explanation ?? "").slice(0, 700)}`,
        Array.isArray(s.examples) && s.examples.length
          ? `Examples: ${clip((s.examples as Array<{ text: string }>).map((e) => e.text), 6)}.`
          : "",
        Array.isArray(s.common_mistakes) && s.common_mistakes.length
          ? `Common mistakes: ${clip((s.common_mistakes as Array<{ wrong: string; right: string }>).map((m) => `${m.wrong} → ${m.right}`), 6)}.`
          : "",
        `Explain it in one or two simple sentences (point them to the table on screen), then drill it with quick sentences they have to transform or complete.`
      );
      break;
    }
    default: {
      // free_response, discussion, writing, and the rarer activity kinds.
      const qs = (s.questions ?? []) as string[];
      how.push(
        qs.length ? `Questions on screen: ${clip(qs)}.` : "",
        s.example_answer ? `Model answer on screen: "${s.example_answer}"` : "",
        `Ask the questions one at a time and have a real conversation about each: follow up on what they say, push for full sentences, and recast their mistakes.`
      );
    }
  }

  return [...head, ...how].filter(Boolean).join("\n");
}

/**
 * Build the lesson-mode prompt block for the section the student is on.
 *
 * Returns null when the lesson has no usable structured content, so the caller
 * can fall back to open conversation rather than fail.
 */
export function buildLessonState(
  lessonId: string,
  content: Lesson | null,
  sectionIndex: number
): TutorLessonState | null {
  const sections = (content?.sections ?? []) as AnySection[];
  if (!content || sections.length === 0) return null;

  const title = content.title || "this lesson";
  const total = sections.length;
  const index = Math.max(0, sectionIndex);
  const finished = index >= total;

  const outline = sections
    .map((s, i) => `${i + 1}. ${s.title || s.kind}${i < index ? " (done)" : i === index ? " (now)" : ""}`)
    .join(" · ");

  const header = [
    `You are teaching a lesson from FrancoLink's live-class programme: "${title}"${content.title_translation ? ` (${content.title_translation})` : ""}, level ${content.level}.`,
    `The student sees this lesson on their screen, one step at a time, exactly like in a class with a human tutor. Refer to it naturally ("look at step 2", "the first picture", "the word bank"). Steps: ${outline}.`,
    content.objectives?.length
      ? `Objectives: ${content.objectives.map((o) => o.student_label).filter(Boolean).join("; ")}`
      : "",
    content.tutor_overview?.common_mistakes?.length
      ? `Watch for these common mistakes: ${content.tutor_overview.common_mistakes.join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const body = finished
    ? `The student has finished every step. Wrap up: recap what they practised, praise something specific they did well, and name one thing to work on next.`
    : [
        describeSection(sections[index], index, total),
        "",
        `Stay on this step until the student has genuinely practised it, one small exchange at a time. When they have, say so briefly, set "sectionComplete" to true in the JSON, and in the same reply introduce the next step${
          index + 1 < total ? ` (${sectionLabel(sections[index + 1], index + 1)})` : " (the wrap-up)"
        } in one sentence. Until then keep "sectionComplete" false.`,
      ].join("\n");

  return {
    lessonId,
    title,
    totalSections: total,
    sectionIndex: index,
    block: `${header}\n\n${body}`,
    finished,
  };
}

function norm(s: unknown): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[‘’ʼʻ]/g, "'")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * What the student did in the on-screen exercises of one step, for Léon.
 * `answers` maps exercise anchors (as reported by the lesson components, e.g.
 * "s2/fill_in_blank", "s3/i0/word_order") to their state. Returns "" when
 * there is nothing to report.
 */
export function describeWork(
  content: Lesson | null,
  sectionIndex: number,
  answers: Record<string, unknown>
): string {
  const s = content?.sections?.[sectionIndex] as AnySection | undefined;
  if (!s || !answers || typeof answers !== "object") return "";
  const prefix = `s${sectionIndex}/`;
  const lines: string[] = [];

  for (const [anchor, raw] of Object.entries(answers)) {
    if (!anchor.startsWith(prefix) || raw == null) continue;

    if (anchor.endsWith("/fill_in_blank")) {
      const state = raw as Record<string, string | undefined>;
      if (isBlankPerExchange(s)) {
        const ex = (s.exchanges ?? []) as Array<{ speaker?: string; text?: string }>;
        const judgeYourself = poolHoldsAnswers(s);
        ex.forEach((e, i) => {
          const a = state[i];
          if (!a) return;
          if (judgeYourself) {
            lines.push(`"${e.text}" → "${a}" (judge it yourself)`);
            return;
          }
          const ok = norm(a) === norm(e.text);
          lines.push(`"${e.speaker ?? `question ${i + 1}`}" → "${a}" ${ok ? "(right)" : `(wrong, should be "${e.text}")`}`);
        });
      } else {
        const key = (s.valid_answers_by_blank ?? {}) as Record<string, string[]>;
        for (const [n, a] of Object.entries(state)) {
          if (!a) continue;
          const valid = key[n] ?? [];
          const ok = valid.some((v) => norm(v) === norm(a));
          lines.push(`blank (${n}) → "${a}" ${ok ? "(right)" : valid.length ? `(wrong, should be "${valid[0]}")` : ""}`.trim());
        }
      }
    } else if (anchor.endsWith("/matching_qa")) {
      const assigned = ((raw as { assigned?: (number | null)[] }).assigned ?? []) as (number | null)[];
      const pairs = (s.pairs ?? []) as Array<{ question: string; answer: string }>;
      assigned.forEach((id, qi) => {
        if (id == null || !pairs[qi] || !pairs[id]) return;
        const ok = norm(pairs[id].answer) === norm(pairs[qi].answer);
        lines.push(`"${pairs[qi].question}" matched with "${pairs[id].answer}" ${ok ? "(right)" : `(wrong, should be "${pairs[qi].answer}")`}`);
      });
    } else if (anchor.endsWith("/word_order")) {
      const m = anchor.match(/\/i(\d+)\/word_order$/);
      const item = m ? (s.items ?? [])[Number(m[1])] as { scrambled: string; correct?: string } | undefined : undefined;
      const built = ((raw as { built?: Array<{ text: string }> }).built ?? []).map((t) => t.text).join(" ");
      if (!item || !built) continue;
      const complete = built.split(/\s+/).length >= item.scrambled.split(/\s+/).filter(Boolean).length;
      const ok = !!item.correct && norm(built) === norm(item.correct);
      lines.push(
        `built "${built}"${complete ? (ok ? " (right)" : item.correct ? ` (wrong, should be "${item.correct}")` : "") : " (not finished)"}`
      );
    }
  }

  if (!lines.length) return "";
  return `On screen, in ${sectionLabel(s, sectionIndex)}, the student answered: ${lines.slice(0, 16).join("; ")}.`;
}
