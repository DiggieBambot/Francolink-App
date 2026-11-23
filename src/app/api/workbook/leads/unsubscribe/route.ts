// One-click unsubscribe from the free-sample sequence.
//
// Leads have no account, so the users.email_marketing_opt_out flag the other
// campaigns use cannot reach them. Same HMAC link scheme, keyed on the lead id.
//
// GET  — the footer link (renders a page).
// POST — Gmail/Yahoo one-click (List-Unsubscribe-Post), returns 200.

import { NextResponse } from "next/server";
import { verifyLinkToken } from "@/lib/email/link-token";
import { service } from "@/lib/workbook/files";
import { CAMPAIGN } from "@/lib/email/campaigns/workbook-sample";

export const dynamic = "force-dynamic";

async function optOut(req: Request): Promise<boolean> {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("l") || "";
  const token = url.searchParams.get("t") || "";
  if (!leadId || !verifyLinkToken(leadId, CAMPAIGN, token)) return false;

  const { error } = await service()
    .from("workbook_leads")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", leadId);
  return !error;
}

function page(ok: boolean): NextResponse {
  const body = ok
    ? `<h1>You're unsubscribed</h1><p>You won't get any more emails about the workbook. Keep the sample: it's yours.</p>`
    : `<h1>Link expired</h1><p>We couldn't process that unsubscribe link. Reply to any of our emails and we'll remove you by hand.</p>`;
  return new NextResponse(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"></head><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:520px;margin:64px auto;padding:0 24px;color:#1a1a1a;line-height:1.55;">
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
