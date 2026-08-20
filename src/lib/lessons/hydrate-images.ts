// Fetches Pexels photos for vocab terms + image_hints + dialogue contexts,
// uploads them to Supabase Storage so URLs are stable, and writes image_url
// fields onto the lesson JSON in place. Idempotent: skips items that already
// have an image_url pointing at the bucket.

import { createClient } from "@supabase/supabase-js";
import type { Lesson, Section } from "./types";
import { conceptFor, isLibraryUrl, libraryImageUrl } from "@/lib/vocab-library";

const BUCKET = "lesson-images";
const VOCAB_PREFIX = "vocab-photos";
const LESSON_PREFIX = "tutor-lesson-photos";

type SupabaseAdmin = ReturnType<typeof createClient>;

function asciiSlug(s: string, maxLen = 60): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen);
}

function alreadyHosted(url: string | undefined): boolean {
  return typeof url === "string" && url.includes(`/${BUCKET}/`);
}

// Shared vocab picture library (see src/lib/vocab-library). A generated,
// unambiguous illustration beats a stock photo for concrete vocabulary — a
// photo search for "knee" returns a whole person — so we look there first and
// only fall back to Pexels for concepts the library doesn't cover yet.
function libraryUrlFor(...hints: (string | undefined)[]): string | null {
  const concept = conceptFor(...hints);
  // `hold` marks a picture that failed review — fall through to a photo.
  return concept && !concept.hold ? libraryImageUrl(concept.slug) : null;
}

// Global Pexels throttle. The free tier allows ~200 requests/hour. We pace
// calls a little under that and back off hard on 429 so a long fill run keeps
// going instead of dying once the cap is hit.
const PEXELS_MIN_GAP_MS = Number(process.env.PEXELS_MIN_GAP_MS || 1200);
let _pexelsChain: Promise<void> = Promise.resolve();
function pexelsGate(): Promise<void> {
  const myTurn = _pexelsChain.then(() => new Promise<void>((r) => setTimeout(r, PEXELS_MIN_GAP_MS)));
  _pexelsChain = myTurn;
  return myTurn;
}

async function pexelsSearch(query: string, pexelsKey: string, opts: { wide?: boolean } = {}) {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "5");
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("size", opts.wide ? "large" : "medium");
  for (let attempt = 0; attempt < 4; attempt++) {
    await pexelsGate();
    const res = await fetch(url, {
      headers: { Authorization: pexelsKey, Accept: "application/json" },
    });
    if (res.ok) return res.json();
    if (res.status === 429) {
      // Rate-limited: wait progressively longer (the cap is hourly).
      const wait = [30000, 90000, 180000, 300000][attempt];
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    throw new Error(`Pexels ${res.status}: ${(await res.text()).slice(0, 160)}`);
  }
  throw new Error("Pexels 429 after retries");
}

type PexelsSrc = { original?: string; large2x?: string; large?: string; medium?: string };

function pickPhotoUrl(
  data: { photos?: Array<{ src?: PexelsSrc; width?: number }> },
  opts: { wide?: boolean } = {}
): string | null {
  const photos = data?.photos || [];
  for (const p of photos) {
    const src = p?.src;
    if (!src) continue;
    const url = opts.wide
      ? src.large2x || src.original || src.large || src.medium
      : src.large || src.large2x || src.medium;
    if (url) return url;
  }
  return null;
}

async function downloadAndUpload(srcUrl: string, storagePath: string, supabase: SupabaseAdmin) {
  // If already uploaded, return public URL without re-uploading.
  const { data: existing } = await supabase.storage.from(BUCKET).list(
    storagePath.split("/").slice(0, -1).join("/"),
    { search: storagePath.split("/").pop() }
  );
  const filename = storagePath.split("/").pop();
  if (existing?.some((f) => f.name === filename)) {
    return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  }

  const res = await fetch(srcUrl);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

async function storageFileExists(storagePath: string, supabase: SupabaseAdmin): Promise<string | null> {
  const dir = storagePath.split("/").slice(0, -1).join("/");
  const filename = storagePath.split("/").pop();
  const { data } = await supabase.storage.from(BUCKET).list(dir, { search: filename });
  if (data?.some((f) => f.name === filename)) {
    return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  }
  return null;
}

async function getImage(
  query: string,
  slug: string,
  supabase: SupabaseAdmin,
  pexelsKey: string,
  opts: { wide?: boolean } = {}
) {
  // Cache hit: file already in the bucket → reuse, no Pexels call at all.
  const cached = await storageFileExists(slug, supabase);
  if (cached) return cached;

  const data = await pexelsSearch(query, pexelsKey, opts);
  const url = pickPhotoUrl(data, opts);
  if (!url) return null;
  return downloadAndUpload(url, slug, supabase);
}

export interface HydrateOptions {
  /** Use the existing shared vocab-photos bucket when hydrating vocab terms. */
  shareVocabBucket?: boolean;
}

export interface HydrateResult {
  lesson: Lesson;
  stats: { vocab: number; prompts: number; dialogues: number; misses: number };
}

export async function hydrateImages(
  lesson: Lesson,
  opts: HydrateOptions = {}
): Promise<HydrateResult> {
  const pexelsKey = process.env.PEXELS_API_KEY;
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!pexelsKey || !supaUrl || !supaKey) {
    throw new Error("Missing PEXELS_API_KEY / Supabase service env");
  }
  const supabase = createClient(supaUrl, supaKey);
  const shareVocab = opts.shareVocabBucket !== false;
  const stats = { vocab: 0, prompts: 0, dialogues: 0, misses: 0 };

  const lessonSlug = lesson.slug;

  // Hero image — derived from hero_image_hint, or fall back to title/topic.
  if (!alreadyHosted(lesson.hero_image_url)) {
    const heroQuery =
      lesson.hero_image_hint ||
      lesson.topic_tags?.[0] ||
      lesson.title ||
      "language learning";
    // Versioned filename: bump when we change hero resolution / source so old cached files don't shadow new ones.
    const heroPath = `${LESSON_PREFIX}/${lessonSlug}/hero-v2.jpg`;
    try {
      const url = await getImage(heroQuery, heroPath, supabase, pexelsKey, { wide: true });
      if (url) lesson.hero_image_url = url;
    } catch {}
  }

  for (let si = 0; si < lesson.sections.length; si++) {
    const s = lesson.sections[si];
    await hydrateSection(s, si);
  }

  return { lesson, stats };

  async function hydrateSection(s: Section, sectionIdx: number) {
    switch (s.kind) {
      case "warmup_vocabulary":
      case "vocabulary_with_examples": {
        for (let i = 0; i < s.items.length; i++) {
          const it = s.items[i];
          if (isLibraryUrl(it.image_url)) continue;
          const fromLibrary = libraryUrlFor(it.image_query, it.translation);
          if (fromLibrary) {
            it.image_url = fromLibrary;
            stats.vocab++;
            continue;
          }
          if (alreadyHosted(it.image_url)) continue;
          const termSlug = asciiSlug(it.term);
          if (!termSlug) continue;
          // Prefer Gemini's concrete English image_query → translation → French term.
          const query = it.image_query || it.translation || it.term;
          // Cache by query so a fresh image_query produces a fresh upload.
          const cacheKey = asciiSlug(`${termSlug}-${query}`);
          const path = shareVocab
            ? `${VOCAB_PREFIX}/${cacheKey}.jpg`
            : `${LESSON_PREFIX}/${lessonSlug}/s${sectionIdx}-${i}.jpg`;
          try {
            const url = await getImage(query, path, supabase, pexelsKey);
            if (url) { it.image_url = url; stats.vocab++; } else stats.misses++;
          } catch { stats.misses++; }
        }
        return;
      }
      case "image_question_prompts": {
        for (let i = 0; i < s.prompts.length; i++) {
          const p = s.prompts[i];
          if (alreadyHosted(p.image_url)) continue;
          const path = `${LESSON_PREFIX}/${lessonSlug}/s${sectionIdx}-p${i}.jpg`;
          try {
            const url = await getImage(p.image_hint, path, supabase, pexelsKey);
            if (url) { p.image_url = url; stats.prompts++; } else stats.misses++;
          } catch { stats.misses++; }
        }
        return;
      }
      case "dialogue_read_aloud": {
        if (alreadyHosted(s.context_image_url)) return;
        const q = s.context || s.title || "two people talking";
        const path = `${LESSON_PREFIX}/${lessonSlug}/s${sectionIdx}-context.jpg`;
        try {
          const url = await getImage(q, path, supabase, pexelsKey);
          if (url) { s.context_image_url = url; stats.dialogues++; } else stats.misses++;
        } catch { stats.misses++; }
        return;
      }
      case "reading_comprehension": {
        if (alreadyHosted(s.image_url)) return;
        const q = s.image_hint || s.title || "newspaper article";
        const path = `${LESSON_PREFIX}/${lessonSlug}/s${sectionIdx}-passage.jpg`;
        try {
          const url = await getImage(q, path, supabase, pexelsKey, { wide: true });
          if (url) { s.image_url = url; stats.dialogues++; } else stats.misses++;
        } catch { stats.misses++; }
        return;
      }
      default:
        return;
    }
  }
}
