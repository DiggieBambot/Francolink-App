import type { CatalogueLesson } from "./public-queries";

// Categories whose lessons must display in curated pedagogical order (the
// order they're meant to be learned in), not alphabetically. The order is
// read off the slug's own numbering, e.g. fr-grammar-a1-07-negation → A1, 07.
const SYLLABUS_CATEGORIES = new Set(["fr-grammar", "en-grammar", "fr-prononciation", "pronunciation"]);

const LEVEL_RANK: Record<string, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 };

// Matches the "-a1-07-" / "-b2-03-" segment a syllabus slug encodes its
// position with. Falls back to Infinity (sorts last) if a slug doesn't match
// the convention, so any oddly-named lesson just lands at the end rather than
// breaking the sort.
const SLUG_ORDER_RE = /-([abc][12])-(\d{1,2})-/i;

function slugSequence(slug: string): number {
  const m = SLUG_ORDER_RE.exec(slug);
  return m ? parseInt(m[2], 10) : Number.POSITIVE_INFINITY;
}

/** Whether a category is taught in a fixed curated order (so its cards should
 *  show a "Lesson N" sequence badge instead of no ordering indicator). */
export function isSyllabusCategory(category: string): boolean {
  return SYLLABUS_CATEGORIES.has(category);
}

/** Sort lessons into pedagogical order for syllabus-driven categories; leaves
 *  every other category's existing (alphabetical) order untouched. */
export function sortForCategory(lessons: CatalogueLesson[], category: string): CatalogueLesson[] {
  if (!SYLLABUS_CATEGORIES.has(category)) return lessons;
  return [...lessons].sort((a, b) => {
    const levelDiff = (LEVEL_RANK[a.level] ?? 99) - (LEVEL_RANK[b.level] ?? 99);
    if (levelDiff !== 0) return levelDiff;
    const seqDiff = slugSequence(a.slug) - slugSequence(b.slug);
    if (seqDiff !== 0) return seqDiff;
    return a.title.localeCompare(b.title);
  });
}
