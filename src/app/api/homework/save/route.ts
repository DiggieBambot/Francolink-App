// POST /api/homework/save
//   { slug, title?, instructions?, questions?, status?, enabled? }
// Staff (TUTOR/ADMIN) only. Edits an existing homework row and/or flips its
// status/enabled flags (this is how a tutor publishes + turns homework live for
// a lesson). Requires the lesson_homework row to already exist (from /generate).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { HomeworkQuestion } from "@/lib/homework/types";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function cleanQuestions(input: unknown): HomeworkQuestion[] | null {
  if (!Array.isArray(input)) return null;
  const out: HomeworkQuestion[] = [];
  for (const q of input) {
    if (!q || typeof q.prompt !== "string" || !q.prompt.trim()) continue;
    out.push({
      prompt: q.prompt.trim(),
      prompt_translation: typeof q.prompt_translation === "string" ? q.prompt_translation.trim() || undefined : undefined,
      hint: typeof q.hint === "string" ? q.hint.trim() || undefined : undefined,
      type: q.type === "long" ? "long" : "short",
    });
  }
  return out;
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

  const body = await req.json().catch(() => ({}));
  const { slug } = body;
  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.title === "string") update.title = body.title.trim() || "Homework";
  if (typeof body.instructions === "string") update.instructions = body.instructions.trim();
  if ("questions" in body) {
    const q = cleanQuestions(body.questions);
    if (!q || q.length === 0) {
      return NextResponse.json({ error: "At least one valid question is required" }, { status: 400 });
    }
    update.questions = q;
  }
  if (body.status === "draft" || body.status === "published") update.status = body.status;
  if (typeof body.enabled === "boolean") update.enabled = body.enabled;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const service = svc();
  const { data: saved, error } = await service
    .from("lesson_homework")
    .update(update)
    .eq("lesson_slug", slug)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!saved) return NextResponse.json({ error: "No homework found for this lesson. Generate it first." }, { status: 404 });

  return NextResponse.json({ homework: saved });
}
