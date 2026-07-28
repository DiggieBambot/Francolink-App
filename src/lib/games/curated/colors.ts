// src/lib/games/curated/colors.ts
//
// Hand-curated Colors vocabulary. A color word can't be depicted as an object
// (an object has one color but isn't "the color"), so each picture is a plain
// rounded swatch of the exact color — unambiguous and text-free by design.

import type { CuratedItem } from "./animals";

export function curatedImage(slug: string): string {
  return `/games/colors/${slug}.png`;
}

export const COLORS: CuratedItem[] = [
  { slug: "rouge",   term: "rouge",   translation: "red",    prompt: "a single solid bright red rounded square swatch" },
  { slug: "bleu",    term: "bleu",    translation: "blue",   prompt: "a single solid bright blue rounded square swatch" },
  { slug: "vert",    term: "vert",    translation: "green",  prompt: "a single solid bright green rounded square swatch" },
  { slug: "jaune",   term: "jaune",   translation: "yellow", prompt: "a single solid bright yellow rounded square swatch" },
  { slug: "orange",  term: "orange",  translation: "orange", prompt: "a single solid bright orange rounded square swatch" },
  { slug: "violet",  term: "violet",  translation: "purple", prompt: "a single solid bright purple rounded square swatch" },
  { slug: "rose",    term: "rose",    translation: "pink",   prompt: "a single solid bright pink rounded square swatch" },
  { slug: "noir",    term: "noir",    translation: "black",  prompt: "a single solid black rounded square swatch" },
  { slug: "blanc",   term: "blanc",   translation: "white",  prompt: "a single solid white rounded square swatch with a thin grey outline" },
  { slug: "marron",  term: "marron",  translation: "brown",  prompt: "a single solid brown rounded square swatch" },
  { slug: "gris",    term: "gris",    translation: "grey",   prompt: "a single solid grey rounded square swatch" },
];
