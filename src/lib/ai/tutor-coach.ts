// src/lib/ai/tutor-coach.ts
//
// Small, deterministic guards and settings around Professor Léon's replies.
// The model is told all of this in the prompt, but a cheap model does not
// always listen, so the parts that matter most to how a class feels are also
// enforced in code:
//   - a student asking for help in English is never "corrected" for it
//   - correction tags are always one clean label
//   - the student's chosen amount of English and correction style
//   - what Léon writes on the board

export const CORRECTION_TAGS = ["gender", "agreement", "tense", "vocabulary", "spelling", "word_order", "other"] as const;
export type CorrectionTag = (typeof CORRECTION_TAGS)[number];

/** "VOCABULARY|SPELLING|WORD ORDER" → "vocabulary". */
export function normalizeTag(tag: unknown): CorrectionTag {
  const parts = String(tag ?? "")
    .toLowerCase()
    .split(/[|,/]/)
    .map((p) => p.trim().replace(/\s+/g, "_"));
  for (const p of parts) {
    if ((CORRECTION_TAGS as readonly string[]).includes(p)) return p as CorrectionTag;
  }
  return "other";
}

const ENGLISH_WORDS = new Set(
  "i you he she we they it me my your the a an is are am was were be been do does did don't can can't could would should will what how why when where which who sorry please help mean means understand don't know speak english say this that these those and or but with for to of in on at about just bit little again slowly repeat explain".split(
    " "
  )
);

/**
 * True when a phrase is mostly English. Used only when the language being
 * learned is not English.
 */
export function looksEnglish(text: string): boolean {
  const words = text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .split(/[^a-z']+/)
    .filter(Boolean);
  if (words.length < 2) return false;
  const hits = words.filter((w) => ENGLISH_WORDS.has(w)).length;
  return hits / words.length >= 0.4;
}

export interface CorrectionLike {
  original: string;
  corrected: string;
  explanation?: string;
  tag?: string;
}

/**
 * Keep only corrections of the student's own attempts at the target language:
 * they must quote the student, must not be an English request for help turned
 * into "use Spanish instead", and must actually change something.
 */
export function filterCorrections<T extends CorrectionLike>(
  corrections: T[],
  studentText: string,
  targetLang: string,
  normalize: (s: string) => string
): (T & { tag: CorrectionTag })[] {
  const said = normalize(studentText);
  const strip = (s: string) => normalize(s).replace(/[¿?¡!.,;:'"«»]/g, "").trim();
  return corrections
    .filter((c) => said.includes(normalize(c.original)))
    .filter((c) => targetLang === "English" || !looksEnglish(c.original))
    .filter((c) => !/\b(use|say it in|answer in|write in) (spanish|french|german|english)\b/i.test(c.explanation ?? ""))
    // Capital letters alone are not worth a correction in a spoken class.
    .filter((c) => strip(c.original) !== strip(c.corrected) || /[¿¡]/.test(c.corrected) !== /[¿¡]/.test(c.original))
    .map((c) => ({ ...c, tag: normalizeTag(c.tag) }));
}

/** How much English Léon mixes in. */
export type SupportLevel = "more_english" | "balanced" | "immersion";
/** How much Léon corrects. */
export type CorrectionStyle = "all" | "major" | "fluency";

export function parseSupport(v: unknown): SupportLevel {
  return v === "more_english" || v === "immersion" ? v : "balanced";
}
export function parseCorrectionStyle(v: unknown): CorrectionStyle {
  return v === "major" || v === "fluency" ? v : "all";
}

/** Prompt lines for the student's chosen settings. */
export function prefsBlock(support: SupportLevel, style: CorrectionStyle, targetLang: string, studentLang: string): string {
  const supportLine =
    support === "more_english"
      ? `The student asked for MORE ${studentLang}: after every ${targetLang} sentence that might be hard, add a short ${studentLang} gloss, and explain grammar in ${studentLang}. Keep this up for the whole class.`
      : support === "immersion"
        ? `The student asked for immersion: speak only ${targetLang}; use ${studentLang} only if they are completely stuck, and then just one short phrase.`
        : `Speak mainly ${targetLang}. Explain grammar in ${studentLang} at A1–A2, in simple ${targetLang} from B1. If the student asks for ${studentLang} or seems lost, add short ${studentLang} glosses for the REST of the class, not just one turn.`;
  const styleLine =
    style === "fluency"
      ? `Correction style: fluency. Do not correct in your spoken reply at all unless the meaning is unclear; just keep the conversation flowing. Still list real mistakes in the JSON.`
      : style === "major"
        ? `Correction style: big mistakes only. Recast only errors that change the meaning or that a native speaker would really notice; ignore small slips like a missing accent. List only those in the JSON.`
        : `Correction style: everything. Recast mistakes, including accents and question marks, but still only one per reply in speech; list all real ones in the JSON.`;
  return `${supportLine}\n${styleLine}`;
}

/** A note Léon writes on the class board: a title and a few short lines. */
export interface BoardNote {
  title: string;
  lines: string[];
}

export function parseBoardNote(v: unknown): BoardNote | null {
  if (!v || typeof v !== "object") return null;
  const o = v as { title?: unknown; lines?: unknown };
  const title = typeof o.title === "string" ? o.title.trim().slice(0, 60) : "";
  const lines = Array.isArray(o.lines)
    ? o.lines
        .filter((l): l is string => typeof l === "string" && !!l.trim())
        .map((l) => l.trim().slice(0, 90))
        .slice(0, 5)
    : [];
  return title && lines.length ? { title, lines } : null;
}

/** XP for a finished class: 5 per student turn, at most 50. */
export function classXp(studentTurns: number): number {
  return Math.min(50, Math.max(0, studentTurns) * 5);
}
