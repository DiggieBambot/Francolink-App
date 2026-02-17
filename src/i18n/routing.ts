import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation'; // Add this import

export const routing = defineRouting({
  locales: ['en', 'fr', 'ar'],
  defaultLocale: 'en',
  localeDetection: true,
  localePrefix: 'as-needed'
});

// ADD THIS LINE: This creates and exports the Link, redirect, etc.
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);