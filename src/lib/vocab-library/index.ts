// src/lib/vocab-library/index.ts
//
// Public URLs for the shared vocab picture library. The images live in the
// same Supabase bucket as lesson photos, under a vocab-library/ prefix, so
// lessons and games can both link straight at them.

export * from "./concepts";

export const LIBRARY_BUCKET = "lesson-images";
export const LIBRARY_PREFIX = "vocab-library";

export function libraryPath(slug: string): string {
  return `${LIBRARY_PREFIX}/${slug}.png`;
}

/** Public URL for a concept, without needing a Supabase client. */
export function libraryImageUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${LIBRARY_BUCKET}/${libraryPath(slug)}`;
}

export function isLibraryUrl(url: string | undefined): boolean {
  return typeof url === "string" && url.includes(`/${LIBRARY_BUCKET}/${LIBRARY_PREFIX}/`);
}
