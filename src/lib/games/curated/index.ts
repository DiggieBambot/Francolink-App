// src/lib/games/curated/index.ts
//
// Registry of hand-curated, image-verified vocab sets keyed by theme slug.
// When a theme has a curated set, the games use it instead of the fuzzy,
// lesson-derived pool — guaranteeing every picture is clear and correct.
// Add more themes here as each is proven out one at a time.

import { ANIMALS, curatedImage as animalsImage, type CuratedItem } from "./animals";
import { FOOD, curatedImage as foodImage } from "./food";
import { CLOTHES, curatedImage as clothesImage } from "./clothes";
import { COLORS, curatedImage as colorsImage } from "./colors";
import { NUMBERS, curatedImage as numbersImage } from "./numbers";

export type { CuratedItem };

const REGISTRY: Record<string, { items: CuratedItem[]; image: (slug: string) => string }> = {
  animals: { items: ANIMALS, image: animalsImage },
  food: { items: FOOD, image: foodImage },
  clothes: { items: CLOTHES, image: clothesImage },
  colors: { items: COLORS, image: colorsImage },
  numbers: { items: NUMBERS, image: numbersImage },
};

export function curatedPool(themeSlug: string):
  | { term: string; translation: string; image: string }[]
  | null {
  const entry = REGISTRY[themeSlug];
  if (!entry || entry.items.length < 4) return null;
  return entry.items.map((it) => ({
    term: it.term,
    translation: it.translation,
    image: entry.image(it.slug),
  }));
}
