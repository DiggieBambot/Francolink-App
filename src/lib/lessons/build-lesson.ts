// Shared on-demand lesson builder: fetch a Drive doc → convert via Gemini →
// hydrate Pexels images. Used by /preview/from-doc and /preview/room.
// In-memory cache keyed by docId so repeat visits are instant.

import type { Lesson } from "./types";
import { fetchDocText, geminiConvert, repairWordOrder } from "./convert";
import { hydrateImages } from "./hydrate-images";

// Bump when prompt/schema changes — invalidates older cached lessons.
const SCHEMA_VERSION = "v10-openai";

type CacheEntry = { lesson: Lesson; createdAt: number; version: string };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function buildLesson(docId: string): Promise<Lesson> {
  const cached = cache.get(docId);
  if (cached && cached.version === SCHEMA_VERSION && Date.now() - cached.createdAt < TTL_MS) {
    return cached.lesson;
  }

  let lesson: Lesson;
  try {
    const text = await fetchDocText(docId);
    lesson = await geminiConvert(text);
  } catch (err) {
    // If Gemini fails (rate limit, network) but we have ANY cached lesson, reuse it.
    // We still run the deterministic repair below, so older caches gain new fixes.
    if (cached?.lesson) {
      console.warn(
        `[buildLesson/${docId}] Gemini failed, reusing cached (${cached.version}):`,
        err instanceof Error ? err.message.slice(0, 200) : err
      );
      lesson = cached.lesson;
    } else {
      throw err;
    }
  }

  // Deterministic repair before image hydration so caches use final content.
  repairWordOrder(lesson);
  try {
    await hydrateImages(lesson);
  } catch (err) {
    console.warn(`[buildLesson/${docId}] image hydration failed:`, err instanceof Error ? err.message : err);
  }
  cache.set(docId, { lesson, createdAt: Date.now(), version: SCHEMA_VERSION });
  return lesson;
}
