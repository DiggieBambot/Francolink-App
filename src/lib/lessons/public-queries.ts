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
  };
}

// Slim projection — reads scalar columns instead of the whole `content` JSON.
const CATALOGUE_COLS =
  "id, slug, title, level, language, duration_minutes, topic_tags, source_url, hero_image_url, title_translation, section_count";

export async function getPublishedLessons(): Promise<CatalogueLesson[]> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("tutor_lessons")
    .select(CATALOGUE_COLS)
    .eq("status", "published")
    .order("title");

  if (!error) return (data as CatalogueRow[]).map(toCatalogue);

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

export async function getPublishedLessonBySlug(slug: string): Promise<{ lesson: Lesson; level: string } | null> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("tutor_lessons")
    .select("content, level")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return { lesson: data.content as Lesson, level: data.level };
}
