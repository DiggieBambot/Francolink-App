// src/lib/games/curated/home.ts
//
// Hand-curated Home vocabulary. See animals.ts for the full rationale.

import type { CuratedItem } from "./animals";

export function curatedImage(slug: string): string {
  return `/games/home/${slug}.png`;
}

export const HOME: CuratedItem[] = [
  { slug: "maison",   term: "la maison",   translation: "house",  prompt: "one small house with a red roof" },
  { slug: "porte",    term: "la porte",    translation: "door",   prompt: "a closed wooden door with a round handle" },
  { slug: "fenetre",  term: "la fenêtre",  translation: "window", prompt: "one window with blue curtains" },
  { slug: "table",    term: "la table",    translation: "table",  prompt: "one wooden table" },
  { slug: "chaise",   term: "la chaise",   translation: "chair",  prompt: "one wooden chair" },
  { slug: "lit",      term: "le lit",      translation: "bed",    prompt: "a childs bed with a pillow and a blue blanket" },
  { slug: "lampe",    term: "la lampe",    translation: "lamp",   prompt: "one table lamp with a shade" },
  { slug: "cle",      term: "la clé",      translation: "key",    prompt: "one golden key" },
  { slug: "horloge",  term: "l'horloge",   translation: "clock",  prompt: "one round wall clock" },
  { slug: "assiette", term: "l'assiette",  translation: "plate",  prompt: "one empty white dinner plate, top-down view" },
  { slug: "tasse",    term: "la tasse",    translation: "cup",    prompt: "a mug of tea with a handle" },
  { slug: "cuillere", term: "la cuillère", translation: "spoon",  prompt: "one metal spoon" },
  { slug: "fourchette",term: "la fourchette",translation: "fork", prompt: "a shiny dinner fork" },
  { slug: "miroir",   term: "le miroir",   translation: "mirror", prompt: "one oval wall mirror with a frame" },
];
