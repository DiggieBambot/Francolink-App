// Engagement campaign cron. Scheduled ~3x/week (see vercel.json). For each
// eligible learner it picks the single most relevant nudge from their activity
// signals, respects opt-out, and frequency-caps so nobody is over-emailed.
//
// Query params:
//   ?dry=1                — compute + return who WOULD get what, send nothing
//   ?preview=winback&lang=fr — render one message type in the browser (no auth)
//   ?test=me@x.io&type=streak — send one real message to a test address
//   ?limit=200            — cap sends this run

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendCampaignEmail } from "@/lib/email/send";
import { unsubscribeUrl } from "@/lib/email/link-token";
import { languageName } from "@/lib/email/campaigns/learning-tips";
import { CAMPAIGN, pickMessage, render, type MessageType, type UserSignals } from "@/lib/email/campaigns/engagement";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const DAY = 86400_000;
const MIN_GAP_MS = 36 * 3600_000;    // never two engagement emails within 36h
const MAX_PER_7D = 3;                 // at most 3 engagement emails per rolling week

function svc() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function authorized(req: Request): boolean {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  return (
    (!!process.env.CRON_SECRET && token === process.env.CRON_SECRET) ||
    (!!process.env.SUPABASE_SERVICE_ROLE_KEY && token === process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

function isTestAccount(u: { email?: string | null; name?: string | null }): boolean {
  const email = (u.email || "").toLowerCase();
  if (!email.includes("@")) return true;
  if (/\.(test|local)$/.test(email) || email.endsWith("@example.com")) return true;
  if (/^test\d*@/.test(email)) return true;
  return false;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const preview = url.searchParams.get("preview") as MessageType | null;
  const dry = url.searchParams.get("dry") === "1";
  const testEmail = url.searchParams.get("test") || undefined;
  const limit = Number(url.searchParams.get("limit")) || 300;

  // --- Browser preview: render one message, no auth/DB/send ------------------
  if (preview) {
    const lang = languageName(url.searchParams.get("lang"));
    const { html } = render(preview, {
      firstName: "Alex", lang, daysSinceSeen: 5, streak: 4, hasPendingHomework: preview === "homework",
    });
    return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const s = svc();

  // --- Test send ------------------------------------------------------------
  if (testEmail) {
    const type = (url.searchParams.get("type") as MessageType) || "nudge";
    const lang = languageName(url.searchParams.get("lang") || "fr");
    const sig: UserSignals = { firstName: testEmail.split("@")[0], lang, daysSinceSeen: 5, streak: 4, hasPendingHomework: type === "homework" };
    const m = render(type, sig);
    const id = await sendCampaignEmail({ to: testEmail, subject: m.subject, html: m.html, text: m.text });
    return NextResponse.json({ ok: true, sentTo: testEmail, type, resendId: id });
  }

  // --- Real run -------------------------------------------------------------
  const { data: users, error } = await s
    .from("users")
    .select("id, email, name, learning_language, current_streak, last_seen_at, is_active, email_marketing_opt_out")
    .eq("role", "USER")
    .eq("is_active", true)
    .eq("email_marketing_opt_out", false)
    .not("email", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pending homework per student (assigned but not submitted).
  const [{ data: assigns }, { data: subs }, { data: ledger }] = await Promise.all([
    s.from("homework_assignments").select("student_id, homework_id"),
    s.from("homework_submissions").select("student_id, homework_id"),
    s.from("email_campaign_sends").select("user_id, sent_at").eq("campaign", CAMPAIGN).gte("sent_at", new Date(Date.now() - 8 * DAY).toISOString()),
  ]);
  const submitted = new Set((subs || []).map((r) => `${r.student_id}:${r.homework_id}`));
  const pendingBy = new Set<string>();
  for (const a of assigns || []) if (!submitted.has(`${a.student_id}:${a.homework_id}`)) pendingBy.add(a.student_id);

  const recentByUser = new Map<string, number[]>();
  for (const r of ledger || []) {
    if (!recentByUser.has(r.user_id)) recentByUser.set(r.user_id, []);
    recentByUser.get(r.user_id)!.push(new Date(r.sent_at).getTime());
  }

  const now = Date.now();
  const dayStep = Math.floor(now / DAY); // idempotency key: one engagement email per user per day max
  let sent = 0, failed = 0, skippedCap = 0, skippedNothing = 0, skippedTest = 0;
  const planned: { to: string; type: string }[] = [];

  for (const u of users || []) {
    if (sent >= limit) break;
    if (isTestAccount(u)) { skippedTest++; continue; }

    // Frequency cap.
    const recents = recentByUser.get(u.id) || [];
    if (recents.some((t) => now - t < MIN_GAP_MS)) { skippedCap++; continue; }
    if (recents.filter((t) => now - t < 7 * DAY).length >= MAX_PER_7D) { skippedCap++; continue; }

    const daysSinceSeen = u.last_seen_at ? (now - new Date(u.last_seen_at).getTime()) / DAY : Infinity;
    const sig: UserSignals = {
      firstName: (u.name || u.email.split("@")[0]).split(/\s+/)[0],
      lang: languageName(u.learning_language),
      daysSinceSeen,
      streak: u.current_streak || 0,
      hasPendingHomework: pendingBy.has(u.id),
    };
    const type = pickMessage(sig);
    if (!type) { skippedNothing++; continue; }

    if (dry) { planned.push({ to: u.email, type }); continue; }

    const unsub = unsubscribeUrl(u.id, CAMPAIGN);
    const m = render(type, sig, unsub);
    try {
      const resendId = await sendCampaignEmail({ to: u.email, subject: m.subject, html: m.html, text: m.text, unsubscribeUrl: unsub });
      const { error: insErr } = await s
        .from("email_campaign_sends")
        .insert({ user_id: u.id, campaign: CAMPAIGN, step: dayStep, resend_id: resendId });
      if (insErr && !insErr.message.includes("duplicate")) throw insErr;
      sent++;
    } catch (e) {
      failed++;
      console.error(`[engagement] failed for ${u.email}:`, (e as Error).message);
    }
  }

  return NextResponse.json({
    ok: true, campaign: CAMPAIGN, mode: dry ? "dry-run" : "live",
    sent, failed, skippedCap, skippedNothing, skippedTest,
    ...(dry ? { planned } : {}),
  });
}
