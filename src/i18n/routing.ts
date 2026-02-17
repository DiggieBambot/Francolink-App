// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'fr', 'ar'],
  defaultLocale: 'en',
  localeDetection: true,  // auto-detect from browser
  localePrefix: 'as-needed' // only show /fr/ or /ar/ — not /en/
});