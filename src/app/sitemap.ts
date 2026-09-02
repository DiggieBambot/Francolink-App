// src/app/sitemap.ts
//
// Generated /sitemap.xml. Lists the public marketing pages plus every
// published lesson and the categories that actually contain content (empty
// category pages are intentionally excluded to avoid thin-content URLs).
//
// The home page carries hreflang alternates for the configured locales
// (en default, /fr, /ar). Other marketing pages are single-locale (they skip
// next-intl in middleware), so they get no alternates.
//
// <lastmod> is only emitted where a real modification time exists. It used to
// be `new Date()` on every URL, so every page claimed to have changed on every
// fetch — a signal search engines learn to distrust and then ignore, which is
// worse than omitting it. Lessons carry their DB `updated_at`; the static
// marketing pages carry nothing.

import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getPublishedLessons } from "@/lib/lessons/public-queries";
import { getPublicTutorSlugs } from "@/lib/site/queries";
import { APP_URL, SITE_URL, isMarketingHost } from "@/lib/site/hosts";

const BASE = APP_URL;

/**
 * francolink.net gets its own sitemap: the marketing pages and every live
 * tutor profile. The app's catalogue sitemap below is for app.francolink.net.
 */
async function marketingSitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/tutors`, changeFrequency: "weekly", priority: 0.9 },
    // The $27 workbook — a paid product page, and previously absent from this
    // list entirely, so it relied on internal links alone to get discovered.
    { url: `${SITE_URL}/francais-pas-a-pas`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/teach`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/how-it-works`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/testimonials`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    for (const slug of await getPublicTutorSlugs()) {
      entries.push({
        url: `${SITE_URL}/tutors/${slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // A directory read failure shouldn't take the whole sitemap down.
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isMarketingHost((await headers()).get("host"))) {
    return marketingSitemap();
  }

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/`,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: `${BASE}/`,
          fr: `${BASE}/fr`,
          ar: `${BASE}/ar`,
        },
      },
    },
    // NOTE: /pricing, /how-it-works, /privacy and /terms exist on BOTH hosts
    // with diverging copy, and used to be submitted in both sitemaps — leaving
    // Google to decide which host owned each topic. The marketing site is the
    // canonical home for all four (see the cross-host canonicals on the app
    // pages), so they are deliberately absent here. The app keeps serving them;
    // it just stops competing with francolink.net for the same query.
    { url: `${BASE}/get-started`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/pricing/tutors`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/library`, changeFrequency: "weekly", priority: 0.7 },
  ];

  // Published lessons + the categories that contain them.
  try {
    const lessons = await getPublishedLessons();
    const categories = new Set<string>();

    for (const lesson of lessons) {
      // Quality gate (scripts/lint-lessons.mjs): lessons carrying template
      // artefacts — stub objectives, filler vocabulary shared with unrelated
      // lessons — stay out of the index. They remain fully available in the
      // app; this only decides what we ask Google to crawl.
      if (!lesson.seo_indexable) continue;

      if (lesson.category) categories.add(lesson.category);
      entries.push({
        url: `${BASE}/library/lesson/${lesson.slug}`,
        // Real edit time from the DB — omitted rather than faked when absent.
        lastModified: lesson.updated_at ? new Date(lesson.updated_at) : undefined,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    for (const category of categories) {
      entries.push({
        url: `${BASE}/library/${category}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (e) {
    // Never let a DB hiccup 500 the sitemap — serve the static pages at least.
    console.error("[sitemap] lesson fetch failed:", (e as Error).message);
  }

  return entries;
}
