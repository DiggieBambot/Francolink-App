// GET /api/lessons/[id] → published lesson content (for live in-room switching).
// PATCH /api/space/[id]/lesson is handled separately.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createService } from "@supabase/supabase-js";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  // Must be logged in (any role) to pull lesson content into a room.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createService(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await svc
    .from("tutor_lessons")
    .select("content, level, title, slug")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lesson: data.content, level: data.level, title: data.title, slug: data.slug });
}
