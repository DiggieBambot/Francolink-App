// Daily: end hand-granted Premium whose end date has passed.
//
// The lesson paywall only reads users.subscription_plan, so a grant does not
// end by itself. This job marks lapsed premium_grants rows expired and puts the
// learner back on FREE, unless they have since started paying (Stripe, Google
// Play, a lesson plan) or hold another unexpired grant. Idempotent.
//
// Query params:
//   ?dry=1 — report how many grants are due, change nothing

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { expireDueGrants } from "@/lib/billing/premium-grants";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return (
    (!!process.env.CRON_SECRET && token === process.env.CRON_SECRET) ||
    (!!process.env.SUPABASE_SERVICE_ROLE_KEY &&
      token === process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(req.url).searchParams.get("dry") === "1";
  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const result = await expireDueGrants(db, { dryRun });
  console.log(`[cron/expire-grants] ${JSON.stringify({ dryRun, ...result })}`);
  return NextResponse.json({ ok: true, dryRun, ...result });
}
