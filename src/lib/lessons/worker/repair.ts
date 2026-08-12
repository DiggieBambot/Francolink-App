// Stage 3 of the lesson worker: section-scoped repair.
//
// The single most important rule here is that the model only ever sees and
// rewrites ONE section, and never sees the hydrated fields (image_url, and any
// text the TTS cache is keyed on). Whole-lesson rewrites are how a catalogue
// silently loses its curated images and its warmed audio.

// `any` is deliberate: this file walks arbitrary jsonb section shapes and
// model output that has not been validated yet.
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Lesson, Section } from "../types";
import { askJson } from "./ai";
import { validateSection, type Defect } from "./validate";

/** Fields populated by other pipelines (Pexels hydrator, TTS prewarm). Stripped
 *  before the model sees a section, restored after it comes back. */
const HYDRATED_KEYS = ["image_url", "context_image_url", "tts_text"] as const;

function stripHydrated(value: any): any {
  if (Array.isArray(value)) return value.map(stripHydrated);
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if ((HYDRATED_KEYS as readonly string[]).includes(k)) continue;
      out[k] = stripHydrated(v);
    }
    return out;
  }
  return value;
}

/** Restore hydrated fields from the original section onto the repaired one.
 *  Vocabulary items are matched by term (order may change); everything else is
 *  matched positionally, which is correct because a repair keeps list shape. */
function restoreHydrated(original: any, repaired: any): any {
  if (!original || !repaired || typeof repaired !== "object") return repaired;

  if (Array.isArray(original) && Array.isArray(repaired)) {
    // Match by `term` where both sides have one — that's the vocab case, and
    // it's the only list whose order the model is likely to change.
    const byTerm = new Map<string, any>();
    for (const o of original) if (o?.term) byTerm.set(String(o.term).toLowerCase(), o);

    return repaired.map((r: any, i: number) => {
      const match = (r?.term && byTerm.get(String(r.term).toLowerCase())) || original[i];
      return restoreHydrated(match, r);
    });
  }

  const out = { ...repaired };
  for (const k of HYDRATED_KEYS) {
    if (original[k] !== undefined && out[k] === undefined) out[k] = original[k];
  }
  for (const [k, v] of Object.entries(out)) {
    if (v && typeof v === "object" && original[k]) out[k] = restoreHydrated(original[k], v);
  }
  return out;
}

// The invariants each section kind must satisfy to actually work in the
// renderer. Without these the model fixes the literal defect and nothing else —
// e.g. it rewrites "___" as "(1)" and leaves the answer pool empty, producing a
// section that still cannot be completed. Stating the contract is what makes a
// repair land in one pass instead of being rejected by the re-validation gate.
const REQUIREMENTS: Record<string, string> = {
  fill_in_blank_dialogue: `- Every blank is an inline marker "(N)" in the line's "text", numbered from 1, in reading order. Never use "___".
- The exchange holding blank N must also set "blank": N (or [N, M] for several).
- "valid_answers_by_blank" MUST have an entry for EVERY blank number, each a non-empty array of acceptable answers. Its keys are the bare number as a string — "1", "2" — NOT "(1)".
- "answer_pool" MUST contain every acceptable answer, plus 2-3 plausible distractors. A blank whose answer is missing from the pool is unanswerable.
- No two blanks may accept the same single answer — that makes the drill ambiguous.
- A blank must have a determinate answer recoverable from the dialogue. If a line is open-ended ("I believe that ___"), rewrite the line so the blank tests something specific.`,
  fill_in_blank_dialogue_extended: `- Same rules as fill_in_blank_dialogue: inline "(N)" markers, a valid_answers_by_blank entry per blank, and every answer present in answer_pool.`,
  word_order: `- "correct" must contain EXACTLY the same words as "scrambled", only reordered. Do not add, drop or reword.`,
  reading_comprehension: `- Every question needs its own DISTINCT model answer, and each answer must be findable in the passage.`,
  warmup_vocabulary: `- Every item needs "translation" (English) and "pronunciation" (IPA). Use "translation", never "definition".
- "image_query" is a concrete English scene for a stock-photo search, not the word itself.`,
  vocabulary_with_examples: `- Every item needs "translation" (English), "pronunciation" (IPA), "example" and "example_translation". Use "translation"/"example", never "definition"/"example_sentence".`,
  matching_qa: `- Each answer must match exactly one question. Duplicate answers make the exercise ambiguous.`,
  grammar_explainer: `- Every table row must have exactly as many cells as the table has headers.`,
};

/** Deterministic cleanup of the shape details models get wrong even when told.
 *  Cheaper and more reliable than another round-trip: the renderer looks up
 *  valid_answers_by_blank[String(n)], so a key of "(1)" or " 1 " silently
 *  breaks the exercise even though the content is correct. */
function coerceShape(sec: any): any {
  if (!sec || typeof sec !== "object") return sec;

  if (sec.valid_answers_by_blank && typeof sec.valid_answers_by_blank === "object") {
    const fixed: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(sec.valid_answers_by_blank)) {
      // "(1)" / "1." / " 1 " → "1"
      const digits = String(k).match(/\d+/)?.[0];
      if (!digits) continue;
      const answers = Array.isArray(v) ? v.filter((a) => typeof a === "string" && a.trim()) : [];
      if (answers.length) fixed[digits] = answers;
    }
    sec = { ...sec, valid_answers_by_blank: fixed };

    // Every accepted answer must be selectable from the pool, or the blank is
    // unanswerable. Adding a missing one back is unambiguous, so do it here
    // rather than spending another call on it.
    const pool: string[] = Array.isArray(sec.answer_pool) ? [...sec.answer_pool] : [];
    const have = new Set(pool.map((a) => String(a).trim().toLowerCase()));
    for (const answers of Object.values(fixed)) {
      for (const a of answers) {
        if (!have.has(a.trim().toLowerCase())) {
          pool.push(a);
          have.add(a.trim().toLowerCase());
        }
      }
    }
    sec = { ...sec, answer_pool: pool };
  }

  return sec;
}

const SYSTEM = `You are a meticulous CEFR language-curriculum editor.
You repair ONE section of a lesson at a time.
Rules you must never break:
- Output ONLY valid JSON: an object with a single key "section".
- The repaired section MUST keep the same "kind" and "number" as the input.
- Keep every key the input section had. Do not invent new keys.
- Fix exactly the listed defects. Do not rewrite content that is already correct.
- The target language content must be natural, idiomatic and factually accurate.
- Translations are into English.`;

export interface RepairOutcome {
  section: Section;
  costUsd: number;
  /** Defects still present after the repair, per a fresh validation pass. */
  remaining: Defect[];
}

/** Repair one section against its defect list. Returns the merged section — the
 *  caller decides whether the remaining-defect count is good enough to write. */
export async function repairSection(
  lesson: Pick<Lesson, "title" | "level" | "language">,
  section: Section,
  index: number,
  defects: Defect[],
  findings: { issue: string; suggestion?: string }[],
  model: string
): Promise<RepairOutcome> {
  const clean = stripHydrated(section);

  const defectList = defects.map((d) => `- [${d.code}] ${d.path}: ${d.message}`).join("\n");
  const findingList = findings.length
    ? `\n\nEditorial notes from review (apply only where they do not conflict with the defects above):\n${findings
        .map((f) => `- ${f.issue}${f.suggestion ? ` → ${f.suggestion}` : ""}`)
        .join("\n")}`
    : "";

  const kind = (section as any).kind;
  const requirements = REQUIREMENTS[kind]
    ? `\n\nThis section is a "${kind}". It MUST satisfy all of the following once repaired, whether or not each one is listed as a defect:\n${REQUIREMENTS[kind]}`
    : "";

  const { data, costUsd } = await askJson<{ section: Section }>(
    model,
    SYSTEM,
    `Lesson: "${lesson.title}" (language: ${lesson.language}, CEFR level: ${lesson.level}).

Defects to fix in this section:
${defectList}${requirements}${findingList}

The section as it stands:
${JSON.stringify(clean, null, 2)}

Return { "section": <the repaired section> }.`,
    { temperature: 0.3, maxTokens: 4000 }
  );

  if (!data?.section || typeof data.section !== "object") {
    throw new Error("Repair response had no section object.");
  }

  // The model is told to preserve kind/number, but we enforce it rather than
  // trust it — a changed kind would break the renderer.
  const merged = restoreHydrated(section, {
    ...coerceShape(data.section),
    kind: (section as any).kind,
    number: (section as any).number,
  }) as Section;

  const remaining = validateSection(merged, index, lesson.level ?? "B1");
  return { section: merged, costUsd, remaining };
}
