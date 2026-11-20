// Daily run of the free-sample sequence (lib/email/campaigns/workbook-sample).
//
// For each lead still in the sequence: stop if they have since bought the
// workbook, otherwise send the next email once its gap has passed. At most
// one email per lead per run. Triggered by .github/workflows/workbook-sequence-cron.yml.
//
// Handy query params:
//   ?preview=2            — render step 2 in the browser (no auth, no send)
//   ?dry=1                — log who WOULD get what, send nothing
//   ?test=me@x.io&step=1  — send one real email of that step to a test address
//   ?limit=100            — cap sends this run (default 300)

import { NextResponse } from "next/server";
import { sendCampaignEmail } from "@/lib/email/send";
import { service } from "@/lib/workbook/files";
import { STEPS, leadUnsubscribeUrl } from "@/lib/email/campaigns/workbook-sample";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function authorized(req: Request): boolean {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return (
    (!!process.env.CRON_SECRET && token === process.env.CRON_SECRET) ||
    (!!process.env.SUPABASE_SERVICE_ROLE_KEY && token === process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

/** Demo and test addresses: never mailed, so bounces don't hurt deliverability. */
function isTestAddress(email: string): boolean {
  return (
    email.endsWith(".test") ||
    email.endsWith(".local") ||
    email.endsWith("@demo.francolink.net") ||
    /^test\d*@/.test(email)
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const preview = url.searchParams.get("preview");

  if (preview !== null) {
    const step = STEPS[Number(preview)];
    if (!step) return NextResponse.json({ error: "unknown step" }, { status: 400 });
    const { html } = step.render({ firstName: "Alex", unsubscribeUrl: "#" });
    return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testEmail = url.searchParams.get("test");
  if (testEmail) {
    const step = STEPS[Number(url.searchParams.get("step") ?? "0")];
    if (!step) return NextResponse.json({ error: "unknown step" }, { status: 400 });
    const { subject, html, text } = step.render({
      firstName: testEmail.split("@")[0],
      unsubscribeUrl: "#",
    });
    const id = await sendCampaignEmail({ to: testEmail, subject: `[TEST] ${subject}`, html, text });
    return NextResponse.json({ ok: true, id });
  }

  const dry = url.searchParams.get("dry") === "1";
  const limit = Number(url.searchParams.get("limit")) || 300;
  const db = service();

  const { data: leads, error } = await db
    .from("workbook_leads")
    .select("id, email, step, last_sent_at, created_at")
    .is("unsubscribed_at", null)
    .is("converted_at", null)
    .lt("step", STEPS.length)
    .order("created_at", { ascending: true })
    .limit(2000);
  if (error) {
    console.error("[cron/workbook-sequence] lead query failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Who has bought since signing up. Matched in lower case: Stripe keeps the
  // address as typed, leads are stored lower-cased.
  const since = leads?.[0]?.created_at ?? new Date().toISOString();
  const { data: orders } = await db
    .from("digital_orders")
    .select("email, digital_order_items(product_key)")
    .eq("status", "paid")
    .gte("created_at", since);
  const buyers = new Set(
    (orders ?? [])
      .filter((o) =>
        ((o.digital_order_items ?? []) as { product_key: string }[]).some(
          (i) => i.product_key === "workbook_fpp"
        )
      )
      .map((o) => (o.email as string).toLowerCase())
  );

  const now = Date.now();
  let sent = 0, converted = 0, skipped = 0, failed = 0;
  const plan: { email: string; step: number }[] = [];

  for (const lead of leads ?? []) {
    if (sent >= limit) break;
    const email = (lead.email as string).toLowerCase();

    if (buyers.has(email)) {
      converted++;
      if (!dry) {
        await db.from("workbook_leads")
          .update({ converted_at: new Date().toISOString() })
          .eq("id", lead.id);
      }
      continue;
    }
    if (isTestAddress(email)) { skipped++; continue; }

    const step = STEPS[lead.step];
    const last = lead.last_sent_at ? new Date(lead.last_sent_at).getTime() : 0;
    if (lead.step > 0 && now - last < step.afterDays * DAY_MS - 60 * 60 * 1000) continue;

    plan.push({ email, step: lead.step });
    if (dry) { sent++; continue; }

    try {
      const unsub = leadUnsubscribeUrl(lead.id);
      const { subject, html, text } = step.render({
        firstName: email.split("@")[0],
        unsubscribeUrl: unsub,
      });
      await sendCampaignEmail({ to: email, subject, html, text, unsubscribeUrl: unsub });
      await db.from("workbook_leads")
        .update({ step: lead.step + 1, last_sent_at: new Date().toISOString() })
        .eq("id", lead.id);
      sent++;
    } catch (e) {
      failed++;
      console.error("[cron/workbook-sequence] send failed", lead.id, (e as Error).message);
    }
  }

  console.log("[cron/workbook-sequence]", { dry, sent, converted, skipped, failed });
  return NextResponse.json({ ok: true, dry, sent, converted, skipped, failed, ...(dry ? { plan } : {}) });
}
