// Title and meta description for public lesson pages.
//
// Search Console (2026-11-21) showed ~100 lesson URLs earning impressions at
// positions 1-10 and almost no clicks. The old template was the raw lesson
// title plus the brand ("Quel est ton sport préféré ? | FrancoLink"), which
// gives an English speaker learning French nothing to recognise, and a
// description that spliced French objectives into an English sentence
// ("You'll learn to vous serez capable de…", "You'll learn to vous.").
//
// Now: lead with the English name of the topic, say what language and level the
// lesson teaches, and keep each description in readable sentences.

import type { Lesson } from "./types";

const LANGUAGE_NAMES: Record<string, string> = {
  fr: "French",
  en: "English",
  es: "Spanish",
  de: "German",
};

// Cheap signal for "this string is French". Used only to decide which of
// `title` / `title_translation` is the English one: conversation lessons store
// French in `title`, grammar lessons store English in `title` and French in
// `title_translation`.
const FRENCH_MARKERS =
  /[àâçéèêëîïôûùüÿœ]|\b(le|la|les|des|du|de|un|une|est|et|au|aux|votre|vos|ton|ta|tes|quel|quelle|pour|avec|dans|sur|parlez|discutez)\b|\b[ldjnqst]['’]/gi;

function frenchScore(s: string): number {
  return (s.match(FRENCH_MARKERS) || []).length;
}

/** The English name of the lesson, when the lesson carries one. */
export function englishTitle(lesson: Pick<Lesson, "title" | "title_translation">): string | null {
  const a = lesson.title?.trim();
  const b = lesson.title_translation?.trim();
  if (!b || b.toLowerCase() === a?.toLowerCase()) return frenchScore(a) === 0 ? a : null;
  return frenchScore(b) < frenchScore(a) ? b : frenchScore(a) < frenchScore(b) ? a : null;
}

function languageName(code: string): string {
  return LANGUAGE_NAMES[code?.toLowerCase()] ?? code?.toUpperCase() ?? "";
}

/** Strip a trailing "?" or "." so a topic reads cleanly before a dash. */
function tidy(s: string): string {
  return s.replace(/\s*[?.!]+$/, "").trim();
}

export function lessonSeoTitle(lesson: Lesson): string {
  if (lesson.seo_title?.trim()) return lesson.seo_title.trim();
  const topic = tidy(englishTitle(lesson) ?? lesson.title);
  return `${topic} – ${languageName(lesson.language)} ${lesson.level} Lesson | FrancoLink`;
}

/**
 * An objective is usable when it says something: the lint has caught
 * objectives that render as a bare pronoun ("Vous", "You") or repeat.
 */
function usableObjectives(lesson: Lesson): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const o of lesson.objectives ?? []) {
    const label = tidy(o.student_label ?? "");
    const key = label.toLowerCase();
    if (label.split(/\s+/).length < 3 || seen.has(key)) continue;
    seen.add(key);
    out.push(label.charAt(0).toUpperCase() + label.slice(1));
  }
  return out;
}

function clip(s: string, max = 155): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export function lessonSeoDescription(lesson: Lesson): string {
  const lang = languageName(lesson.language);
  // Both names when the lesson has two: the French one matches French-phrase
  // searches, the English one tells a learner what the lesson is about.
  const title = tidy(lesson.title);
  const other = lesson.title_translation ? tidy(lesson.title_translation) : "";
  const name = other && other.toLowerCase() !== title.toLowerCase() ? `${title} (${other})` : title;
  const lead = `Free ${lang} ${lesson.level} lesson: ${name}.`;

  const objectives = usableObjectives(lesson);
  if (objectives.length) {
    return clip(`${lead} ${objectives.slice(0, 2).join(". ")}.`);
  }
  return clip(`${lead} Vocabulary, dialogue and exercises, free on FrancoLink.`);
}
