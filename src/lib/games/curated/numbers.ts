// src/lib/games/curated/numbers.ts
//
// Hand-curated Numbers vocabulary. Pictures are rendered numeral cards (see
// scripts/generate-number-cards.mjs), not AI illustrations — asking an image
// model to draw "three apples" risks the wrong count, and for a number word
// the numeral itself is exactly the unambiguous "picture" a child should match.

import type { CuratedItem } from "./animals";

export function curatedImage(slug: string): string {
  return `/games/numbers/${slug}.png`;
}

// `prompt` is unused for this theme (rendered by a dedicated canvas script)
// but kept so this satisfies the shared CuratedItem shape.
export const NUMBERS: CuratedItem[] = [
  { slug: "un",     term: "un",     translation: "one",   prompt: "numeral 1" },
  { slug: "deux",   term: "deux",   translation: "two",   prompt: "numeral 2" },
  { slug: "trois",  term: "trois",  translation: "three", prompt: "numeral 3" },
  { slug: "quatre", term: "quatre", translation: "four",  prompt: "numeral 4" },
  { slug: "cinq",   term: "cinq",   translation: "five",  prompt: "numeral 5" },
  { slug: "six",    term: "six",    translation: "six",   prompt: "numeral 6" },
  { slug: "sept",   term: "sept",   translation: "seven", prompt: "numeral 7" },
  { slug: "huit",   term: "huit",   translation: "eight", prompt: "numeral 8" },
  { slug: "neuf",   term: "neuf",   translation: "nine",  prompt: "numeral 9" },
  { slug: "dix",    term: "dix",    translation: "ten",   prompt: "numeral 10" },
];
