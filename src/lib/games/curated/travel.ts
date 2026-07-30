// src/lib/games/curated/travel.ts
//
// Hand-curated Travel vocabulary. See animals.ts for the full rationale
// (visually distinct subjects, verified pictures, no ambiguous pairs).

import type { CuratedItem } from "./animals";

export function curatedImage(slug: string): string {
  return `/games/travel/${slug}.png`;
}

export const TRAVEL: CuratedItem[] = [
  { slug: "voiture",    term: "la voiture",    translation: "car",        prompt: "one red car, side view" },
  { slug: "bus",        term: "le bus",        translation: "bus",        prompt: "one yellow bus, side view" },
  { slug: "train",      term: "le train",      translation: "train",      prompt: "a toy train engine on rails, side view" },
  { slug: "avion",      term: "l'avion",       translation: "plane",      prompt: "one white airplane flying, side view" },
  { slug: "velo",       term: "le vélo",       translation: "bicycle",    prompt: "one bicycle, side view" },
  { slug: "bateau",     term: "le bateau",     translation: "boat",       prompt: "one small sailboat on water" },
  { slug: "camion",     term: "le camion",     translation: "truck",      prompt: "one green delivery truck, side view" },
  { slug: "moto",       term: "la moto",       translation: "motorcycle", prompt: "one motorcycle, side view" },
  { slug: "helicoptere",term: "l'hélicoptère", translation: "helicopter", prompt: "one helicopter flying, side view" },
  { slug: "fusee",      term: "la fusée",      translation: "rocket",     prompt: "one rocket ship flying upward" },
  { slug: "valise",     term: "la valise",     translation: "suitcase",   prompt: "one brown suitcase with a handle" },
  { slug: "carte",      term: "la carte",      translation: "map",        prompt: "one folded paper road map" },
];
