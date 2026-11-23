// GET /api/messages — my conversations (plus connected people I haven't
// messaged yet), with unread counts. Works with cookies or a Bearer token.

import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { listConversations, MessagingNotSetUpError } from "@/lib/messages/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { user } = await getRequestAuth(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    const conversations = await listConversations(user.id);
    const totalUnread = conversations.reduce((n, c) => n + c.unread, 0);
    return NextResponse.json({ conversations, totalUnread });
  } catch (e) {
    if (e instanceof MessagingNotSetUpError) {
      return NextResponse.json({ setupRequired: true, conversations: [], totalUnread: 0 });
    }
    console.error("[messages] list failed:", (e as Error).message);
    return NextResponse.json({ error: "Couldn't load messages." }, { status: 500 });
  }
}
