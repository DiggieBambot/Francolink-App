// src/app/api/games/themes/route.ts
//
// Returns the list of vocabulary themes for the requested language, each with
// a real count of game-eligible items (term + image + classified into theme).
// Themes with fewer than MIN_ITEMS are hidden so we don't show a card for a
// game that would fail to start.
//
// Query:
//   ?lang=french        (route slug — required)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { langCode } from "@/lib/utils/language";
import { THEMES, classifyVocab } from "@/lib/games/themes";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Memory Match uses 6 pairs — we need at least that many words in a theme.
const MIN_ITEMS = 6;

type VocabItem = {
  term?: string;
  translation?: string;
  image?: string;
  image_url?: string;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const langSlug = url.searchParams.get("lang") || "french";
  const code = langCode(langSlug);

  const { data: rawCourses, error: cErr } = await admin
    .from("courses")
    .select("id, language:languages(code)")
    .eq("is_published", true);
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  const courseIds = (rawCourses || [])
    .filter((c: any) => c.language?.code === code)
    .map((c: any) => c.id);
  if (courseIds.length === 0) return NextResponse.json({ themes: [] });

  const { data: units } = await admin.from("units").select("id").in("course_id", courseIds);
  const unitIds = (units || []).map((u: any) => u.id);
  if (unitIds.length === 0) return NextResponse.json({ themes: [] });

  const { data: lessons } = await admin.from("lessons").select("content").in("unit_id", unitIds);

  const counts: Record<string, number> = {};
  const seenTermsByTheme: Record<string, Set<string>> = {};
  for (const l of (lessons || []) as Array<{ content: any }>) {
    const vocab: VocabItem[] = l.content?.vocabulary || [];
    for (const v of vocab) {
      const img = v.image_url || v.image;
      if (!img || !v.term) continue;
      if (v.term.length > 28) continue;
      const slug = classifyVocab(v.translation);
      if (!slug) continue;
      const key = v.term.toLowerCase().trim();
      if (!seenTermsByTheme[slug]) seenTermsByTheme[slug] = new Set();
      if (seenTermsByTheme[slug].has(key)) continue;
      seenTermsByTheme[slug].add(key);
      counts[slug] = (counts[slug] || 0) + 1;
    }
  }

  const result = THEMES
    .map((t) => ({ slug: t.slug, label: t.label, emoji: t.emoji, gradient: t.gradient, count: counts[t.slug] || 0 }))
    .filter((t) => t.count >= MIN_ITEMS)
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ themes: result });
}
