// Server-side: fetch a Google Doc and convert to a structured Lesson via OpenAI.

import OpenAI from "openai";
import type { Lesson } from "./types";

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const VALID_KINDS = new Set([
  "warmup_vocabulary",
  "vocabulary_with_examples",
  "fill_in_blank_dialogue",
  "fill_in_blank_dialogue_extended",
  "dialogue_read_aloud",
  "reading_comprehension",
  "matching_qa",
  "word_order",
  "image_question_prompts",
  "free_response",
]);

export function extractDocId(input: string): string | null {
  if (!input) return null;
  const m = input.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) return input;
  return null;
}

export const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const ODT_MIME = "application/vnd.oasis.opendocument.text";

export function isSupportedDocMime(mime: string | undefined): boolean {
  return mime === GOOGLE_DOC_MIME || mime === DOCX_MIME;
}

// Global Drive-download throttle. Even with several concurrent import workers,
// Drive media downloads are serialized >= MIN_DRIVE_GAP_MS apart so Google's
// anonymous-API-key anti-abuse detector isn't tripped.
const MIN_DRIVE_GAP_MS = 2500;
let _driveChain: Promise<void> = Promise.resolve();
function driveGate(): Promise<void> {
  // Each call queues behind the previous one + a fixed gap, so successive
  // downloads are spaced out regardless of how many workers call at once.
  const myTurn = _driveChain.then(() => new Promise<void>((r) => setTimeout(r, MIN_DRIVE_GAP_MS)));
  _driveChain = myTurn;
  return myTurn;
}

/**
 * Fetch a document's plain text by ID. Routes by mime type:
 *  - Google Docs:   /export?format=txt
 *  - Microsoft Word (.docx): Drive API ?alt=media + mammoth
 *  - .odt: not yet supported
 */
export async function fetchDocText(docId: string, mimeType?: string): Promise<string> {
  // Default to Google Doc behavior for backward compat when mimeType is omitted.
  const mt = mimeType || GOOGLE_DOC_MIME;

  if (mt === GOOGLE_DOC_MIME) {
    const res = await fetch(`https://docs.google.com/document/d/${docId}/export?format=txt`, {
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Google Doc export failed: HTTP ${res.status}`);
    const text = await res.text();
    return text.replace(/^﻿/, "");
  }

  if (mt === DOCX_MIME) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_API_KEY (needed for .docx download)");
    const url = `https://www.googleapis.com/drive/v3/files/${docId}?alt=media&supportsAllDrives=true&key=${apiKey}`;
    // Drive's per-user-per-second quota throws transient 403/429 bursts.
    // Retry with exponential backoff before giving up.
    let buf: Buffer | null = null;
    let lastStatus = 0;
    let lastBody = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        buf = Buffer.from(await res.arrayBuffer());
        break;
      }
      lastStatus = res.status;
      lastBody = (await res.text()).slice(0, 200);
      // Only retry on quota / rate-limit / transient server errors.
      if (![403, 429, 500, 503].includes(res.status)) {
        throw new Error(`Drive download failed: HTTP ${res.status} ${lastBody}`);
      }
      // Backoff: 5s, 15s, 45s, 2min, 4min with jitter — Drive's anti-abuse
      // cooldown is typically minutes, not seconds.
      const backoff = [5000, 15000, 45000, 120000, 240000][attempt];
      await new Promise((r) => setTimeout(r, backoff + Math.random() * 1000));
    }
    if (!buf) {
      throw new Error(`Drive download failed after retries: HTTP ${lastStatus} ${lastBody}`);
    }
    const mammoth = (await import("mammoth")).default;
    const { value: text } = await mammoth.extractRawText({ buffer: buf });
    return text.replace(/\r\n/g, "\n").replace(/ /g, " ").trim();
  }

  if (mt === ODT_MIME) {
    throw new Error(
      "OpenDocument (.odt) is not supported yet. Re-save the file as Word (.docx) or Google Docs and import again."
    );
  }

  throw new Error(`Unsupported mime type: ${mt}`);
}

function prompt(doc: string): string {
  return `You are converting a French language-learning lesson from a Google Doc into structured JSON. The same template repeats across 300 lessons. Output must enable a polished Engoo-style learning UI, so include rich learner support fields (translation, IPA, part of speech, hero image, avatars).

SCHEMA (output exactly this shape, valid JSON only)
Top level: { slug, title, title_translation, language, level, duration_minutes, topic_tags[], objectives[], learning_tips[], tutor_overview{}, hero_image_hint, sections[] }

objectives: array of { student_label, skill, cefr_can_do }
learning_tips: 2-4 short, encouraging, STUDENT-facing tips for this lesson (e.g. "Try saying these words aloud while pointing at items around you.", "Notice the gender of each noun — un / une / des."). DIFFERENT from teaching_tips (which are tutor-facing). Student voice, second person, positive.
tutor_overview: { skills_covered[], estimated_minutes, teaching_tips[], common_mistakes[] }
hero_image_hint: ONE short concrete scene query (e.g. "person shopping in a clothing store") suitable for Pexels search — used as the lesson hero photo.

sections: array. EVERY section object MUST include a string property "kind" set to one of these exact values:
- kind="warmup_vocabulary": { kind, number, title, student_instruction, tutor_instruction, items: [{ term, translation, part_of_speech, pronunciation, gender?, image_query, note? }] }
- kind="vocabulary_with_examples": { kind, number, title, student_instruction, tutor_instruction, items: [{ term, translation, part_of_speech, pronunciation, gender?, image_query, example, example_translation }] }
- kind="fill_in_blank_dialogue": { kind, number, title, student_instruction, tutor_instruction, example: { tutor_line, student_line }, exchanges: [{ speaker, speaker_role, avatar_seed, text, translation, blank? }], answer_pool[], valid_answers_by_blank{} }
- kind="fill_in_blank_dialogue_extended": same as above but blank is an array of ints when one line has multiple blanks. Also has student_role, tutor_role.
- kind="dialogue_read_aloud": { kind, number, title, student_instruction, tutor_instruction, context, student_role, tutor_role, lines: [{ speaker, role, avatar_seed, text, translation }] }
- kind="reading_comprehension": { kind, number, title, student_instruction, tutor_instruction, passage, passage_translation, image_hint }
  • Use this when the doc has an ARTICLE or extended passage to be read silently or aloud (often labelled "Article", "Texte", "Lecture", "Compréhension"). The "passage" field is the full French text from the doc, verbatim, paragraphs separated by newlines. passage_translation is your English rendering. image_hint is a concrete English Pexels query that fits the article subject. Companion comprehension questions usually appear AFTER as a separate matching_qa section.
- kind="matching_qa": { kind, number, title, student_instruction, tutor_instruction, pairs: [{ question, answer, question_translation, answer_translation }] }
- kind="word_order": { kind, number, title, student_instruction, tutor_instruction, example: { scrambled, correct }, items: [{ scrambled, correct, expected_topic }] }
  WORD_ORDER REQUIREMENTS (read these carefully — the interactive builder depends on it):
    1. For each item the doc gives a hint fragment (e.g. "livre un"). You MUST produce a complete short French sentence in "correct" (e.g. "J'ai acheté un livre.").
    2. "scrambled" MUST contain the SAME tokens as "correct", just in a random order. Use every word from correct, no more, no fewer. Final punctuation (./?/!) goes attached to the last token of scrambled too.
       Example: correct="J'ai acheté un livre." → scrambled could be "livre J'ai acheté un." or "un. acheté J'ai livre" etc. All 5 tokens present.
    3. Apostrophes stay as one token: "J'ai" is ONE token, never "J'" + "ai".
    4. The example object follows the same rule: example.scrambled and example.correct use the exact same set of tokens.
    5. Aim for sentences 4–8 tokens long. Keep them grammatical and meaningful in context of the lesson.
    6. expected_topic is OPTIONAL — use it only if the target sentence differs slightly from a literal arrangement hint (kept for tutor reference).
- kind="image_question_prompts": { kind, number, title, student_instruction, tutor_instruction, example: { student_question }, prompts: [{ question, question_translation, image_hint }] }
- kind="free_response": { kind, number, title, student_instruction, tutor_instruction, example_answer, example_answer_translation, questions[], question_translations[] }

The "kind" field is REQUIRED on every section — never omit it. Map exercise types to kinds by their content shape, not the doc's heading text.

AUGMENTATION RULES (these are NOT in the doc — invent them well)
1. Every section needs a tutor_instruction (~1 short sentence).
2. tutor_overview.teaching_tips and common_mistakes: 2-4 each, specific to this lesson's content.
3. valid_answers_by_blank: for each blank, list the answer_pool items that semantically fit.
4. image_hint / hero_image_hint: concrete scene description that Pexels can find ("woman holding shopping bags", "shoes with price tag").
5. skill on objectives: one of speaking, listening, reading, writing, grammar, vocabulary.
6. cefr_can_do: a single sentence in CEFR "Can do" style.
7. slug: ascii kebab-case of title.
8. level: infer from content. BIAS UP — passé composé / multiple tenses / topical vocab → A2 or B1, never A1. A1 only for present tense + greetings/numbers/family basics.
9. topic_tags: 3-5 relevant tags.
10. speaker_role values MUST be lowercase ("tutor" / "student").
11. NUMBERING: Exercises = integer (1, 2, 3...). "Pratiquons" subsection = preceding exercise + 0.5 (1.5, 2.5...).
12. translation / title_translation / example_translation / question_translation / answer_translation: natural English, single line, no quotes. Match register (informal stays informal).
13. part_of_speech: one of "noun", "verb", "adjective", "adverb", "phrase", "expression", "preposition", "pronoun". For multi-word terms like "des chaussures" use "noun phrase".
14. gender: only set for nouns. "m" for masculine, "f" for feminine, "m/f" for ambiguous. Skip for verbs/phrases.
15. pronunciation: IPA in slashes (e.g. /ʃo.sy.ʁ/ for "chaussure"). Use spaces or dots between syllables. Best approximation — do not skip.
16. avatar_seed: for every speaker in dialogues, set this to the speaker's name (e.g. "Lingue" → avatar_seed: "Lingue"). Same speaker always gets the same seed across the lesson. This drives a deterministic cartoon avatar.
17. image_query (per vocab item): a CONCRETE, VISUAL, ENGLISH scene description that a stock-photo site (Pexels) will return a clear, on-topic photo for. NEVER just the French word, NEVER abstract ("purchase" → bad; "shopping bags at checkout counter" → good). Be specific about the visible object/action. Examples:
   - achat → "shopping bags at checkout"
   - prix → "price tag on clothing"
   - magasin → "interior of small boutique store"
   - cadeau → "wrapped gift box with ribbon"
   - essayer → "woman trying on shirt in fitting room"
   - utiliser → "person using smartphone"
   - livre → "open book on table"
   - chaussures → "pair of leather shoes on white background"
   - vêtements → "clothes hanging on store rack"
   - électronique → "modern electronics on shelf"
   Aim for 3-7 words. Concrete nouns + a setting where helpful.

WHAT'S LITERAL VS INVENTED — READ CAREFULLY
The source doc is FRENCH. The output must preserve the French verbatim. Critical rule:

NEVER translate French source content into English or paraphrase it. The English ONLY appears in fields whose name ends in "_translation" (title_translation, translation, example_translation, question_translation, answer_translation, example_answer_translation, question_translations) PLUS the learning_tips array (which is student-facing English commentary, not source content).

The following fields MUST stay in FRENCH, exactly as in the source doc:
  • title  (the lesson title from the doc — keep French; produce English alongside it as title_translation)
  • section.title  (e.g. "Vocabulaire", "Exercice 2 : Article", "Réchauffer" — keep French)
  • section.student_instruction  (e.g. "Lisez l'article et répondez aux questions" — keep French verbatim)
  • All vocab term values
  • All vocab example sentences
  • All exchange/line text fields
  • All matching question/answer text
  • All image prompt question text
  • All free_response questions and example_answer
  • All word_order scrambled and correct values
  • answer_pool entries

If you see French in the doc, that exact French belongs in the output. If you find yourself writing English in any of the above fields, STOP — you are violating the rule.

EXCEPTION for word_order ONLY: The doc's word_order fragments are seeds. Expand each into a full grammatical FRENCH sentence in "correct"; then produce "scrambled" as a shuffle of those same FRENCH tokens. Never English here either.

The augmented fields (you generate them, not the doc): tutor_instruction, tutor_overview.teaching_tips, tutor_overview.common_mistakes, valid_answers_by_blank, image_hint, hero_image_hint, image_query, expected_topic, cefr_can_do, skills_covered, estimated_minutes, learning_tips, part_of_speech, pronunciation, gender, avatar_seed. These may be in English (or IPA/etc.) as appropriate.

INPUT DOCUMENT TEXT

${doc}

OUTPUT
Return ONLY valid JSON. No markdown, no commentary. Begin with { and end with }.`;
}

let _openai: OpenAI | null = null;
function openaiClient(): OpenAI {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY in .env.local");
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}

/**
 * Convert raw lesson text → structured Lesson JSON via OpenAI.
 * Uses JSON mode (response_format json_object) so output is always valid JSON.
 * Retries transient 429/5xx briefly; on a hard quota/billing 429 throws a
 * QuotaExhaustedError so the bulk-import loop can stop cleanly.
 */
export async function geminiConvert(docText: string): Promise<Lesson> {
  const client = openaiClient();
  let lastErr = "unknown";

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
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
          { role: "user", content: prompt(docText) },
        ],
      });
      const text = completion.choices[0]?.message?.content;
      if (!text) throw new Error("OpenAI returned no content");
      return JSON.parse(text) as Lesson;
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string; code?: string };
      lastErr = e?.message || String(err);
      const status = e?.status;

      // Hard quota / billing problem → signal the import loop to stop.
      if (status === 429 && /quota|billing|insufficient/i.test(lastErr)) {
        const qe = new Error(`OpenAI quota/billing issue: ${lastErr}`);
        qe.name = "QuotaExhaustedError";
        throw qe;
      }
      // Transient network blips (no HTTP status) → retry too.
      const networkish = /connection error|fetch failed|econnreset|etimedout|timeout|socket hang up|network/i.test(
        lastErr
      );
      // Rate-limit burst, transient server error, or network blip → backoff + retry.
      if (status === 429 || status === 500 || status === 502 || status === 503 || networkish) {
        await new Promise((r) => setTimeout(r, 3000 * (attempt + 1) + Math.random() * 1000));
        continue;
      }
      // Anything else (bad request, parse error) → abort this doc.
      throw new Error(`OpenAI convert failed: ${lastErr}`);
    }
  }
  throw new Error(`OpenAI convert failed after retries: ${lastErr}`);
}

// Deterministic Fisher–Yates shuffle.
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tokensOf(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean);
}

/**
 * Post-process word_order sections so that scrambled and correct always contain
 * the same multiset of tokens. Without this guarantee the tap-to-build UI is
 * unsolvable. Strategy per item:
 *   1. If item.correct is non-empty → regenerate scrambled by shuffling correct's tokens.
 *   2. Else if item.expected_topic looks like a sentence → promote it to correct and shuffle.
 *   3. Else leave alone and let the UI surface the conversion warning.
 * Repeats for example.{scrambled, correct}.
 */
export function repairWordOrder(lesson: Lesson): void {
  for (const section of lesson.sections) {
    if (section.kind !== "word_order") continue;
    if (section.example) {
      const target = section.example.correct?.trim() || "";
      if (target) {
        section.example.correct = target;
        // Ensure scrambled differs from correct so the example shows the puzzle shape.
        let shuffled = shuffle(tokensOf(target)).join(" ");
        if (shuffled === target && tokensOf(target).length > 1) {
          // Force a swap so example isn't accidentally identical.
          const t = tokensOf(target);
          [t[0], t[t.length - 1]] = [t[t.length - 1], t[0]];
          shuffled = t.join(" ");
        }
        section.example.scrambled = shuffled;
      }
    }
    for (const item of section.items) {
      let target = item.correct?.trim() || "";
      if (!target && item.expected_topic && /\s/.test(item.expected_topic)) {
        // expected_topic often contains the full target sentence in the doc style.
        target = item.expected_topic.trim();
      }
      if (target) {
        item.correct = target;
        let shuffled = shuffle(tokensOf(target)).join(" ");
        if (shuffled === target && tokensOf(target).length > 1) {
          const t = tokensOf(target);
          [t[0], t[t.length - 1]] = [t[t.length - 1], t[0]];
          shuffled = t.join(" ");
        }
        item.scrambled = shuffled;
      }
    }
  }
}

// Quick heuristic: does this string look English (no diacritics, mostly English
// stop-words)? Used as a tripwire for French content that Gemini accidentally
// translated to English.
const FRENCH_DIACRITICS = /[àâäéèêëîïôöùûüÿçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇœŒ]/;
const ENGLISH_STOPWORDS = /\b(the|and|with|from|that|this|please|read|answer|listen|repeat|new|words|article|questions|discuss|partner|appropriate)\b/i;
const FRENCH_STOPWORDS = /\b(le|la|les|un|une|des|du|de|et|avec|dans|sur|pour|sont|était|sera|lisez|répondez|écoutez|répétez|nouveau|mots|article|questions|discutez|partenaire|approprié|votre|tutuer|formateur)\b/i;

function looksEnglish(s: string | undefined | null): boolean {
  if (!s || s.length < 12) return false;
  const eng = ENGLISH_STOPWORDS.test(s);
  const fr = FRENCH_STOPWORDS.test(s) || FRENCH_DIACRITICS.test(s);
  return eng && !fr;
}

export function validateLesson(lesson: Lesson): string[] {
  const issues: string[] = [];
  if (!lesson || typeof lesson !== "object") return ["root is not an object"];
  for (const f of ["slug", "title", "language", "level", "sections"] as const) {
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
    if (looksEnglish(s.title)) issues.push(`section[${i}] title looks English: "${s.title}"`);
    if (looksEnglish(s.student_instruction))
      issues.push(`section[${i}] student_instruction looks English`);
  });
  if (lesson.language === "fr" && looksEnglish(lesson.title)) {
    issues.push(`lesson title looks English (should be French): "${lesson.title}"`);
  }
  return issues;
}
