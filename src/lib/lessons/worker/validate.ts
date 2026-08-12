// Stage 1 of the lesson worker: deterministic validation.
//
// Everything here is free and instant — no model call. It exists so the AI
// stages get a precise defect list ("section 3 blank 2 has no valid answer")
// instead of a vague "improve this lesson", and so a repaired section can be
// re-checked before it is written back.

// `any` is deliberate throughout this file: it validates jsonb that has NOT been
// proven to match the Section types yet — that's the whole job. Typing the input
// as Section would assume the very thing we're checking.
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Lesson, Section, SectionKind } from "../types";

export type Severity = "error" | "warn";

export interface Defect {
  /** Stable machine code, e.g. "blank.no_valid_answer". Used to decide what a
   *  run is allowed to auto-apply. */
  code: string;
  severity: Severity;
  /** Index into lesson.sections, or null for a lesson-level defect. */
  section_index: number | null;
  path: string;
  message: string;
}

/** Word counts a reading passage should land near, per CEFR band. Mirrors the
 *  LEVEL_SPEC in scripts/lesson-doctor.mjs so the two agree. */
const LEVEL_WORDS: Record<string, number> = {
  A1: 130, A2: 170, B1: 240, B2: 310, C1: 390, C2: 460,
};

const VOCAB_KINDS: SectionKind[] = ["warmup_vocabulary", "vocabulary_with_examples"];
const BLANK_KINDS: SectionKind[] = ["fill_in_blank_dialogue", "fill_in_blank_dialogue_extended"];

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.,!?;:'"]/g, "");
}

function words(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// ── per-kind checks ─────────────────────────────────────────────────────────

function checkVocab(sec: any, i: number, out: Defect[]): void {
  const items = Array.isArray(sec.items) ? sec.items : [];
  if (items.length === 0) {
    out.push({ code: "vocab.empty", severity: "error", section_index: i, path: `sections[${i}].items`, message: "Vocabulary section has no items." });
    return;
  }
  const seen = new Set<string>();
  items.forEach((it: any, j: number) => {
    const p = `sections[${i}].items[${j}]`;
    if (!it?.term?.trim()) {
      out.push({ code: "vocab.no_term", severity: "error", section_index: i, path: p, message: "Vocabulary item has no term." });
      return;
    }
    const key = norm(it.term);
    if (seen.has(key)) {
      out.push({ code: "vocab.duplicate_term", severity: "warn", section_index: i, path: p, message: `Duplicate term "${it.term}" within the same section.` });
    }
    seen.add(key);
    if (!it.translation?.trim()) {
      out.push({ code: "vocab.no_translation", severity: "error", section_index: i, path: p, message: `"${it.term}" has no translation.` });
    }
    if (!it.pronunciation?.trim()) {
      out.push({ code: "vocab.no_pronunciation", severity: "warn", section_index: i, path: p, message: `"${it.term}" has no pronunciation.` });
    }
    // image_query drives the Pexels hydrator; without it the card stays blank.
    if (!it.image_query?.trim() && !it.image_url?.trim()) {
      out.push({ code: "vocab.no_image_query", severity: "warn", section_index: i, path: p, message: `"${it.term}" has neither an image_query nor an image_url.` });
    }
  });
}

function checkBlanks(sec: any, i: number, out: Defect[]): void {
  const exchanges = Array.isArray(sec.exchanges) ? sec.exchanges : [];
  const pool: string[] = Array.isArray(sec.answer_pool) ? sec.answer_pool : [];
  const valid: Record<string, string[]> = sec.valid_answers_by_blank ?? {};

  // The catalogue has a second, whole-line shape the renderer handles
  // separately: every exchange is itself a blank, `text` holds the answer and
  // `speaker` holds the sentence. It has no numbered blanks and no
  // valid_answers_by_blank, so none of the checks below apply to it.
  // Mirrors isBlankPerExchange() in sections/fill-blank-dialogue.tsx.
  const blankPerExchange =
    exchanges.length > 0 &&
    exchanges.every((ex: any) => ex?.blank === true) &&
    !exchanges.some((ex: any) => /\(\d+\)/.test(String(ex?.text ?? "")));

  if (blankPerExchange) {
    exchanges.forEach((ex: any, j: number) => {
      if (!String(ex?.text ?? "").trim()) {
        out.push({ code: "blank.no_answer_text", severity: "error", section_index: i, path: `sections[${i}].exchanges[${j}]`, message: "Whole-line blank has no answer text." });
      }
    });
    return;
  }

  // Blank ids come from the "(N)" markers in the line text as well as `ex.blank`
  // — the renderer unions both, because generation populates `blank`
  // unreliably (null, or a bare `true`). Reading only `ex.blank` here would
  // report hundreds of perfectly working sections as having no blanks.
  const blankIds: number[] = [];
  exchanges.forEach((ex: any) => {
    const fromField = ex?.blank == null ? [] : Array.isArray(ex.blank) ? ex.blank : [ex.blank];
    const fromText = Array.from(String(ex?.text ?? "").matchAll(/\((\d+)\)/g), (m) => parseInt(m[1], 10));
    for (const n of [...fromField, ...fromText]) {
      if (Number.isFinite(n) && !blankIds.includes(Number(n))) blankIds.push(Number(n));
    }
  });

  if (blankIds.length === 0) {
    // Three distinct failures hide behind "no blanks", and they need different
    // repairs, so they get different codes.
    const hasAnswers = Object.keys(valid).length > 0 || pool.length > 0;
    const usesUnderscores = exchanges.some((ex: any) => /_{2,}/.test(String(ex?.text ?? "")));
    const p = `sections[${i}].exchanges`;

    if (usesUnderscores) {
      // A third marker convention the renderer does not tokenize — it only
      // understands "(N)", so these render as literal underscores with no input.
      out.push({ code: "blank.underscore_markers", severity: "error", section_index: i, path: p, message: "Blanks are written as ___ instead of numbered (N) markers, so the renderer shows no input fields." });
    } else if (hasAnswers) {
      // The answers survived but the markers never made it into the text.
      out.push({ code: "blank.markers_missing", severity: "error", section_index: i, path: p, message: "Section has an answer pool but no (N) markers in any line, so there is nothing to fill in." });
    } else {
      // Boilerplate left by a bulk generator: no pool, no answers, filler text.
      // Repairing this means writing the exercise, not patching it.
      out.push({ code: "blank.placeholder_stub", severity: "error", section_index: i, path: p, message: "Section is an empty placeholder — no blanks, no answer pool, no valid answers." });
    }
    return;
  }

  const poolSet = new Set(pool.map(norm));

  for (const id of blankIds) {
    const answers = valid[String(id)];
    const p = `sections[${i}].valid_answers_by_blank[${id}]`;
    if (!Array.isArray(answers) || answers.length === 0) {
      out.push({ code: "blank.no_valid_answer", severity: "error", section_index: i, path: p, message: `Blank ${id} has no valid answers.` });
      continue;
    }
    // Every accepted answer must be selectable from the pool, or the student
    // literally cannot enter it.
    const missing = answers.filter((a) => !poolSet.has(norm(a)));
    if (missing.length === answers.length) {
      out.push({ code: "blank.answer_not_in_pool", severity: "error", section_index: i, path: p, message: `None of blank ${id}'s answers (${answers.join(", ")}) appear in answer_pool.` });
    }
  }

  // Two blanks accepting the same single answer makes the drill ambiguous —
  // this is the defect scan-duplicate-blank-answers.mjs was written for.
  // Compares the whole accepted-answer SET, not just single answers: a repair
  // that gives every blank the same three options passes a naive check while
  // making the exercise meaningless — each blank accepts anything.
  const bySet = new Map<string, number[]>();
  for (const id of blankIds) {
    const answers = valid[String(id)] ?? [];
    if (answers.length === 0) continue;
    const k = answers.map(norm).sort().join("|");
    bySet.set(k, [...(bySet.get(k) ?? []), id]);
  }
  for (const [set, ids] of bySet) {
    if (ids.length > 1) {
      const preview = set.split("|").slice(0, 3).join(", ");
      out.push({ code: "blank.duplicate_answer", severity: "error", section_index: i, path: `sections[${i}].valid_answers_by_blank`, message: `Blanks ${ids.join(", ")} accept an identical answer set (${preview}) — each blank accepts anything, so the drill tests nothing.` });
    }
  }

  const orphans = pool.filter((a) => !Object.values(valid).flat().some((v) => norm(v) === norm(a)));
  if (orphans.length > pool.length / 2) {
    out.push({ code: "blank.pool_mostly_orphan", severity: "warn", section_index: i, path: `sections[${i}].answer_pool`, message: `${orphans.length} of ${pool.length} pool entries are not a valid answer anywhere.` });
  }
}

function checkReading(sec: any, i: number, level: string, out: Defect[]): void {
  const passage: string = sec.passage ?? "";
  const p = `sections[${i}]`;
  if (!passage.trim()) {
    out.push({ code: "reading.no_passage", severity: "error", section_index: i, path: `${p}.passage`, message: "Reading section has no passage." });
    return;
  }
  const target = LEVEL_WORDS[level] ?? LEVEL_WORDS.B1;
  const n = words(passage);
  // Generous band — we only want to catch a passage that is obviously the
  // wrong size for its level, not police prose.
  if (n < target * 0.55) {
    out.push({ code: "reading.too_short", severity: "warn", section_index: i, path: `${p}.passage`, message: `Passage is ${n} words; ${level} targets ~${target}.` });
  } else if (n > target * 1.8) {
    out.push({ code: "reading.too_long", severity: "warn", section_index: i, path: `${p}.passage`, message: `Passage is ${n} words; ${level} targets ~${target}.` });
  }

  const qs = Array.isArray(sec.questions) ? sec.questions : [];
  if (qs.length === 0) {
    out.push({ code: "reading.no_questions", severity: "error", section_index: i, path: `${p}.questions`, message: "Passage has no comprehension questions." });
  }
  qs.forEach((q: any, j: number) => {
    if (!q?.question?.trim()) {
      out.push({ code: "reading.empty_question", severity: "error", section_index: i, path: `${p}.questions[${j}]`, message: "Empty comprehension question." });
    } else if (!q.answer?.trim()) {
      out.push({ code: "reading.no_answer", severity: "error", section_index: i, path: `${p}.questions[${j}]`, message: `Question "${q.question}" has no model answer.` });
    }
  });

  // A recurring failure mode: every question gets the same model answer.
  const answers = qs.map((q: any) => norm(q?.answer ?? "")).filter(Boolean);
  if (answers.length > 1 && new Set(answers).size === 1) {
    out.push({ code: "reading.identical_answers", severity: "error", section_index: i, path: `${p}.questions`, message: "Every comprehension question has the same model answer." });
  }
}

function checkWordOrder(sec: any, i: number, out: Defect[]): void {
  const items = Array.isArray(sec.items) ? sec.items : [];
  if (items.length === 0) {
    out.push({ code: "word_order.empty", severity: "error", section_index: i, path: `sections[${i}].items`, message: "Word-order section has no items." });
  }
  items.forEach((it: any, j: number) => {
    const p = `sections[${i}].items[${j}]`;
    if (!it?.scrambled?.trim()) {
      out.push({ code: "word_order.no_scrambled", severity: "error", section_index: i, path: p, message: "Item has no scrambled sentence." });
      return;
    }
    if (!it.correct?.trim()) {
      out.push({ code: "word_order.no_correct", severity: "error", section_index: i, path: p, message: `"${it.scrambled}" has no correct ordering.` });
      return;
    }
    // The correct answer must be a permutation of the scrambled tokens,
    // otherwise the exercise is unsolvable as presented.
    const a = it.scrambled.split(/\s+/).map(norm).filter(Boolean).sort();
    const b = it.correct.split(/\s+/).map(norm).filter(Boolean).sort();
    if (a.length !== b.length || a.some((t: string, k: number) => t !== b[k])) {
      out.push({ code: "word_order.not_a_permutation", severity: "error", section_index: i, path: p, message: `"${it.correct}" is not a reordering of "${it.scrambled}".` });
    }
  });
}

function checkMatching(sec: any, i: number, out: Defect[]): void {
  const pairs = Array.isArray(sec.pairs) ? sec.pairs : [];
  if (pairs.length < 2) {
    out.push({ code: "matching.too_few", severity: "error", section_index: i, path: `sections[${i}].pairs`, message: "Matching section needs at least 2 pairs." });
  }
  const seen = new Set<string>();
  pairs.forEach((pr: any, j: number) => {
    const p = `sections[${i}].pairs[${j}]`;
    if (!pr?.question?.trim() || !pr?.answer?.trim()) {
      out.push({ code: "matching.incomplete_pair", severity: "error", section_index: i, path: p, message: "Pair is missing a question or an answer." });
      return;
    }
    // Duplicate answers make the match ambiguous.
    const k = norm(pr.answer);
    if (seen.has(k)) {
      out.push({ code: "matching.duplicate_answer", severity: "error", section_index: i, path: p, message: `Answer "${pr.answer}" is used by more than one pair.` });
    }
    seen.add(k);
  });
}

function checkGrammar(sec: any, i: number, out: Defect[]): void {
  if (!sec.explanation?.trim()) {
    out.push({ code: "grammar.no_explanation", severity: "error", section_index: i, path: `sections[${i}].explanation`, message: "Grammar section has no explanation." });
  }
  if (!Array.isArray(sec.examples) || sec.examples.length === 0) {
    out.push({ code: "grammar.no_examples", severity: "warn", section_index: i, path: `sections[${i}].examples`, message: "Grammar section has no worked examples." });
  }
  if (!Array.isArray(sec.common_mistakes) || sec.common_mistakes.length === 0) {
    out.push({ code: "grammar.no_mistakes", severity: "warn", section_index: i, path: `sections[${i}].common_mistakes`, message: "Grammar section lists no common mistakes." });
  }
  const table = sec.table;
  if (table) {
    const headers: string[] = table.headers ?? [];
    (table.rows ?? []).forEach((row: any, j: number) => {
      if ((row?.cells?.length ?? 0) !== headers.length) {
        out.push({ code: "grammar.ragged_table", severity: "error", section_index: i, path: `sections[${i}].table.rows[${j}]`, message: `Row has ${row?.cells?.length ?? 0} cells but the table has ${headers.length} headers.` });
      }
    });
  }
}

function checkDialogue(sec: any, i: number, out: Defect[]): void {
  const lines = Array.isArray(sec.lines) ? sec.lines : [];
  if (lines.length < 2) {
    out.push({ code: "dialogue.too_short", severity: "error", section_index: i, path: `sections[${i}].lines`, message: "Read-aloud dialogue needs at least 2 lines." });
  }
  lines.forEach((l: any, j: number) => {
    if (!l?.text?.trim()) {
      out.push({ code: "dialogue.empty_line", severity: "error", section_index: i, path: `sections[${i}].lines[${j}]`, message: "Dialogue line has no text." });
    }
    if (!l?.speaker?.trim()) {
      out.push({ code: "dialogue.no_speaker", severity: "warn", section_index: i, path: `sections[${i}].lines[${j}]`, message: "Dialogue line has no speaker." });
    }
  });
}

function checkFreeResponse(sec: any, i: number, out: Defect[]): void {
  const qs = Array.isArray(sec.questions) ? sec.questions : [];
  if (qs.length === 0) {
    out.push({ code: "free_response.empty", severity: "error", section_index: i, path: `sections[${i}].questions`, message: "Free-response section has no questions." });
  }
  if (qs.some((q: any) => typeof q !== "string" || !q.trim())) {
    out.push({ code: "free_response.empty_question", severity: "error", section_index: i, path: `sections[${i}].questions`, message: "One or more questions are empty." });
  }
}

function checkImagePrompts(sec: any, i: number, out: Defect[]): void {
  const prompts = Array.isArray(sec.prompts) ? sec.prompts : [];
  if (prompts.length === 0) {
    out.push({ code: "image_prompts.empty", severity: "error", section_index: i, path: `sections[${i}].prompts`, message: "Image-prompt section has no prompts." });
  }
  prompts.forEach((pr: any, j: number) => {
    if (!pr?.question?.trim()) {
      out.push({ code: "image_prompts.no_question", severity: "error", section_index: i, path: `sections[${i}].prompts[${j}]`, message: "Prompt has no question." });
    }
    if (!pr?.image_hint?.trim() && !pr?.image_url?.trim()) {
      out.push({ code: "image_prompts.no_image", severity: "warn", section_index: i, path: `sections[${i}].prompts[${j}]`, message: "Prompt has neither an image_hint nor an image_url." });
    }
  });
}

// ── entry points ────────────────────────────────────────────────────────────

/** Validate a single section in isolation. Used both by the full-lesson sweep
 *  and to re-check a section the repair stage has just rewritten. */
export function validateSection(sec: Section, index: number, level: string): Defect[] {
  const out: Defect[] = [];
  const s = sec as any;

  if (!s?.kind) {
    out.push({ code: "section.no_kind", severity: "error", section_index: index, path: `sections[${index}].kind`, message: "Section has no kind." });
    return out;
  }
  if (!s.student_instruction?.trim()) {
    out.push({ code: "section.no_student_instruction", severity: "warn", section_index: index, path: `sections[${index}]`, message: `${s.kind} has no student instruction.` });
  }
  if (!s.tutor_instruction?.trim()) {
    out.push({ code: "section.no_tutor_instruction", severity: "warn", section_index: index, path: `sections[${index}]`, message: `${s.kind} has no tutor instruction.` });
  }

  if (VOCAB_KINDS.includes(s.kind)) checkVocab(s, index, out);
  else if (BLANK_KINDS.includes(s.kind)) checkBlanks(s, index, out);
  else if (s.kind === "reading_comprehension") checkReading(s, index, level, out);
  else if (s.kind === "word_order") checkWordOrder(s, index, out);
  else if (s.kind === "matching_qa") checkMatching(s, index, out);
  else if (s.kind === "grammar_explainer") checkGrammar(s, index, out);
  else if (s.kind === "dialogue_read_aloud") checkDialogue(s, index, out);
  else if (s.kind === "free_response") checkFreeResponse(s, index, out);
  else if (s.kind === "image_question_prompts") checkImagePrompts(s, index, out);

  return out;
}

/** Full deterministic pass over a lesson. */
export function validateLesson(lesson: Lesson): Defect[] {
  const out: Defect[] = [];
  const level = lesson.level ?? "B1";

  if (!lesson.title?.trim()) {
    out.push({ code: "lesson.no_title", severity: "error", section_index: null, path: "title", message: "Lesson has no title." });
  }
  if (!Array.isArray(lesson.objectives) || lesson.objectives.length === 0) {
    out.push({ code: "lesson.no_objectives", severity: "warn", section_index: null, path: "objectives", message: "Lesson has no objectives." });
  }

  const sections = Array.isArray(lesson.sections) ? lesson.sections : [];
  if (sections.length === 0) {
    out.push({ code: "lesson.no_sections", severity: "error", section_index: null, path: "sections", message: "Lesson has no sections." });
    return out;
  }

  const kinds = new Set(sections.map((s: any) => s?.kind));
  if (![...VOCAB_KINDS].some((k) => kinds.has(k))) {
    out.push({ code: "lesson.no_vocabulary", severity: "warn", section_index: null, path: "sections", message: "Lesson has no vocabulary section." });
  }
  if (!kinds.has("reading_comprehension")) {
    out.push({ code: "lesson.no_reading", severity: "warn", section_index: null, path: "sections", message: "Lesson has no reading-comprehension section." });
  }
  if (![...BLANK_KINDS, "word_order", "matching_qa", "image_question_prompts"].some((k) => kinds.has(k as SectionKind))) {
    out.push({ code: "lesson.no_practice", severity: "warn", section_index: null, path: "sections", message: "Lesson has no practice exercise." });
  }

  sections.forEach((sec, i) => out.push(...validateSection(sec, i, level)));
  return out;
}

/** Defect codes the worker is allowed to fix without a human looking first.
 *  These are all provable from the schema — a missing translation is missing,
 *  a non-permutation is not a permutation. Subjective findings never land here. */
export const AUTO_FIXABLE = new Set<string>([
  "vocab.no_translation",
  "vocab.no_pronunciation",
  "vocab.no_image_query",
  "vocab.duplicate_term",
  "blank.no_valid_answer",
  "blank.answer_not_in_pool",
  "blank.duplicate_answer",
  "blank.underscore_markers",
  "blank.markers_missing",
  "blank.no_answer_text",
  // Deliberately NOT auto-fixable: a placeholder stub has no content to
  // preserve, so "repairing" it means inventing a whole exercise. That is
  // authoring, not repair — it belongs behind the same review gate as a
  // generated lesson. Surfaced in the UI so the scale of it is visible.
  "reading.no_questions",
  "reading.no_answer",
  "reading.empty_question",
  "reading.identical_answers",
  "reading.too_short",
  "word_order.no_correct",
  "word_order.not_a_permutation",
  "matching.duplicate_answer",
  "matching.incomplete_pair",
  "grammar.no_examples",
  "grammar.no_mistakes",
  "grammar.ragged_table",
  "dialogue.no_speaker",
  "section.no_student_instruction",
  "section.no_tutor_instruction",
  "free_response.empty_question",
  "image_prompts.no_question",
]);

export function summarize(defects: Defect[]): { errors: number; warnings: number } {
  return {
    errors: defects.filter((d) => d.severity === "error").length,
    warnings: defects.filter((d) => d.severity === "warn").length,
  };
}
