// src/lib/games/curated/nature.ts
//
// Hand-curated Nature vocabulary. See animals.ts for the full rationale.
// Sun/cloud/rain live in the weather theme instead, to keep the sets distinct.

import type { CuratedItem } from "./animals";

export function curatedImage(slug: string): string {
  return `/games/nature/${slug}.png`;
}

export const NATURE: CuratedItem[] = [
  { slug: "arbre",    term: "l'arbre",    translation: "tree",     prompt: "one green tree with a brown trunk" },
  { slug: "fleur",    term: "la fleur",   translation: "flower",   prompt: "one pink flower with a green stem" },
  { slug: "feuille",  term: "la feuille", translation: "leaf",     prompt: "one green leaf" },
  { slug: "montagne", term: "la montagne",translation: "mountain", prompt: "one mountain with a snowy peak" },
  { slug: "riviere",  term: "la rivière", translation: "river",    prompt: "a winding blue river between green banks" },
  { slug: "lune",     term: "la lune",    translation: "moon",     prompt: "one yellow crescent moon on a white background" },
  { slug: "etoile",   term: "l'étoile",   translation: "star",     prompt: "one yellow five-pointed star" },
  { slug: "herbe",    term: "l'herbe",    translation: "grass",    prompt: "a patch of green grass" },
  { slug: "pierre",   term: "la pierre",  translation: "stone",    prompt: "one grey rounded stone" },
  { slug: "champignon",term:"le champignon",translation:"mushroom",prompt: "one red mushroom with white spots" },
  { slug: "cactus",   term: "le cactus",  translation: "cactus",   prompt: "one green cactus in a pot" },
  { slug: "sapin",    term: "le sapin",   translation: "pine tree",prompt: "one tall green pine tree" },
];
