// POST /api/space/[id]/chat   { text, name, role }
// Persists one chat message for the room. The room link is the access key
// (Meet-style), so any signed-in user in the session may post — we authorize by
// "logged in + session exists" via the service role, bypassing the member-only
// RLS that would block a link-joined student.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createService } from "@supabase/supabase-js";

const RETENTION_DAYS = 30;

function svc() {
  return createService(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, name, role } = await req.json().catch(() => ({}));
  const clean = (text || "").toString().trim();
  if (!clean) return NextResponse.json({ error: "text required" }, { status: 400 });

  const service = svc();
  const { data: space } = await service
    .from("tutor_lesson_sessions")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });

  const { error } = await service.from("tutor_lesson_messages").insert({
    session_id: id,
    sender_id: user.id,
    sender_name: (name || "").toString().slice(0, 80) || null,
    sender_role: role === "tutor" ? "tutor" : "student",
    text: clean.slice(0, 4000),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Opportunistic retention sweep: drop anything older than 30 days for this room.
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400_000).toISOString();
  void service.from("tutor_lesson_messages").delete().eq("session_id", id).lt("created_at", cutoff);

  return NextResponse.json({ ok: true });
}
