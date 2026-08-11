// src/app/sitemap.ts
//
// Generated /sitemap.xml. Lists the public marketing pages plus every
// published lesson and the categories that actually contain content (empty
// category pages are intentionally excluded to avoid thin-content URLs).
//
// The home page carries hreflang alternates for the configured locales
// (en default, /fr, /ar). Other marketing pages are single-locale (they skip
// next-intl in middleware), so they get no alternates.

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
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/tutors`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/teach`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/testimonials`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    for (const slug of await getPublicTutorSlugs()) {
      entries.push({
        url: `${SITE_URL}/tutors/${slug}`,
        lastModified: now,
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

  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/`,
      lastModified: now,
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
    { url: `${BASE}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/get-started`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/pricing/tutors`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/library`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Published lessons + the categories that contain them.
  try {
    const lessons = await getPublishedLessons();
    const categories = new Set<string>();

    for (const lesson of lessons) {
      if (lesson.category) categories.add(lesson.category);
      entries.push({
        url: `${BASE}/library/lesson/${lesson.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    for (const category of categories) {
      entries.push({
        url: `${BASE}/library/${category}`,
        lastModified: now,
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
