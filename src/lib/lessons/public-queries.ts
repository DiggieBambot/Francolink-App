// Server-only queries for the public lesson catalogue. Uses the service role
// key so published lessons are readable even for guests (no session).
// (Only imported by server components / route handlers.)

import { createClient } from "@supabase/supabase-js";
import { categoryForLesson } from "./categories";
import type { Lesson } from "./types";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface CatalogueLesson {
  id: string;
  slug: string;
  title: string;
  title_translation?: string;
  level: string;
  language: string;
  duration_minutes: number | null;
  topic_tags: string[];
  category: string;
  hero_image_url?: string;
  section_count: number;
  /** False when the SEO lint judged the lesson too thin/templated to index. */
  seo_indexable: boolean;
  /** Real last-modified time, for sitemap <lastmod>. */
  updated_at?: string;
}

interface CatalogueRow {
  id: string;
  slug: string;
  title: string;
  level: string;
  language: string;
  duration_minutes: number | null;
  topic_tags: string[];
  source_url: string | null;
  hero_image_url?: string | null;
  title_translation?: string | null;
  section_count?: number | null;
  seo_indexable?: boolean | null;
  updated_at?: string | null;
}

function toCatalogue(row: CatalogueRow): CatalogueLesson {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    title_translation: row.title_translation || undefined,
    level: row.level,
    language: row.language,
    duration_minutes: row.duration_minutes,
    topic_tags: row.topic_tags || [],
    category: categoryForLesson(row.language, row.source_url, row.topic_tags),
    hero_image_url: row.hero_image_url || undefined,
    section_count: row.section_count || 0,
    // Absent column (migration not yet applied) means "not yet judged" — treat
    // as indexable so the catalogue behaves exactly as it did before.
    seo_indexable: row.seo_indexable !== false,
    updated_at: row.updated_at || undefined,
  };
}

// Slim projection — reads scalar columns instead of the whole `content` JSON.
const CATALOGUE_COLS =
  "id, slug, title, level, language, duration_minutes, topic_tags, source_url, hero_image_url, title_translation, section_count, seo_indexable, updated_at";

/** Same projection minus the SEO gate column, for before that migration runs. */
const CATALOGUE_COLS_LEGACY =
  "id, slug, title, level, language, duration_minutes, topic_tags, source_url, hero_image_url, title_translation, section_count, updated_at";

export async function getPublishedLessons(): Promise<CatalogueLesson[]> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("tutor_lessons")
    .select(CATALOGUE_COLS)
    .eq("status", "published")
    .order("title");

  if (!error) return (data as CatalogueRow[]).map(toCatalogue);

  // `seo_indexable` is the newest column here. Until its migration is applied
  // the select above fails wholesale — and dropping straight to the `content`
  // fallback below would pull the entire lesson JSON for every published lesson
  // (the ~6 MB, ~5 s query the catalogue columns exist to avoid). Retry without
  // it first: the catalogue keeps its fast path, and every lesson is treated as
  // indexable, which is exactly the pre-gate behaviour.
  const { data: noGate, error: noGateErr } = await supabase
    .from("tutor_lessons")
    .select(CATALOGUE_COLS_LEGACY)
    .eq("status", "published")
    .order("title");

  if (!noGateErr) {
    console.warn("[catalogue] seo_indexable missing — apply supabase/migrations/20260908_lesson_seo_indexable.sql");
    return (noGate as CatalogueRow[]).map(toCatalogue);
  }

  // Fallback for before the catalogue-columns migration is applied: derive the
  // same fields from `content` (slower, but keeps the library working).
  console.warn("[catalogue] slim select failed, falling back to content:", error.message);
  const { data: full, error: fullErr } = await supabase
    .from("tutor_lessons")
    .select("id, slug, title, level, language, duration_minutes, topic_tags, source_url, content")
    .eq("status", "published")
    .order("title");
  if (fullErr) {
    console.error("[catalogue] fallback query failed:", fullErr.message);
    return [];
  }
  return (full || []).map((r: { content: Lesson } & CatalogueRow) =>
    toCatalogue({
      ...r,
      hero_image_url: r.content?.hero_image_url,
      title_translation: r.content?.title_translation,
      section_count: r.content?.sections?.length || 0,
    })
  );
}

export async function getPublishedLessonBySlug(
  slug: string
): Promise<{ lesson: Lesson; level: string; seoIndexable: boolean } | null> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("tutor_lessons")
    .select("content, level, seo_indexable")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!error && data) {
    return {
      lesson: data.content as Lesson,
      level: data.level,
      seoIndexable: data.seo_indexable !== false,
    };
  }

  // Before the seo_indexable migration is applied the select above fails on the
  // unknown column. Fall back to the original projection so lesson pages keep
  // rendering, and treat the lesson as indexable (the pre-gate behaviour).
  const { data: legacy, error: legacyErr } = await supabase
    .from("tutor_lessons")
    .select("content, level")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (legacyErr || !legacy) return null;
  return { lesson: legacy.content as Lesson, level: legacy.level, seoIndexable: true };
}
