// src/lib/games/curated/clothes.ts
//
// Hand-curated Clothes vocabulary. See animals.ts for the full rationale.

import type { CuratedItem } from "./animals";

export function curatedImage(slug: string): string {
  return `/games/clothes/${slug}.png`;
}

export const CLOTHES: CuratedItem[] = [
  { slug: "tshirt",    term: "le t-shirt",    translation: "t-shirt",  prompt: "one blue t-shirt, flat lay" },
  { slug: "pantalon",  term: "le pantalon",   translation: "pants",    prompt: "one pair of denim pants, flat lay" },
  { slug: "robe",      term: "la robe",       translation: "dress",    prompt: "one pink dress on a hanger" },
  { slug: "jupe",      term: "la jupe",       translation: "skirt",    prompt: "one pleated skirt, flat lay" },
  { slug: "veste",     term: "la veste",      translation: "jacket",   prompt: "one red jacket, flat lay" },
  { slug: "pull",      term: "le pull",       translation: "sweater",  prompt: "one knit sweater, flat lay" },
  { slug: "chaussures", term: "les chaussures", translation: "shoes",  prompt: "a pair of white sneakers" },
  { slug: "chaussettes", term: "les chaussettes", translation: "socks", prompt: "a pair of striped socks" },
  { slug: "chapeau",   term: "le chapeau",    translation: "hat",      prompt: "one round sun hat" },
  { slug: "gants",     term: "les gants",     translation: "gloves",   prompt: "a pair of warm mittens" },
  { slug: "echarpe",   term: "l'écharpe",     translation: "scarf",    prompt: "one knit winter scarf, coiled" },
  { slug: "short",     term: "le short",      translation: "shorts",   prompt: "one pair of denim shorts, flat lay" },
  { slug: "pyjama",    term: "le pyjama",     translation: "pajamas",  prompt: "one pair of pajamas with stars pattern, flat lay" },
  { slug: "cravate",   term: "la cravate",    translation: "tie",      prompt: "one striped necktie" },
  { slug: "bottes",    term: "les bottes",    translation: "boots",    prompt: "a pair of brown rain boots" },
];
