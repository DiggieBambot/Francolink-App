// Structured data for the front-facing website.
//
// The audit scored structured data 0/10: only /francais-pas-a-pas carried any
// JSON-LD at all, so nothing told a search engine — or an LLM — what FrancoLink
// is, who runs it, what it sells or what a lesson page contains.
//
// Everything here is built from real data. Three rules, because getting them
// wrong is worse than shipping no schema:
//
//   1. No invented ratings. `aggregateRating` is computed from real testimonial
//      rows and omitted entirely when the count is zero. A fabricated rating is
//      structured-data spam and a manual action waiting to happen.
//   2. No `SearchAction` — /search does not exist on this host (it 307s), and
//      declaring a search endpoint that isn't there is a broken promise.
//   3. `sameAs` stays empty until there are real profile URLs to put in it.
//      Guessing at social handles fabricates identity claims.

import { SITE_URL } from "./hosts";

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * One stable sentence describing FrancoLink, reused verbatim in the schema,
 * llms.txt and the meta description. LLMs cite consistent phrasing; three
 * different descriptions of the same company read as three weaker signals.
 */
export const ORG_DESCRIPTION =
  "FrancoLink is a French-learning platform combining live lessons with certified tutors, " +
  "a CEFR-aligned self-study lesson library, and Le Français Pas à Pas, a grammar workbook.";

/** The one credentialed human currently named on the site. */
export const FOUNDER_NAME = "Njinu Precious Bambot";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": ORG_ID,
    name: "FrancoLink",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/logo-new.webp`,
    description: ORG_DESCRIPTION,
    founder: { "@type": "Person", name: FOUNDER_NAME },
    knowsLanguage: ["fr", "en"],
    // Left empty deliberately — see rule 3 above. Populate with real profile
    // URLs (LinkedIn company page, YouTube channel) when they exist; sameAs is
    // how search engines and LLMs resolve "FrancoLink" to a single entity.
    sameAs: [] as string[],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: "FrancoLink",
    description: ORG_DESCRIPTION,
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path === "/" ? "" : t.path}`,
    })),
  };
}

/** ItemList for the tutor directory — position + url only, per Google's guidance. */
export function tutorListSchema(slugs: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: slugs.map((slug, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/tutors/${slug}`,
    })),
  };
}

interface TutorForSchema {
  slug: string;
  name: string;
  headline: string | null;
  photo_url: string | null;
  teaches: string[];
  years_experience: number | null;
  testimonials?: { rating: number | null }[];
}

export function tutorSchema(t: TutorForSchema) {
  const rated = (t.testimonials ?? []).filter((r) => typeof r.rating === "number");

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: t.name,
    url: `${SITE_URL}/tutors/${t.slug}`,
    jobTitle: "Language tutor",
    worksFor: { "@id": ORG_ID },
  };

  if (t.headline) schema.description = t.headline;
  if (t.photo_url) schema.image = t.photo_url;
  if (t.teaches?.length) schema.knowsLanguage = t.teaches;

  // Only when real rated testimonials exist. Never defaulted, never rounded up.
  if (rated.length) {
    const avg = rated.reduce((s, r) => s + (r.rating as number), 0) / rated.length;
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(avg.toFixed(1)),
      reviewCount: rated.length,
      bestRating: 5,
    };
  }

  return schema;
}

/** The subscription product, with the prices the pricing page actually shows. */
export function subscriptionCourseSchema() {
  const offer = (name: string, price: string) => ({
    "@type": "Offer",
    name,
    price,
    priceCurrency: "USD",
    url: `${SITE_URL}/pricing`,
    availability: "https://schema.org/InStock",
  });

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "FrancoLink — self-study French course",
    description:
      "A CEFR-aligned French course from A1 to C2: structured lessons, daily practice " +
      "and an AI conversation partner, studied at your own pace in the FrancoLink app.",
    provider: { "@id": ORG_ID },
    url: `${SITE_URL}/pricing`,
    inLanguage: "fr",
    // Course needs a CourseInstance to be eligible for a rich result.
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT30M",
    },
    offers: [
      offer("Free", "0"),
      offer("Premium (monthly)", "7.99"),
      offer("Premium (yearly, per month)", "5.00"),
      offer("Premium+ (monthly)", "14.99"),
      offer("Premium+ (yearly, per month)", "10.00"),
    ],
  };
}

/**
 * The author entity. Referenced by @id from every Article so that a search
 * engine or an LLM resolves all posts to one person rather than to a repeated
 * string. `sameAs` and `image` are omitted when empty — see rule 3 above.
 */
export function personSchema(a: {
  slug: string;
  name: string;
  credential: string;
  bio: string;
  image: string | null;
  sameAs: string[];
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": authorId(a.slug),
    name: a.name,
    url: `${SITE_URL}/authors/${a.slug}`,
    jobTitle: a.credential,
    description: a.bio,
    worksFor: { "@id": ORG_ID },
    knowsAbout: ["French language", "French grammar", "CEFR", "Language teaching"],
  };
  if (a.image) schema.image = `${SITE_URL}${a.image}`;
  if (a.sameAs.length) schema.sameAs = a.sameAs;
  return schema;
}

export function authorId(slug: string) {
  return `${SITE_URL}/authors/${slug}#person`;
}

/**
 * A blog post. `author` is a reference to the Person entity above rather than
 * an inline object, which is what makes the byline an entity claim instead of
 * a label. No `image` unless the post really has one: a missing OG image is a
 * warning in Search Console, a fabricated one is a broken URL.
 */
export function articleSchema(p: {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated: string;
  authorSlug: string;
  image?: string | null;
}) {
  const url = `${SITE_URL}/blog/${p.slug}`;
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    dateModified: p.updated,
    author: { "@id": authorId(p.authorSlug) },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: url,
    url,
    inLanguage: "en",
  };
  if (p.image) schema.image = `${SITE_URL}${p.image}`;
  return schema;
}

export function faqSchema(pairs: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
