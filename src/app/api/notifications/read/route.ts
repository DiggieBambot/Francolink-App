// POST /api/notifications/read  { id }  or  { all: true }
// Marks the caller's own notification(s) read. RLS confines updates to the caller.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id, all } = await req.json().catch(() => ({}));
  const now = new Date().toISOString();

  let query = supabase.from("notifications").update({ read_at: now }).eq("user_id", user.id).is("read_at", null);
  if (!all) {
    if (!id) return NextResponse.json({ error: "id or all is required" }, { status: 400 });
    query = query.eq("id", id);
  }

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
