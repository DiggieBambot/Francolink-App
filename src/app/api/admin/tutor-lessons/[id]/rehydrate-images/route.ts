// Re-run image hydration on an existing tutor_lessons row without touching
// Gemini. Useful when an earlier import skipped images (silent hydration
// failure, missing API key at the time, etc).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
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

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const auth = await assertAdmin();
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: row, error: fetchErr } = await supabase
    .from("tutor_lessons")
    .select("id, content")
    .eq("id", id)
    .single();
  if (fetchErr || !row) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const lesson = row.content as Lesson;
  try {
    const result = await hydrateImages(lesson);
    const { error: updateErr } = await supabase
      .from("tutor_lessons")
      .update({ content: lesson })
      .eq("id", id);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, stats: result.stats });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
