// GET /api/lessons/by-slug/[slug]
// Resolves a published lesson's slug → { id, title, lesson }. Used by the in-room
// lesson browser (an iframe of /library) to load the picked lesson into the room.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("tutor_lessons")
    .select("id, title, content")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  return NextResponse.json({ id: data.id, title: data.title, lesson: data.content });
}
