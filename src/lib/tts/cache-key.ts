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
  return `${folderFor(language)}/${asciiSlug(text, 60)}_${asciiSlug(voice, 20)}_${speed}-v2.mp3`;
}
