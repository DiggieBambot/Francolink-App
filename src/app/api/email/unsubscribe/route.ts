// src/app/api/email/unsubscribe/route.ts
//
// One-click unsubscribe target for campaign email footers and the
// List-Unsubscribe header. Verifies the HMAC token, flips
// users.email_marketing_opt_out = true, and shows a tiny confirmation page.
//
// GET  — user clicked the footer link (renders a page).
// POST — Gmail/Yahoo one-click (List-Unsubscribe-Post), returns 200.

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifyLinkToken } from "@/lib/email/link-token";

export const dynamic = "force-dynamic";

async function optOut(req: Request): Promise<boolean> {
  const url = new URL(req.url);
  const userId = url.searchParams.get("u") || "";
  const campaign = url.searchParams.get("c") || "";
  const token = url.searchParams.get("t") || "";

  if (!userId || !campaign || !verifyLinkToken(userId, campaign, token)) return false;

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error } = await supabase
    .from("users")
    .update({ email_marketing_opt_out: true })
    .eq("id", userId);
  return !error;
}

function page(ok: boolean): NextResponse {
  const body = ok
    ? `<h1>You're unsubscribed</h1><p>You won't get any more learning tips from Francolink. You can still receive account email (receipts, password resets).</p>`
    : `<h1>Link expired</h1><p>We couldn't process that unsubscribe link. Reply to any of our emails and we'll remove you manually.</p>`;
  return new NextResponse(
    `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:520px;margin:64px auto;padding:0 24px;color:#1a1a1a;line-height:1.55;">
      <div style="font-weight:800;font-size:20px;color:#0f2744;margin-bottom:24px;">francolink.</div>
      ${body}
    </body></html>`,
    { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: Request) {
  return page(await optOut(req));
}

export async function POST(req: Request) {
  const ok = await optOut(req);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
