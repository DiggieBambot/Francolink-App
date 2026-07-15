// GET /api/notifications — the caller's own in-app notifications + unread count.
// RLS restricts rows to the caller, so the SSR client is enough.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, url, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = data || [];
  const unread = items.filter((n) => !n.read_at).length;
  return NextResponse.json({ items, unread });
}
