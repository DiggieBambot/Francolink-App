// src/app/api/games/pool/route.ts
//
// Returns a shuffled pool of vocab items (term, translation, image, audio key)
// for the kids' games to draw from. Filters to items that have an image_url
// so every game round has something to show.
//
// Query:
//   ?lang=french        (route slug — required)
//   &level=a1           (optional — defaults to all levels under the course)
//   &count=10           (optional — default 10, max 30)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { langCode } from "@/lib/utils/language";

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
  const level = url.searchParams.get("level"); // optional
  const count = Math.min(30, Math.max(4, Number(url.searchParams.get("count") || 10)));

  const code = langCode(langSlug); // e.g. "french" → "fr"

  // Look up courses for this target language (optionally filtered by level).
  let courses = admin.from("courses").select("id, language:languages(code)").eq("is_published", true);
  const { data: rawCourses, error: cErr } = await courses;
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  const courseIds = (rawCourses || [])
    .filter((c: any) => c.language?.code === code)
    .map((c: any) => c.id);
  if (courseIds.length === 0) return NextResponse.json({ pool: [] });

  // Find every lesson under those courses (optionally for the requested level).
  let unitsQ = admin.from("units").select("id, course_id").in("course_id", courseIds);
  const { data: units } = await unitsQ;
  const unitIds = (units || []).map((u: any) => u.id);
  if (unitIds.length === 0) return NextResponse.json({ pool: [] });

  let lessonsQ = admin.from("lessons").select("content, unit:units(course:courses(level))").in("unit_id", unitIds);
  const { data: lessons } = await lessonsQ;

  // Flatten + filter to items with images. We accept either `image` or
  // `image_url` since the codebase has both names in flight.
  const pool: { term: string; translation: string; image: string }[] = [];
  for (const l of (lessons || []) as Array<{ content: any; unit?: { course?: { level?: string } } }>) {
    const lessonLevel = l.unit?.course?.level?.toLowerCase();
    if (level && lessonLevel && lessonLevel !== level.toLowerCase()) continue;
    const vocab: VocabItem[] = l.content?.vocabulary || [];
    for (const v of vocab) {
      const img = v.image_url || v.image;
      if (!img || !v.term) continue;
      // Skip really long terms — bad for kids' game UI.
      if (v.term.length > 28) continue;
      pool.push({
        term: v.term,
        translation: v.translation || "",
        image: img,
      });
    }
  }

  // Dedupe by term (the same vocab word can appear in multiple lessons).
  const seen = new Set<string>();
  const deduped = pool.filter((p) => {
    const key = p.term.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Shuffle (Fisher-Yates) and take `count`.
  for (let i = deduped.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deduped[i], deduped[j]] = [deduped[j], deduped[i]];
  }

  return NextResponse.json({ pool: deduped.slice(0, count), total: deduped.length });
}
