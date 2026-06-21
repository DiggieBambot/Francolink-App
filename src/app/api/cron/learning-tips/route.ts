// src/app/api/cron/learning-tips/route.ts
//
// Daily drip for the "learning-tips" campaign. Vercel Cron hits this once a day
// (see vercel.json). For each eligible learner it works out which step is due
// from days-since-signup, sends at most ONE email per run, and records it so
// the next run won't repeat it.
//
// Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. The same
// header (or the Supabase service-role key) is accepted for manual triggers.
//
// Handy query params (no send unless noted):
//   ?dry=1            — compute + log who WOULD get what, send nothing
//   ?preview=3&lang=fr — return step 3's rendered HTML in the browser
//   ?test=me@x.io&step=4 — send one real email of that step to a test address
//   ?limit=50         — cap sends this run (default 200)

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendCampaignEmail } from "@/lib/email/send";
import { unsubscribeUrl } from "@/lib/email/link-token";
import {
  CAMPAIGN,
  STEPS,
  getStep,
  languageName,
  type TipArgs,
} from "@/lib/email/campaigns/learning-tips";

export const maxDuration = 300; // sends can take a while at scale
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

function firstNameOf(u: { name?: string | null; email: string }): string {
  return (u.name || u.email.split("@")[0]).split(/\s+/)[0];
}

// Skip obvious test/demo accounts so we don't burn deliverability on bounces.
function isTestAccount(u: { email?: string | null; name?: string | null }): boolean {
  const email = (u.email || "").toLowerCase();
  if (!email.includes("@")) return true;
  if (email.endsWith(".test") || email.endsWith(".local")) return true;
  if (email.endsWith("@francolink.test")) return true;
  if (/^test\d*@/.test(email)) return true;
  if (/^demo\./.test(email)) return true;
  if (/^ls_\d+_/i.test(u.name || "")) return true;
  return false;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const preview = url.searchParams.get("preview");
  const dry = url.searchParams.get("dry") === "1";
  const testEmail = url.searchParams.get("test") || undefined;
  const limit = Number(url.searchParams.get("limit")) || 200;

  // --- Browser preview: render one step, no auth, no DB, no send. -----------
  if (preview) {
    const step = getStep(Number(preview));
    if (!step) return NextResponse.json({ error: "unknown step" }, { status: 400 });
    const lang = languageName(url.searchParams.get("lang"));
    const { html } = step.render({ firstName: "Alex", lang });
    return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // --- Test send: one real email of a chosen step to a chosen address. ------
  if (testEmail) {
    const step = getStep(Number(url.searchParams.get("step")) || 1);
    if (!step) return NextResponse.json({ error: "unknown step" }, { status: 400 });
    const lang = languageName(url.searchParams.get("lang") || "fr");
    const args: TipArgs = { firstName: testEmail.split("@")[0], lang };
    const tip = step.render(args);
    const id = await sendCampaignEmail({ to: testEmail, subject: tip.subject, html: tip.html, text: tip.text });
    return NextResponse.json({ ok: true, sentTo: testEmail, step: step.step, resendId: id });
  }

  // --- Real run -------------------------------------------------------------
  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, name, role, learning_language, subscription_plan, created_at, is_active, email_marketing_opt_out")
    .eq("role", "USER")
    .eq("is_active", true)
    .eq("email_marketing_opt_out", false)
    .not("email", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pull the whole send ledger for this campaign once, index in memory.
  const { data: ledger, error: ledgerErr } = await supabase
    .from("email_campaign_sends")
    .select("user_id, step")
    .eq("campaign", CAMPAIGN);
  if (ledgerErr) return NextResponse.json({ error: ledgerErr.message }, { status: 500 });

  const sentByUser = new Map<string, Set<number>>();
  for (const row of ledger || []) {
    if (!sentByUser.has(row.user_id)) sentByUser.set(row.user_id, new Set());
    sentByUser.get(row.user_id)!.add(row.step);
  }

  const now = Date.now();
  const maxStepOffset = Math.max(...STEPS.map((s) => s.dayOffset));
  let sent = 0,
    failed = 0,
    skippedPaying = 0,
    skippedTest = 0,
    candidates = 0;
  const planned: Array<{ to: string; step: number }> = [];

  for (const u of users || []) {
    if (sent >= limit) break;
    if (isTestAccount(u)) {
      skippedTest++;
      continue;
    }
    // Tips are an acquisition/conversion tool — don't drip at paying users.
    if (u.subscription_plan && u.subscription_plan !== "FREE") {
      skippedPaying++;
      continue;
    }

    const ageDays = (now - new Date(u.created_at).getTime()) / DAY_MS;
    if (ageDays > maxStepOffset + 7) continue; // long past the sequence, leave them be

    const already = sentByUser.get(u.id) || new Set<number>();

    // Earliest unsent step whose dayOffset is now due. Send only that one.
    const due = STEPS.find((s) => s.dayOffset <= ageDays && !already.has(s.step));
    if (!due) continue;
    candidates++;

    const firstName = firstNameOf(u);
    const lang = languageName(u.learning_language);
    const unsubUrl = unsubscribeUrl(u.id, CAMPAIGN);
    const tip = due.render({ firstName, lang, unsubscribeUrl: unsubUrl });

    if (dry) {
      planned.push({ to: u.email, step: due.step });
      continue;
    }

    try {
      const resendId = await sendCampaignEmail({
        to: u.email,
        subject: tip.subject,
        html: tip.html,
        text: tip.text,
        unsubscribeUrl: unsubUrl,
      });
      // Record the send. UNIQUE(user_id, campaign, step) makes this idempotent.
      const { error: insErr } = await supabase
        .from("email_campaign_sends")
        .insert({ user_id: u.id, campaign: CAMPAIGN, step: due.step, resend_id: resendId });
      if (insErr && !insErr.message.includes("duplicate")) throw insErr;
      sent++;
    } catch (e) {
      failed++;
      console.error(`[learning-tips] failed for ${u.email}:`, (e as Error).message);
    }
  }

  return NextResponse.json({
    ok: true,
    campaign: CAMPAIGN,
    mode: dry ? "dry-run" : "live",
    candidates,
    sent,
    failed,
    skippedPaying,
    skippedTest,
    ...(dry ? { planned } : {}),
  });
}
