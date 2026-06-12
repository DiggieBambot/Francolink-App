// src/lib/utils/language.ts
// Shared language code ↔ slug mapping used across the app.
// DB stores short codes ("en"), routes use slugs ("english").

const CODE_TO_SLUG: Record<string, string> = {
  fr: "french",
  es: "spanish",
  en: "english",
  de: "german",
};

const SLUG_TO_CODE: Record<string, string> = {
  french: "fr",
  spanish: "es",
  english: "en",
  german: "de",
};

/**
 * Convert a language short code ("en") to a URL slug ("english").
 * If already a slug, returns as-is.
 */
export function langSlug(codeOrSlug: string): string {
  return CODE_TO_SLUG[codeOrSlug] || codeOrSlug;
}

/**
 * Convert a URL slug ("english") to a short code ("en").
 * If already a code, returns as-is.
 */
export function langCode(slugOrCode: string): string {
  return SLUG_TO_CODE[slugOrCode] || slugOrCode;
}

/** Language display info */
export const LANGUAGE_INFO: Record<string, { name: string; flag: string }> = {
  fr: { name: "French", flag: "🇫🇷" },
  es: { name: "Spanish", flag: "🇪🇸" },
  en: { name: "English", flag: "🇬🇧" },
  de: { name: "German", flag: "🇩🇪" },
  french: { name: "French", flag: "🇫🇷" },
  spanish: { name: "Spanish", flag: "🇪🇸" },
  english: { name: "English", flag: "🇬🇧" },
  german: { name: "German", flag: "🇩🇪" },
};
