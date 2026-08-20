// Busting the public website's ISR cache when a listing changes.
//
// The marketing pages are cached for an hour, and nothing used to invalidate
// them: approving a tutor left francolink.net serving the cached 404 from
// before the approval, which reads exactly like the approval didn't work.
//
// The paths below are the *rewritten* ones. Middleware serves francolink.net
// from src/app/site/**, so the cache is keyed on /site/tutors/<slug>, not the
// clean URL a visitor sees.

import { revalidatePath } from "next/cache";
import { SITE_PREFIX } from "./hosts";

/** Refresh the pages a single tutor's listing appears on. */
export function revalidateTutorPages(slug?: string | null) {
  revalidatePath(SITE_PREFIX); // home page — features tutors
  revalidatePath(`${SITE_PREFIX}/tutors`); // the directory
  if (slug) revalidatePath(`${SITE_PREFIX}/tutors/${slug}`);
}
