// The one definition of where a TTS clip lives.
//
// The route and the warming script both need to turn (text, voice, speed,
// language) into a storage path, and they must agree exactly. When they drifted
// before, warming silently filled the bucket with clips under keys the route
// never looked up — the cache appeared to be working while every play still
// went to the paid provider. The corpus reached 1.5% coverage that way.
//
// Import this from both. Never re-derive it.

export const TTS_BUCKET = "tts-cache";

/** Voice per language, chosen by listening to all eight OpenAI voices read the
 *  sounds that expose an anglophone accent. */
export const LANGUAGE_VOICES: Record<string, string> = {
  fr: "fable",
  en: "nova",
  es: "shimmer",
  de: "shimmer",
};

/** A requested voice must be one of these: the value reaches both a storage
 *  path and a paid API call. */
export const ALLOWED_VOICES = new Set([
  "alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer",
]);

const LANGUAGE_FOLDERS: Record<string, string> = {
  fr: "french",
  en: "english",
  es: "spanish",
  de: "german",
};

function langCode(language: string): string {
  return String(language || "fr").split("-")[0].toLowerCase();
}

export function voiceFor(language: string): string {
  return LANGUAGE_VOICES[langCode(language)] || LANGUAGE_VOICES.fr;
}

export function folderFor(language: string): string {
  const code = langCode(language);
  return LANGUAGE_FOLDERS[code] || code;
}

export function asciiSlug(s: string, maxLen: number): string {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen);
}

/** Full storage path for a clip, e.g. "french/la-natation_fable_1-v2.mp3".
 *
 *  The "-v2" marks the OpenAI generation. Clips from the previous provider sit
 *  under unsuffixed keys, are a different voice entirely, and cannot be
 *  regenerated — that account is out of credits — so they must not be served
 *  for these requests. */
export function ttsCachePath(text: string, voice: string, speed: number, language: string): string {
  return `${folderFor(language)}/${textKey(text)}_${asciiSlug(voice, 20)}_${speed}-v2.mp3`;
}

const SLUG_LEN = 60;

/** The text part of the key. The slug alone was cut at 60 characters, so two
 *  long dialogue lines that open the same way shared one clip and a learner
 *  heard the wrong sentence. A text whose slug runs past 60 now also carries a
 *  hash of the whole text; shorter texts keep the key they always had, so the
 *  clips already cached for them stay valid. */
function textKey(text: string): string {
  const full = asciiSlug(text, Infinity);
  if (full.length <= SLUG_LEN) return full;
  return `${full.slice(0, SLUG_LEN)}-${fnv1a(normalizeText(text))}`;
}

/** The pre-hash key, for moving clips cached under it. Nothing should serve it. */
export function legacyTtsCachePath(text: string, voice: string, speed: number, language: string): string {
  return `${folderFor(language)}/${asciiSlug(text, SLUG_LEN)}_${asciiSlug(voice, 20)}_${speed}-v2.mp3`;
}

/** Callers trim (or don't) differently; the clip shouldn't depend on it. */
function normalizeText(text: string): string {
  return String(text).normalize("NFC").trim().replace(/\s+/g, " ");
}

/** 32-bit FNV-1a as 8 hex characters. Plain JS rather than node:crypto so the
 *  mobile app's copy of this file computes the same key. */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
