// Re-fetch the source doc + re-run Gemini + repair + rehydrate. Use when a
// lesson was imported by an older prompt and you want the new fields
// (image_query, learning_tips, reading_comprehension, etc.) regenerated.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  fetchDocText,
  geminiConvert,
  repairWordOrder,
  repairFillBlanks,
  validateLesson,
  GOOGLE_DOC_MIME,
  DOCX_MIME,
} from "@/lib/lessons/convert";
import { hydrateImages } from "@/lib/lessons/hydrate-images";
import type { Lesson } from "@/lib/lessons/types";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 } as const;
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "ADMIN") return { error: "Forbidden", status: 403 } as const;
  return { ok: true as const };
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await assertAdmin();
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: row, error } = await supabase
    .from("tutor_lessons")
    .select("id, source_doc_id, content")
    .eq("id", id)
    .single();
  if (error || !row) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  if (!row.source_doc_id) {
    return NextResponse.json(
      { error: "Lesson has no source_doc_id — cannot re-fetch from Drive." },
      { status: 400 }
    );
  }

  try {
    // Try Google Doc export first; if it fails, fall back to .docx.
    let text: string;
    try {
      text = await fetchDocText(row.source_doc_id, GOOGLE_DOC_MIME);
    } catch {
      text = await fetchDocText(row.source_doc_id, DOCX_MIME);
    }

    const lesson: Lesson = await geminiConvert(text);
    repairWordOrder(lesson);
    repairFillBlanks(lesson);
    try {
      await hydrateImages(lesson);
    } catch (err) {
      console.warn("[reconvert] hydration error:", err instanceof Error ? err.message : err);
    }

    const issues = validateLesson(lesson);
    const updated = {
      slug: lesson.slug,
      title: lesson.title,
      language: lesson.language || "fr",
      level: lesson.level,
      duration_minutes: lesson.duration_minutes || null,
      topic_tags: Array.isArray(lesson.topic_tags) ? lesson.topic_tags : [],
      content: lesson,
      conversion_notes: issues.length ? issues.join("; ") : null,
    };

    const { error: updErr } = await supabase
      .from("tutor_lessons")
      .update(updated)
      .eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      slug: lesson.slug,
      sections: lesson.sections.length,
      issues: issues.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
