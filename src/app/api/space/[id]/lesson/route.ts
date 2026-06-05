// POST /api/space/[id]/lesson  { lessonId }
// Either member of the space can set the current lesson. Returns ok; the client
// also broadcasts lesson:change over Realtime so both sides switch instantly.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createService } from "@supabase/supabase-js";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await req.json().catch(() => ({}));
  if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  const svc = createService(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  // The room link is the access key (Meet style): any signed-in user who has the
  // session id may set the current lesson. We only check the session exists.
  const { data: space } = await svc
    .from("tutor_lesson_sessions")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });

  const { error } = await svc
    .from("tutor_lesson_sessions")
    .update({ tutor_lesson_id: lessonId, current_section_idx: 0 })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
