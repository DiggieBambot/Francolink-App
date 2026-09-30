// src/app/api/account/delete/route.ts
//
// POST { confirm: "DELETE" } → permanently deletes the signed-in student's
// account. Only ever acts on the caller's own account. See
// src/lib/account/delete-account.ts for what is deleted and what is kept.

import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { deleteStudentAccount } from "@/lib/account/delete-account";

const STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  ROLE_NOT_ALLOWED: 403,
  UPCOMING_LESSONS: 409,
  BILLING: 502,
  FAILED: 500,
};

export async function POST(request: NextRequest) {
  // Web (cookie) or mobile app (bearer token).
  const { user, supabase, via } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // The typed confirmation guards against a stray request, not just a stray click.
  const body = await request.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") {
    return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 });
  }

  const result = await deleteStudentAccount(user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.message, code: result.code }, { status: STATUS[result.code] ?? 500 });
  }

  // The login is gone or disabled; clear this browser's session cookies too.
  // (The mobile app has no cookies — it signs itself out on this response.)
  if (via === "cookie") await supabase.auth.signOut().catch(() => {});
  return NextResponse.json({ ok: true, mode: result.mode });
}
