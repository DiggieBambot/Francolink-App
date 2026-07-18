// Engagement campaign cron. Triggered HOURLY by an external scheduler
// (.github/workflows/engagement-cron.yml — Vercel Hobby can't do sub-daily
// crons). Each run sends only to users for whom it's currently ~10am local on
// Tue/Thu/Sun. Picks the single most relevant nudge, respects opt-out, and
// frequency-caps (max 3/week, 36h gap) so nobody is over-emailed.
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
import {
  CAMPAIGN, pickMessage, render, renderTutor, pickTutorMessage, TUTOR_VALUE_THEMES,
  type MessageType, type UserSignals, type TutorMessageType, type TutorSignals,
} from "@/lib/email/campaigns/engagement";

const TUTOR_TYPES = new Set([
  "requests", "winback_tutor", "assign",
  "whats_new", "commission", "materials_free", "features", "teaching_easy",
]);

// Stable small hash for per-tutor theme rotation.
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Locally-timed sending: Tue/Thu/Sun at ~10am in the user's own timezone.
// The cron is triggered hourly (external scheduler); each run only sends to
// users for whom it's currently the target hour on a target day.
const TARGET_HOUR = 10;
const TARGET_DAYS = new Set(["Sun", "Tue", "Thu"]);

function isSendTime(tz: string | null | undefined): boolean {
  const zone = tz || "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone, weekday: "short", hour: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());
    const wd = parts.find((p) => p.type === "weekday")?.value || "";
    const hr = parseInt(parts.find((p) => p.type === "hour")?.value || "-1", 10);
    return hr === TARGET_HOUR && TARGET_DAYS.has(wd);
  } catch {
    return false; // invalid tz string → skip this run (they'll match on UTC next cycle isn't possible, but avoids crashes)
  }
}

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
    const sampleExtras = { newLessonCount: 12, newLessonSamples: ["Comment ça va ?", "At the Restaurant", "Job Interview"] };
    const html = TUTOR_TYPES.has(preview)
      ? renderTutor(preview as TutorMessageType, { firstName: "Marie", daysSinceSeen: 5, studentCount: 3, pendingRequests: preview === "requests" ? 2 : 0, daysSinceLastAssign: 20 }, undefined, sampleExtras).html
      : render(preview as MessageType, { firstName: "Alex", lang, daysSinceSeen: 5, streak: 4, hasPendingHomework: preview === "homework" }).html;
    return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const s = svc();

  // --- Test send ------------------------------------------------------------
  if (testEmail) {
    const type = url.searchParams.get("type") || "nudge";
    const lang = languageName(url.searchParams.get("lang") || "fr");
    const first = testEmail.split("@")[0];
    const m = TUTOR_TYPES.has(type)
      ? renderTutor(type as TutorMessageType, { firstName: first, daysSinceSeen: 5, studentCount: 3, pendingRequests: type === "requests" ? 2 : 0, daysSinceLastAssign: 20 }, undefined, { newLessonCount: 12, newLessonSamples: ["Comment ça va ?", "At the Restaurant", "Job Interview"] })
      : render(type as MessageType, { firstName: first, lang, daysSinceSeen: 5, streak: 4, hasPendingHomework: type === "homework" });
    const id = await sendCampaignEmail({ to: testEmail, subject: m.subject, html: m.html, text: m.text });
    return NextResponse.json({ ok: true, sentTo: testEmail, type, resendId: id });
  }

  // --- Real run -------------------------------------------------------------
  const { data: users, error } = await s
    .from("users")
    .select("id, email, name, learning_language, current_streak, last_seen_at, timezone, is_active, email_marketing_opt_out")
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
  let sent = 0, failed = 0, skippedCap = 0, skippedNothing = 0, skippedTest = 0, skippedTime = 0;
  const planned: { to: string; type: string }[] = [];

  for (const u of users || []) {
    if (sent >= limit) break;
    if (isTestAccount(u)) { skippedTest++; continue; }

    // Locally-timed gate (skipped in dry-run so targeting is previewable anytime).
    if (!dry && !isSendTime(u.timezone)) { skippedTime++; continue; }

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

  // --- Tutor pass -----------------------------------------------------------
  const { data: tutors } = await s
    .from("users")
    .select("id, email, name, last_seen_at, timezone")
    .eq("role", "TUTOR")
    .eq("is_active", true)
    .eq("email_marketing_opt_out", false)
    .not("email", "is", null);

  if ((tutors || []).length > 0) {
    const [{ data: allUsers }, { data: rels }, { data: hwAssigns }, { data: freshLessons }] = await Promise.all([
      s.from("users").select("id, referred_by_tutor_id"),
      s.from("tutor_students").select("tutor_id, student_id"),
      s.from("homework_assignments").select("tutor_id, assigned_at"),
      s.from("tutor_lessons").select("title").eq("status", "published")
        .gte("published_at", new Date(now - 21 * DAY).toISOString())
        .order("published_at", { ascending: false }).limit(30),
    ]);
    const newLessonCount = (freshLessons || []).length;
    const newLessonSamples = (freshLessons || []).slice(0, 3).map((l) => l.title as string);
    const referredBy = new Map((allUsers || []).map((u) => [u.id, u.referred_by_tutor_id]));
    const connectedByTutor = new Map<string, number>();
    for (const u of allUsers || []) {
      if (u.referred_by_tutor_id) connectedByTutor.set(u.referred_by_tutor_id, (connectedByTutor.get(u.referred_by_tutor_id) || 0) + 1);
    }
    const pendingByTutor = new Map<string, number>();
    for (const r of rels || []) {
      if (referredBy.get(r.student_id) !== r.tutor_id) pendingByTutor.set(r.tutor_id, (pendingByTutor.get(r.tutor_id) || 0) + 1);
    }
    const lastAssignByTutor = new Map<string, number>();
    for (const a of hwAssigns || []) {
      const t = new Date(a.assigned_at).getTime();
      if (t > (lastAssignByTutor.get(a.tutor_id) || 0)) lastAssignByTutor.set(a.tutor_id, t);
    }

    for (const u of tutors || []) {
      if (sent >= limit) break;
      if (isTestAccount(u)) { skippedTest++; continue; }
      if (!dry && !isSendTime(u.timezone)) { skippedTime++; continue; }
      const recents = recentByUser.get(u.id) || [];
      if (recents.some((t) => now - t < MIN_GAP_MS)) { skippedCap++; continue; }
      if (recents.filter((t) => now - t < 7 * DAY).length >= MAX_PER_7D) { skippedCap++; continue; }

      const lastAssign = lastAssignByTutor.get(u.id);
      const sig: TutorSignals = {
        firstName: (u.name || u.email.split("@")[0]).split(/\s+/)[0],
        daysSinceSeen: u.last_seen_at ? (now - new Date(u.last_seen_at).getTime()) / DAY : Infinity,
        studentCount: connectedByTutor.get(u.id) || 0,
        pendingRequests: pendingByTutor.get(u.id) || 0,
        daysSinceLastAssign: lastAssign ? (now - lastAssign) / DAY : Infinity,
      };
      // Rotate the value theme per tutor per send. Skip "what's new" when there's nothing new.
      let rotationTheme = TUTOR_VALUE_THEMES[(dayStep + hashId(u.id)) % TUTOR_VALUE_THEMES.length];
      if (rotationTheme === "whats_new" && newLessonCount === 0) {
        rotationTheme = TUTOR_VALUE_THEMES[(dayStep + hashId(u.id) + 1) % TUTOR_VALUE_THEMES.length];
      }
      const type = pickTutorMessage(sig, rotationTheme);
      if (!type) { skippedNothing++; continue; }
      if (dry) { planned.push({ to: u.email, type: `tutor:${type}` }); continue; }

      const unsub = unsubscribeUrl(u.id, CAMPAIGN);
      const m = renderTutor(type, sig, unsub, { newLessonCount, newLessonSamples });
      try {
        const resendId = await sendCampaignEmail({ to: u.email, subject: m.subject, html: m.html, text: m.text, unsubscribeUrl: unsub });
        const { error: insErr } = await s.from("email_campaign_sends").insert({ user_id: u.id, campaign: CAMPAIGN, step: dayStep, resend_id: resendId });
        if (insErr && !insErr.message.includes("duplicate")) throw insErr;
        sent++;
      } catch (e) {
        failed++;
        console.error(`[engagement] tutor failed for ${u.email}:`, (e as Error).message);
      }
    }
  }

  return NextResponse.json({
    ok: true, campaign: CAMPAIGN, mode: dry ? "dry-run" : "live",
    sent, failed, skippedCap, skippedNothing, skippedTest, skippedTime,
    ...(dry ? { planned } : {}),
  });
}
