// src/lib/games/curated/food.ts
//
// Hand-curated Food & Drink vocabulary. See animals.ts for the full rationale
// (visually distinct subjects, verified pictures, no ambiguous pairs).

import type { CuratedItem } from "./animals";

export function curatedImage(slug: string): string {
  return `/games/food/${slug}.png`;
}

export const FOOD: CuratedItem[] = [
  { slug: "pomme",     term: "la pomme",     translation: "apple",     prompt: "one red apple with a leaf" },
  { slug: "banane",    term: "la banane",    translation: "banana",    prompt: "one yellow banana" },
  { slug: "orange",    term: "l'orange",     translation: "orange",    prompt: "one whole orange fruit" },
  { slug: "fraise",    term: "la fraise",    translation: "strawberry", prompt: "one red strawberry with green leaves" },
  { slug: "raisin",    term: "le raisin",    translation: "grapes",    prompt: "one bunch of purple grapes hanging" },
  { slug: "pasteque",  term: "la pastèque",  translation: "watermelon", prompt: "one whole watermelon with a slice cut showing red flesh" },
  { slug: "pain",      term: "le pain",      translation: "bread",     prompt: "one loaf of bread" },
  { slug: "fromage",   term: "le fromage",   translation: "cheese",    prompt: "one wedge of yellow cheese with holes" },
  { slug: "gateau",    term: "le gâteau",    translation: "cake",      prompt: "one round birthday cake with icing and a cherry on top" },
  { slug: "pizza",     term: "la pizza",     translation: "pizza",     prompt: "a round pizza pie, top-down view" },
  { slug: "glace",     term: "la glace",     translation: "ice cream", prompt: "one ice cream cone with a scoop of pink ice cream" },
  { slug: "carotte",   term: "la carotte",   translation: "carrot",    prompt: "one orange carrot with green leafy top" },
  { slug: "tomate",    term: "la tomate",    translation: "tomato",    prompt: "one red tomato with a green stem" },
  { slug: "oeuf",      term: "l'œuf",        translation: "egg",       prompt: "one plain white egg standing upright, no face, no legs" },
  { slug: "lait",      term: "le lait",      translation: "milk",      prompt: "one glass bottle of milk" },
];
