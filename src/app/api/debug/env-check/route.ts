// GET /api/debug/env-check — reports which env vars the deployed function can
// see (presence + length ONLY, never values). Service-role bearer required.
// Temporary diagnostic for the Vercel email env issue.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY && token === process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const peek = (v?: string) => ({ present: !!v, length: v ? v.length : 0 });
  return NextResponse.json({
    RESEND_API_KEY: peek(process.env.RESEND_API_KEY),
    CRON_SECRET: peek(process.env.CRON_SECRET),
    NEXT_PUBLIC_SUPABASE_URL: peek(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: peek(process.env.SUPABASE_SERVICE_ROLE_KEY),
    VAPID_PRIVATE_KEY: peek(process.env.VAPID_PRIVATE_KEY),
    nodeEnv: process.env.NODE_ENV,
  });
}
