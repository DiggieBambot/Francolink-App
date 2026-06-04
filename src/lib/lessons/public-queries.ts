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

function toCatalogue(row: {
  id: string;
  slug: string;
  title: string;
  level: string;
  language: string;
  duration_minutes: number | null;
  topic_tags: string[];
  source_url: string | null;
  content: Lesson;
}): CatalogueLesson {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    title_translation: row.content?.title_translation,
    level: row.level,
    language: row.language,
    duration_minutes: row.duration_minutes,
    topic_tags: row.topic_tags || [],
    category: categoryForLesson(row.source_url, row.topic_tags),
    hero_image_url: row.content?.hero_image_url,
    section_count: row.content?.sections?.length || 0,
  };
}

export async function getPublishedLessons(): Promise<CatalogueLesson[]> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("tutor_lessons")
    .select("id, slug, title, level, language, duration_minutes, topic_tags, source_url, content")
    .eq("status", "published")
    .order("title");
  if (error) {
    console.error("[catalogue] query failed:", error.message);
    return [];
  }
  return (data || []).map(toCatalogue);
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
