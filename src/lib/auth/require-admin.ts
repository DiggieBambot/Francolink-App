// Guard for API routes that run with the service role and have no business
// being reachable by the public.
//
// These routes bypass RLS entirely, so the check here is the only thing
// standing between a stranger's curl and the database. Two ways in:
//
//   1. A signed-in ADMIN — how a human triggers these from a browser.
//   2. CRON_SECRET — how a script or a deploy step triggers them with no
//      session. Same secret /api/seed/fr-grammar already uses, so there is no
//      new env var to set.
//
// If CRON_SECRET is unset, only route 1 works. That is deliberate: a missing
// secret must never mean "let everyone in".

import { NextRequest, NextResponse } from "next/server";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";

/**
 * Returns a 404 response if the caller isn't allowed, or null if they are.
 *
 * 404 rather than 403 on purpose — an unauthenticated prober shouldn't learn
 * that a destructive endpoint exists here at all.
 */
export async function requireAdminOrSecret(request: NextRequest): Promise<NextResponse | null> {
  const secret = process.env.CRON_SECRET;
  // Header first. `?secret=` is accepted because fr-grammar established it and
  // existing scripts use it, but it ends up in access logs and browser history,
  // so the header is what new callers should send.
  const presented =
    request.headers.get("x-admin-secret") || new URL(request.url).searchParams.get("secret");

  if (secret && presented && timingSafeEqual(presented, secret)) return null;

  const me = await getDashboardUser().catch(() => null);
  if (isAdmin(me)) return null;

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

/** Constant-time compare, so a wrong secret can't be found a byte at a time. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
