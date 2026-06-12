// Batch-hydrate images for all lessons of a given language.
// POST /api/admin/tutor-lessons/batch-hydrate?language=en&limit=10
//
// Runs hydrateImages on each lesson that lacks images, saves back to DB.
// Returns progress stats. Call repeatedly with limit to page through.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { hydrateImages } from "@/lib/lessons/hydrate-images";
import type { Lesson } from "@/lib/lessons/types";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 } as const;
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "ADMIN")
    return { error: "Forbidden", status: 403 } as const;
  return { ok: true as const };
}

export async function POST(req: Request) {
  const auth = await assertAdmin();
  if (!("ok" in auth))
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const language = url.searchParams.get("language") || "en";
  const limit = Math.min(Number(url.searchParams.get("limit") || "10"), 50);
  const offset = Number(url.searchParams.get("offset") || "0");

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch lessons that need images
  const { data: rows, error: fetchErr } = await supabase
    .from("tutor_lessons")
    .select("id, slug, content")
    .eq("language", language)
    .eq("status", "published")
    .order("slug")
    .range(offset, offset + limit - 1);

  if (fetchErr || !rows) {
    return NextResponse.json(
      { error: fetchErr?.message || "No rows" },
      { status: 500 }
    );
  }

  const results: Array<{
    slug: string;
    status: "ok" | "skip" | "error";
    stats?: any;
    error?: string;
  }> = [];

  for (const row of rows) {
    const lesson = row.content as Lesson;

    // Skip if already hydrated
    const hasHero = lesson.hero_image_url?.includes("lesson-images");
    const vocabSections = lesson.sections.filter(
      (s: any) =>
        s.kind === "warmup_vocabulary" || s.kind === "vocabulary_with_examples"
    );
    const vocabImages = vocabSections
      .flatMap((s: any) => s.items || [])
      .filter((i: any) => i.image_url?.includes("lesson-images"));

    if (hasHero && vocabImages.length > 0) {
      results.push({ slug: row.slug, status: "skip" });
      continue;
    }

    try {
      const result = await hydrateImages(lesson, { shareVocabBucket: true });

      const { error: updateErr } = await supabase
        .from("tutor_lessons")
        .update({ content: lesson })
        .eq("id", row.id);

      if (updateErr) {
        results.push({
          slug: row.slug,
          status: "error",
          error: updateErr.message,
        });
      } else {
        results.push({ slug: row.slug, status: "ok", stats: result.stats });
      }
    } catch (err) {
      results.push({
        slug: row.slug,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const ok = results.filter((r) => r.status === "ok").length;
  const skipped = results.filter((r) => r.status === "skip").length;
  const errored = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    language,
    offset,
    limit,
    fetched: rows.length,
    ok,
    skipped,
    errored,
    nextOffset: rows.length === limit ? offset + limit : null,
    results,
  });
}
