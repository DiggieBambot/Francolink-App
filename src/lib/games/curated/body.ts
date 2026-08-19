// src/lib/games/curated/body.ts
//
// Hand-curated Body vocabulary. Unlike other themes, a body part can't be
// shown as an isolated single-subject picture — "arm" and "hand" both live on
// the same figure, so showing them in isolation loses the part's context and
// two different parts can look identical when cropped tight. Instead every
// word shares ONE consistent character illustration, and each picture is that
// same figure with a highlight ring pointing at the correct part (see
// scripts/generate-curated-body.mjs). `prompt` is unused here — kept only to
// satisfy the shared CuratedItem shape.

import type { CuratedItem } from "./animals";
import { libraryImageUrl } from "@/lib/vocab-library";

// Body pictures now come from the shared vocab library, so the games and the
// lessons show the exact same figure for a given part. `slug` here is the
// French stem, mapped to the library's English concept key.
const CONCEPT_BY_SLUG: Record<string, string> = {
  tete: "head", cheveux: "hair", oeil: "eye", nez: "nose", bouche: "mouth",
  oreille: "ear", cou: "neck", epaule: "shoulder", bras: "arm", main: "hand",
  ventre: "tummy", jambe: "leg", genou: "knee", pied: "foot",
};

export function curatedImage(slug: string): string {
  const concept = CONCEPT_BY_SLUG[slug];
  return concept ? libraryImageUrl(concept) : `/games/body/${slug}.png`;
}

export const BODY: CuratedItem[] = [
  { slug: "tete",     term: "la tête",     translation: "head",   prompt: "head",
    annotate: { kind: "ring", x: 0.5, y: 0.265, size: 0.135 }, zoom: 0.23 },
  { slug: "cheveux",  term: "les cheveux", translation: "hair",   prompt: "hair",
    annotate: { kind: "ring", x: 0.5, y: 0.20, size: 0.06 }, zoom: 0.2 },
  { slug: "oeil",     term: "l'œil",       translation: "eye",    prompt: "eye",
    annotate: { kind: "ring", x: 0.452, y: 0.345, size: 0.026 }, zoom: 0.13 },
  { slug: "nez",      term: "le nez",      translation: "nose",   prompt: "nose",
    annotate: { kind: "ring", x: 0.5, y: 0.368, size: 0.022 }, zoom: 0.13 },
  { slug: "bouche",   term: "la bouche",   translation: "mouth",  prompt: "mouth",
    annotate: { kind: "ring", x: 0.5, y: 0.397, size: 0.032 }, zoom: 0.13 },
  { slug: "oreille",  term: "l'oreille",   translation: "ear",    prompt: "ear",
    annotate: { kind: "ring", x: 0.41, y: 0.36, size: 0.024 }, zoom: 0.13 },
  { slug: "bras",     term: "le bras",     translation: "arm",    prompt: "arm",
    annotate: { kind: "ring", x: 0.365, y: 0.425, size: 0.03 }, zoom: 0.2 },
  { slug: "main",     term: "la main",     translation: "hand",   prompt: "hand",
    annotate: { kind: "ring", x: 0.3, y: 0.405, size: 0.035 }, zoom: 0.16 },
  { slug: "ventre",   term: "le ventre",   translation: "tummy",  prompt: "tummy",
    annotate: { kind: "ring", x: 0.5, y: 0.55, size: 0.05 }, zoom: 0.22 },
  { slug: "jambe",    term: "la jambe",    translation: "leg",    prompt: "leg",
    annotate: { kind: "ring", x: 0.44, y: 0.775, size: 0.062 }, zoom: 0.26 },
  { slug: "genou",    term: "le genou",    translation: "knee",   prompt: "knee",
    annotate: { kind: "ring", x: 0.44, y: 0.782, size: 0.026 }, zoom: 0.12 },
  { slug: "pied",     term: "le pied",     translation: "foot",   prompt: "foot",
    annotate: { kind: "ring", x: 0.44, y: 0.85, size: 0.045 }, zoom: 0.18 },
];
