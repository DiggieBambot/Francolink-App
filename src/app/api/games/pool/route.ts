// src/app/api/games/pool/route.ts
//
// Returns a shuffled pool of vocab items (term, translation, image) for the
// kids' games to draw from. Filters to items that have an image_url so every
// game round has something to show, and optionally to a single theme.
//
// Query:
//   ?lang=french        (route slug — required)
//   ?theme=food         (theme slug — required; see src/lib/games/themes.ts)
//   &count=10           (optional — default 10, max 30)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { langCode } from "@/lib/utils/language";
import { classifyVocab, themeBySlug } from "@/lib/games/themes";

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

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const langSlug = url.searchParams.get("lang") || "french";
  const themeSlug = url.searchParams.get("theme");
  const count = Math.min(30, Math.max(4, Number(url.searchParams.get("count") || 10)));

  if (!themeSlug || !themeBySlug(themeSlug)) {
    return NextResponse.json({ pool: [], error: "Unknown or missing theme" }, { status: 400 });
  }

  const code = langCode(langSlug);

  const { data: rawCourses, error: cErr } = await admin
    .from("courses")
    .select("id, language:languages(code)")
    .eq("is_published", true);
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  const courseIds = (rawCourses || [])
    .filter((c: any) => c.language?.code === code)
    .map((c: any) => c.id);
  if (courseIds.length === 0) return NextResponse.json({ pool: [] });

  const { data: units } = await admin.from("units").select("id").in("course_id", courseIds);
  const unitIds = (units || []).map((u: any) => u.id);
  if (unitIds.length === 0) return NextResponse.json({ pool: [] });

  const { data: lessons } = await admin.from("lessons").select("content").in("unit_id", unitIds);

  const pool: { term: string; translation: string; image: string }[] = [];
  for (const l of (lessons || []) as Array<{ content: any }>) {
    const vocab: VocabItem[] = l.content?.vocabulary || [];
    for (const v of vocab) {
      const img = v.image_url || v.image;
      if (!img || !v.term) continue;
      if (v.term.length > 28) continue;
      if (classifyVocab(v.translation) !== themeSlug) continue;
      pool.push({
        term: v.term,
        translation: v.translation || "",
        image: img,
      });
    }
  }

  // Dedupe by term.
  const seen = new Set<string>();
  const deduped = pool.filter((p) => {
    const key = p.term.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Fisher-Yates shuffle.
  for (let i = deduped.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deduped[i], deduped[j]] = [deduped[j], deduped[i]];
  }

  return NextResponse.json({ pool: deduped.slice(0, count), total: deduped.length });
}
