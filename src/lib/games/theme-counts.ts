// src/lib/games/theme-counts.ts
//
// Shared theme-counting for the games lobby and the themes API.
//
// A theme's eligible-word count is `max(curatedCount, lessonCount)` so that a
// fully curated theme is shown even when the lessons happen to contain fewer
// (or no) classified, image-bearing words for it. Curated sets are French
// terms, so they only contribute for the French course — matching the gate in
// pool/route.ts. Themes with fewer than MIN_ITEMS are hidden, since Memory
// Match needs 6 pairs.
//
// Extracted from src/app/(student)/learn/[language]/games/page.tsx and
// src/app/api/games/themes/route.ts, which had previously duplicated this
// logic and both ignored curated sets (the lobby bug).

import { createClient } from "@supabase/supabase-js";
import { langCode } from "@/lib/utils/language";
import { THEMES, classifyVocab } from "./themes";
import { curatedPool } from "./curated";

// Memory Match uses 6 pairs — we need at least that many words in a theme.
export const MIN_ITEMS = 6;

export interface ThemeCount {
  slug: string;
  label: string;
  emoji: string;
  gradient: string;
  count: number;
}

type VocabItem = {
  term?: string;
  translation?: string;
  image?: string;
  image_url?: string;
};

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Lesson-derived counts: scans every published lesson's content.vocabulary for
// the given language, classifies each item into a theme, and dedupes by term.
async function lessonCounts(langCode: string): Promise<Record<string, number>> {
  const { data: rawCourses } = await admin
    .from("courses")
    .select("id, language:languages(code)")
    .eq("is_published", true);
  const courseIds = (rawCourses || [])
    .filter((c: any) => c.language?.code === langCode)
    .map((c: any) => c.id);
  if (courseIds.length === 0) return {};

  const { data: units } = await admin.from("units").select("id").in("course_id", courseIds);
  const unitIds = (units || []).map((u: any) => u.id);
  if (unitIds.length === 0) return {};

  const { data: lessons } = await admin.from("lessons").select("content").in("unit_id", unitIds);

  const counts: Record<string, number> = {};
  const seen: Record<string, Set<string>> = {};
  for (const l of (lessons || []) as Array<{ content: any }>) {
    const vocab: VocabItem[] = l.content?.vocabulary || [];
    for (const v of vocab) {
      const img = v.image_url || v.image;
      if (!img || !v.term) continue;
      if (v.term.length > 28) continue;
      const slug = classifyVocab(v.translation);
      if (!slug) continue;
      const key = v.term.toLowerCase().trim();
      if (!seen[slug]) seen[slug] = new Set();
      if (seen[slug].has(key)) continue;
      seen[slug].add(key);
      counts[slug] = (counts[slug] || 0) + 1;
    }
  }
  return counts;
}

// Count of curated items per theme, for French only.
function curatedCounts(isFrench: boolean): Record<string, number> {
  if (!isFrench) return {};
  const counts: Record<string, number> = {};
  for (const t of THEMES) {
    const curated = curatedPool(t.slug);
    if (curated) counts[t.slug] = curated.length;
  }
  return counts;
}

// Eligible theme list for a language route slug, with `count` already filtered
// to MIN_ITEMS and sorted by count desc. This is what both the lobby page and
// the themes API return.
export async function getThemeCounts(langSlug: string): Promise<ThemeCount[]> {
  const code = langCode(langSlug);
  const [fromLessons, fromCurated] = await Promise.all([
    lessonCounts(code),
    curatedCounts(code === "fr"),
  ]);

  return THEMES
    .map((t) => ({
      slug: t.slug,
      label: t.label,
      emoji: t.emoji,
      gradient: t.gradient,
      count: Math.max(fromLessons[t.slug] || 0, fromCurated[t.slug] || 0),
    }))
    .filter((t) => t.count >= MIN_ITEMS)
    .sort((a, b) => b.count - a.count);
}
