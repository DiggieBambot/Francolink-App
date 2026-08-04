// GET /api/student/live-invite
// Returns the caller's most recent *unread* live-class invite, if it's still
// fresh and the room is still active. Polled by <LiveInviteWatcher/> so a
// student sitting on their dashboard sees the class pop up without a refresh.
//
//   { invite: null } | { invite: { id, roomId, title, body, url } }

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { LIVE_INVITE_TYPE } from "@/lib/notifications/live-invite";

export const dynamic = "force-dynamic";

/** An invite older than this is stale — the tutor isn't waiting any more. */
const FRESH_MS = 30 * 60 * 1000;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ invite: null }, { status: 401 });

  const since = new Date(Date.now() - FRESH_MS).toISOString();
  const { data: row } = await supabase
    .from("notifications")
    .select("id, title, body, url, created_at")
    .eq("user_id", user.id)
    .eq("type", LIVE_INVITE_TYPE)
    .is("read_at", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row?.url) return NextResponse.json({ invite: null });

  const roomId = row.url.split("/room/")[1]?.split(/[/?#]/)[0];
  if (!roomId) return NextResponse.json({ invite: null });

  // Don't nag about a room the tutor already closed. Service client: a student
  // who hasn't joined yet isn't an RLS member of the session row.
  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: session } = await svc
    .from("tutor_lesson_sessions")
    .select("id, status")
    .eq("id", roomId)
    .maybeSingle();

  if (!session || session.status === "ended") {
    return NextResponse.json({ invite: null });
  }

  return NextResponse.json({
    invite: {
      id: row.id,
      roomId,
      title: row.title,
      body: row.body || "",
      url: row.url,
    },
  });
}
