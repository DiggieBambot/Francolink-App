// Stage 0: free, deterministic normalisation.
//
// Two converter generations left the catalogue with two vocabulary shapes. The
// v2 renderer (components/lesson-v2/sections/vocabulary.tsx) reads only
// `translation` / `example` / `example_translation`, so the ~2.6k items that
// carry the older `definition` / `example_sentence` keys currently render with
// no gloss at all.
//
// That is a real defect, but the text already exists — it is one field across,
// not a missing translation. Renaming it here costs nothing and keeps the AI
// stages from being handed thousands of "missing translation" defects they
// would happily (and expensively) regenerate from scratch.

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Lesson } from "../types";

export interface NormalizeResult {
  lesson: Lesson;
  /** Per-alias counts, for the run log. */
  changes: Record<string, number>;
  changed: boolean;
}

const VOCAB_KINDS = new Set(["warmup_vocabulary", "vocabulary_with_examples"]);

/** Legacy key → the key the renderer actually reads. */
const ALIASES: [from: string, to: string][] = [
  ["definition", "translation"],
  ["example_sentence", "example"],
  ["exampleSentence", "example"],
  ["meaning", "translation"],
  ["word", "term"],
];

export function normalizeLesson(lesson: Lesson): NormalizeResult {
  const changes: Record<string, number> = {};
  const sections = (lesson.sections ?? []).map((sec: any) => {
    if (!VOCAB_KINDS.has(sec?.kind) || !Array.isArray(sec.items)) return sec;

    let touched = false;
    const items = sec.items.map((item: any) => {
      if (!item || typeof item !== "object") return item;
      let next = item;

      for (const [from, to] of ALIASES) {
        const value = next[from];
        // Only fill an empty target — never overwrite a real translation with
        // a stale legacy definition.
        if (typeof value === "string" && value.trim() && !next[to]?.toString().trim()) {
          next = { ...next, [to]: value };
          changes[`${from}→${to}`] = (changes[`${from}→${to}`] ?? 0) + 1;
          touched = true;
        }
      }
      return next;
    });

    return touched ? { ...sec, items } : sec;
  });

  const changed = Object.keys(changes).length > 0;
  return { lesson: changed ? { ...lesson, sections } : lesson, changes, changed };
}
