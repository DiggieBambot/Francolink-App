// src/lib/games/curated/weather.ts
//
// Hand-curated Weather vocabulary. Weather words are conditions rather than
// objects, so each picture is a simple weather icon/scene — the clearest
// unambiguous depiction for a child. See animals.ts for the general rationale.

import type { CuratedItem } from "./animals";

export function curatedImage(slug: string): string {
  return `/games/weather/${slug}.png`;
}

export const WEATHER: CuratedItem[] = [
  { slug: "soleil",   term: "le soleil",   translation: "sun",       prompt: "one bright yellow sun with rays" },
  { slug: "nuage",    term: "le nuage",    translation: "cloud",     prompt: "one fluffy white cloud" },
  { slug: "pluie",    term: "la pluie",    translation: "rain",      prompt: "one grey cloud with blue rain drops falling" },
  { slug: "neige",    term: "la neige",    translation: "snow",      prompt: "one cloud with white snowflakes falling" },
  { slug: "orage",    term: "l'orage",     translation: "storm",     prompt: "one dark cloud with a yellow lightning bolt" },
  { slug: "vent",     term: "le vent",     translation: "wind",      prompt: "a gust of wind shown as curved swirl lines" },
  { slug: "arcenciel",term: "l'arc-en-ciel",translation: "rainbow",  prompt: "one colorful rainbow arc" },
  { slug: "parapluie",term: "le parapluie",translation: "umbrella",  prompt: "an open red umbrella seen from the side" },
  { slug: "glace",    term: "la glace",    translation: "ice",       prompt: "a frozen ice cube, pale blue" },
  { slug: "brouillard",term:"le brouillard",translation: "fog",      prompt: "grey horizontal fog mist bands" },
];
