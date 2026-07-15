// POST /api/homework/generate  { slug }
// Staff (TUTOR/ADMIN) only. Generates an AI homework DRAFT from a published
// library lesson and upserts it into lesson_homework (status 'draft', not
// enabled). The tutor then edits + publishes it via /api/homework/save.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { generateHomeworkDraft } from "@/lib/homework/generate";
import type { Lesson } from "@/lib/lessons/types";

export const maxDuration = 60;

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const role = (me?.role || "").toUpperCase();
  if (role !== "TUTOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Staff only" }, { status: 403 });
  }

  const { slug } = await req.json().catch(() => ({}));
  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });

  const service = svc();
  const { data: lessonRow, error: lErr } = await service
    .from("tutor_lessons")
    .select("id, slug, content")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (lErr || !lessonRow) {
    return NextResponse.json({ error: "Published lesson not found" }, { status: 404 });
  }

  let draft;
  try {
    draft = await generateHomeworkDraft(lessonRow.content as Lesson);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  const { data: saved, error: upErr } = await service
    .from("lesson_homework")
    .upsert(
      {
        lesson_id: lessonRow.id,
        lesson_slug: lessonRow.slug,
        title: draft.title,
        instructions: draft.instructions,
        questions: draft.questions,
        status: "draft",
        created_by: user.id,
      },
      { onConflict: "lesson_id" }
    )
    .select()
    .single();
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ homework: saved });
}
