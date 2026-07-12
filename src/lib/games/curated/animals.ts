// src/lib/games/curated/animals.ts
//
// Hand-curated Animals vocabulary for the kids' games. Unlike the lesson-derived
// pool (src/app/api/games/pool/route.ts), every item here is chosen and its
// picture is verified by hand, so identification is never ambiguous:
//   • only visually DISTINCT animals — no confusable pairs (leopard/cheetah,
//     frog/toad, rabbit/hare) that a matching game can't fairly test;
//   • one clear single subject per picture;
//   • an optional `annotate` overlay (highlight ring / pointer) baked in at
//     generation time when a picture needs help pointing at its subject.
//
// Images live in the repo at /public/games/animals/<slug>.png (see
// scripts/generate-curated-animals.mjs) so they are version-controlled, fast,
// and shared by every game (maze-chase, memory-match, picture-quiz, …).

export interface CuratedAnnotation {
  /** Ring drawn around the subject to disambiguate it in a busy picture. */
  kind: "ring" | "arrow";
  /** Normalized (0..1) center of the subject within the square image. */
  x: number;
  y: number;
  /** Ring: normalized radius. Arrow: normalized length, pointing up-right→subject. */
  size: number;
}

export interface CuratedItem {
  /** URL-safe id; also the image filename stem. */
  slug: string;
  /** Target-language term (French). */
  term: string;
  /** English translation. */
  translation: string;
  /** Subject description fed to the image model — concrete and unmistakable. */
  prompt: string;
  /** Optional accuracy overlay; omit for pictures that read clearly on their own. */
  annotate?: CuratedAnnotation;
}

/** Public URL for a curated animal picture. */
export function curatedImage(slug: string): string {
  return `/games/animals/${slug}.png`;
}

// 12 unmistakable animals — distinct silhouettes and colors so no two tiles can
// be confused in a word→picture round.
export const ANIMALS: CuratedItem[] = [
  { slug: "chat",       term: "le chat",       translation: "cat",      prompt: "a house cat sitting" },
  { slug: "chien",      term: "le chien",      translation: "dog",      prompt: "a friendly dog sitting" },
  { slug: "vache",      term: "la vache",      translation: "cow",      prompt: "a black-and-white spotted cow standing" },
  { slug: "cheval",     term: "le cheval",     translation: "horse",    prompt: "a brown horse standing" },
  { slug: "mouton",     term: "le mouton",     translation: "sheep",    prompt: "a fluffy white sheep standing" },
  { slug: "cochon",     term: "le cochon",     translation: "pig",      prompt: "a pink pig standing" },
  { slug: "lapin",      term: "le lapin",      translation: "rabbit",   prompt: "a rabbit with long ears sitting" },
  { slug: "canard",     term: "le canard",     translation: "duck",     prompt: "a yellow duck standing" },
  { slug: "lion",       term: "le lion",       translation: "lion",     prompt: "a male lion with a mane sitting" },
  { slug: "elephant",   term: "l'éléphant",    translation: "elephant", prompt: "a grey elephant with big ears and a trunk" },
  { slug: "singe",      term: "le singe",      translation: "monkey",   prompt: "a brown monkey sitting" },
  { slug: "grenouille", term: "la grenouille", translation: "frog",     prompt: "a green frog sitting" },
  { slug: "oiseau",     term: "l'oiseau",      translation: "bird",     prompt: "a small blue bird" },
  { slug: "poisson",    term: "le poisson",    translation: "fish",     prompt: "a single orange fish" },
  { slug: "ours",       term: "l'ours",        translation: "bear",     prompt: "a brown bear sitting" },
  { slug: "tigre",      term: "le tigre",      translation: "tiger",    prompt: "an orange tiger with black stripes" },
  { slug: "serpent",    term: "le serpent",    translation: "snake",    prompt: "a green snake coiled up" },
  { slug: "hibou",      term: "le hibou",      translation: "owl",      prompt: "a brown owl" },
  { slug: "tortue",     term: "la tortue",     translation: "turtle",   prompt: "a green turtle with a shell" },
  { slug: "girafe",     term: "la girafe",     translation: "giraffe",  prompt: "a tall giraffe with a long neck" },
];

const BY_SLUG = new Map(ANIMALS.map((a) => [a.slug, a]));
export function animalBySlug(slug: string): CuratedItem | undefined {
  return BY_SLUG.get(slug);
}
