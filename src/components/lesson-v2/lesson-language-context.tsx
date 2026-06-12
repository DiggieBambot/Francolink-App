"use client";

import { createContext, useContext } from "react";

/**
 * Provides the lesson language (e.g. "fr", "en") to all section components
 * so TTS and other language-sensitive features use the correct language.
 */
const LessonLanguageContext = createContext<string>("fr");

export function LessonLanguageProvider({
  language,
  children,
}: {
  language: string;
  children: React.ReactNode;
}) {
  return (
    <LessonLanguageContext.Provider value={language}>
      {children}
    </LessonLanguageContext.Provider>
  );
}

/** Returns the lesson language code (e.g. "fr", "en"). Falls back to "fr". */
export function useLessonLanguage(): string {
  return useContext(LessonLanguageContext);
}

/** Maps lesson language code to TTS locale. */
const TTS_LOCALE_MAP: Record<string, string> = {
  fr: "fr-FR",
  en: "en-GB",
  es: "es-ES",
  de: "de-DE",
};

/** Returns the TTS locale string (e.g. "en-GB") for the current lesson. */
export function useLessonTTSLocale(): string {
  const lang = useLessonLanguage();
  return TTS_LOCALE_MAP[lang] || TTS_LOCALE_MAP.fr;
}
