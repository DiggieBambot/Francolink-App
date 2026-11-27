// GET /api/messages/unread — { count } of unread messages, for nav badges.
// Returns 0 (not an error) before the messaging migration has been run.

import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { totalUnread } from "@/lib/messages/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { user } = await getRequestAuth(req);
  if (!user) return NextResponse.json({ count: 0 }, { status: 401 });
  try {
    return NextResponse.json({ count: await totalUnread(user.id) });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
