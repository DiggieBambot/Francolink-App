// src/lib/games/curated/sports.ts
//
// Hand-curated Sports vocabulary. Equipment reads far more clearly in a
// picture than an action pose does, so each word is anchored to its object.
// See animals.ts for the general rationale.

import type { CuratedItem } from "./animals";

export function curatedImage(slug: string): string {
  return `/games/sports/${slug}.png`;
}

export const SPORTS: CuratedItem[] = [
  { slug: "football",   term: "le football",   translation: "football",  prompt: "one black and white soccer ball" },
  { slug: "basket",     term: "le basket",     translation: "basketball",prompt: "one orange basketball" },
  { slug: "tennis",     term: "le tennis",     translation: "tennis",    prompt: "one tennis racket with a yellow tennis ball" },
  { slug: "natation",   term: "la natation",   translation: "swimming",  prompt: "one pair of swimming goggles" },
  { slug: "velo",       term: "le cyclisme",   translation: "cycling",   prompt: "one bicycle helmet" },
  { slug: "ski",        term: "le ski",        translation: "skiing",    prompt: "a pair of skis and ski poles" },
  { slug: "patins",     term: "le patinage",   translation: "skating",   prompt: "one white ice skate boot with a blade" },
  { slug: "boxe",       term: "la boxe",       translation: "boxing",    prompt: "a pair of red boxing gloves" },
  { slug: "medaille",   term: "la médaille",   translation: "medal",     prompt: "a gold winners medal hanging from a ribbon" },
  { slug: "trophee",    term: "le trophée",    translation: "trophy",    prompt: "one golden trophy cup" },
  { slug: "chronometre",term: "le chronomètre",translation: "stopwatch", prompt: "one silver stopwatch" },
  { slug: "haltere",    term: "l'haltère",     translation: "dumbbell",  prompt: "one black dumbbell weight" },
];
