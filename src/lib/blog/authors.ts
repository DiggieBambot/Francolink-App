// The author registry.
//
// E-E-A-T for educational content depends on a named, credentialed human that a
// search engine or an LLM can resolve to a single entity. Before this file there
// was no author entity anywhere on the site: no Person schema, no author page,
// nothing tying the grammar explanations to somebody qualified to write them.
//
// Same rule as lib/site/schema.ts — everything here is real. No invented
// qualifications, no founding year, no "X years of experience". If a credential
// is not on the site today and cannot be evidenced, it does not go in.

export interface Author {
  slug: string;
  name: string;
  /** One line. Used verbatim in Person schema and under the byline. */
  credential: string;
  /** Two or three sentences for the author page and the post footer. */
  bio: string;
  /** Path to a real image in /public, or null. Never a placeholder. */
  image: string | null;
  /**
   * Real profile URLs only. `sameAs` is how an entity gets resolved, so a
   * guessed handle actively fabricates an identity claim. Empty is correct
   * until there is a real profile to put here.
   */
  sameAs: string[];
}

export const AUTHORS: Record<string, Author> = {
  "njinu-precious-bambot": {
    slug: "njinu-precious-bambot",
    name: "Njinu Precious Bambot",
    credential: "Certified Bilingual Language Expert and Coach",
    bio:
      "Njinu Precious Bambot is a Certified Bilingual Language Expert and Coach, and the author of " +
      "Le Français Pas à Pas, the 45-rule French grammar workbook FrancoLink publishes. " +
      "He built FrancoLink's CEFR lesson library and selects and interviews every tutor on the platform.",
    image: null,
    sameAs: [],
  },
};

export const DEFAULT_AUTHOR_SLUG = "njinu-precious-bambot";

export function getAuthor(slug: string): Author | null {
  return AUTHORS[slug] ?? null;
}

export function allAuthorSlugs(): string[] {
  return Object.keys(AUTHORS);
}
