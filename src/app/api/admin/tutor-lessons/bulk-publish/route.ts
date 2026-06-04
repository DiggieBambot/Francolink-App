// Bulk-publish tutor lessons. POST { from?: status, level?: string }
// Moves all matching review/draft lessons to published.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const from: string = body?.from || "review";
  const level: string | undefined = body?.level;

  let q = supabase
    .from("tutor_lessons")
    .update({
      status: "published",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    })
    .eq("status", from);
  if (level) q = q.eq("level", level);

  const { data, error } = await q.select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, published: data?.length ?? 0 });
}
