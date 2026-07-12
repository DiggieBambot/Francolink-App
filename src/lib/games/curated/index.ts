// src/lib/games/curated/index.ts
//
// Registry of hand-curated, image-verified vocab sets keyed by theme slug.
// When a theme has a curated set, the games use it instead of the fuzzy,
// lesson-derived pool — guaranteeing every picture is clear and correct.
// Add more themes here as each is proven out one at a time.

import { ANIMALS, curatedImage, type CuratedItem } from "./animals";

export type { CuratedItem };

const REGISTRY: Record<string, CuratedItem[]> = {
  animals: ANIMALS,
};

export function curatedPool(themeSlug: string):
  | { term: string; translation: string; image: string }[]
  | null {
  const items = REGISTRY[themeSlug];
  if (!items || items.length < 4) return null;
  return items.map((it) => ({
    term: it.term,
    translation: it.translation,
    image: curatedImage(it.slug),
  }));
}
