#!/usr/bin/env node
// scripts/send-reengagement.mjs
//
// Sends a one-off re-engagement email to inactive students. Picks the right
// template per user state:
//   - No placement test yet → renderPlacementEmail (CTA = /placement-test)
//   - Took placement, on FREE plan          → renderPremiumEmail (CTA = /pricing)
//   - Took placement + already paying       → skipped (no point)
//
// Defaults to DRY RUN (prints what it would send, no live emails). Pass
// --live to actually send. Sends via `curl` because the Resend Node SDK and
// Node 24's undici fetch both hang on this machine's network.
//
// Scheduling:
//   --at=ISO        Schedule all sends for an ISO 8601 time
//                   (e.g. --at=2026-06-19T09:00:00Z). Up to 30 days ahead.
//   --spread=MIN    Jitter each send randomly within ±MIN/2 minutes of --at
//                   so they don't all land in the same minute. Default 30.
//
// Usage:
//   node --env-file=.env.local scripts/send-reengagement.mjs                                                 # dry run
//   node --env-file=.env.local scripts/send-reengagement.mjs --live                                          # send now
//   node --env-file=.env.local scripts/send-reengagement.mjs --live --at=2026-06-19T09:00:00Z --spread=45    # schedule
//   node --env-file=.env.local scripts/send-reengagement.mjs --live --test=you@x.io                          # template review

import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";

const LIVE = process.argv.includes("--live");
const TEST_EMAIL = process.argv.find((a) => a.startsWith("--test="))?.split("=")[1];
const AT = process.argv.find((a) => a.startsWith("--at="))?.split("=")[1];
const SPREAD_MIN = Number(process.argv.find((a) => a.startsWith("--spread="))?.split("=")[1] || 30);

if (AT && Number.isNaN(Date.parse(AT))) {
  console.error(`Invalid --at value: ${AT}. Use ISO 8601, e.g. 2026-06-19T09:00:00Z`);
  process.exit(1);
}

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

if (LIVE && !process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY missing — required for --live. Add it to .env.local.");
  process.exit(1);
}

// Send via curl, since Node 24's undici fetch can't reach Resend reliably on
// this machine. Returns { id } on success or throws on error.
function sendViaCurl(payload) {
  const proc = spawnSync(
    "curl",
    [
      "-s",
      "--fail-with-body",
      "-X",
      "POST",
      "https://api.resend.com/emails",
      "-H",
      `Authorization: Bearer ${process.env.RESEND_API_KEY}`,
      "-H",
      "Content-Type: application/json",
      "--data-binary",
      "@-",
    ],
    { input: JSON.stringify(payload), encoding: "utf8" }
  );
  if (proc.status !== 0) {
    throw new Error(`curl status=${proc.status}: ${proc.stderr || proc.stdout || "unknown"}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(proc.stdout);
  } catch {
    throw new Error(`Non-JSON response: ${proc.stdout.slice(0, 200)}`);
  }
  if (parsed.error || parsed.message) {
    throw new Error(parsed.error?.message || parsed.message);
  }
  return parsed;
}

function jitteredScheduledAt() {
  if (!AT) return undefined;
  const base = Date.parse(AT);
  // ±SPREAD_MIN/2 minutes random jitter so sends don't all land in one minute.
  const halfSpreadMs = (SPREAD_MIN * 60 * 1000) / 2;
  const delta = (Math.random() * 2 - 1) * halfSpreadMs;
  return new Date(base + delta).toISOString();
}

const APP_URL = "https://app.francolink.net";
const FROM = "Tutor Njinu <njinu@francolink.net>";

// Template renderers (kept here verbatim so this script has zero TS deps;
// shares prose / structure with src/lib/email/templates/reengagement.ts).
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function shell({ firstName, bodyHtml, ctaHref, ctaText }) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#1a1a1a;line-height:1.55;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;max-width:560px;">
        <tr><td>
          <div style="font-weight:800;font-size:20px;color:#0f2744;letter-spacing:-0.02em;margin-bottom:24px;">francolink.</div>
          <p style="margin:0 0 16px 0;font-size:16px;">Hi ${escapeHtml(firstName)},</p>
          ${bodyHtml}
          <p style="margin:28px 0;">
            <a href="${ctaHref}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">${escapeHtml(ctaText)}</a>
          </p>
          <p style="margin:0 0 4px 0;font-size:15px;">À bientôt,</p>
          <p style="margin:0;font-size:15px;">— Njinu<br/><span style="color:#64748b;font-size:13px;">Tutor at Francolink</span></p>
        </td></tr>
      </table>
      <p style="font-size:12px;color:#94a3b8;margin:16px 0 0 0;">Francolink • <a href="${APP_URL}" style="color:#94a3b8;">app.francolink.net</a></p>
    </td></tr>
  </table>
</body></html>`;
}

function renderPlacement({ firstName, lang }) {
  const langPart = lang ? `${lang} ` : "";
  return {
    subject: `${firstName}, your 90-second ${langPart}placement test is waiting`,
    text: `Hi ${firstName},

I'm Njinu — one of the tutors at Francolink. I noticed you signed up but haven't taken the placement test yet.

It takes about 90 seconds and it's how we figure out exactly where to start you. After that, your dashboard lights up with lessons matched to your level in ${lang || "your target language"} — no guessing, no boring "Hello, my name is..." for the tenth time.

Take the placement test:
${APP_URL}/placement-test

If anything's confusing or you'd rather hop on a quick call with a tutor first, hit reply — I read every email.

À bientôt,
— Njinu
Tutor at Francolink`,
    html: shell({
      firstName,
      bodyHtml: `
        <p style="margin:0 0 14px 0;">I'm Njinu — one of the tutors at Francolink. I noticed you signed up but haven't taken the placement test yet.</p>
        <p style="margin:0 0 14px 0;">It takes about <strong>90 seconds</strong> and it's how we figure out exactly where to start you. After that, your dashboard lights up with lessons matched to your level in ${escapeHtml(lang || "your target language")} — no guessing, no boring "Hello, my name is..." for the tenth time.</p>
        <p style="margin:0 0 14px 0;">If anything's confusing, or you'd rather hop on a quick call with a tutor first, just hit reply — I read every email.</p>
      `,
      ctaHref: `${APP_URL}/placement-test`,
      ctaText: "Take the placement test",
    }),
  };
}

function renderPremium({ firstName, lang }) {
  return {
    subject: `${firstName}, unlock the full Francolink experience`,
    text: `Hi ${firstName},

Njinu here. I see you've started using Francolink — bonjour and welcome.

When you're ready to go deeper into ${lang || "your target language"}, Premium unlocks all 4 CEFR levels (A1 → B2), every lesson, plus access to a live tutor (that's people like me) and the AI conversation partner whenever you want to practise speaking.

See the Premium plans:
${APP_URL}/pricing

Reply to this email if you have any questions about what fits your level or budget — happy to help.

À bientôt,
— Njinu
Tutor at Francolink`,
    html: shell({
      firstName,
      bodyHtml: `
        <p style="margin:0 0 14px 0;">Njinu here. I see you've started using Francolink — bonjour and welcome.</p>
        <p style="margin:0 0 14px 0;">When you're ready to go deeper into ${escapeHtml(lang || "your target language")}, <strong>Premium</strong> unlocks all 4 CEFR levels (A1 → B2), every lesson, plus access to a live tutor (that's people like me) and the AI conversation partner whenever you want to practise speaking.</p>
        <p style="margin:0 0 14px 0;">Reply to this email if you have any questions about what fits your level or budget — happy to help.</p>
      `,
      ctaHref: `${APP_URL}/pricing`,
      ctaText: "See Premium plans",
    }),
  };
}

const LANG_NAME = { fr: "French", es: "Spanish", de: "German", en: "English" };

// Skip obvious test/demo accounts so we don't burn deliverability on bounces.
function isTestAccount(u) {
  const email = (u.email || "").toLowerCase();
  if (!email.includes("@")) return true;
  if (email.endsWith(".test") || email.endsWith(".local")) return true;
  if (email.endsWith("@francolink.test")) return true;
  if (/^test\d*@/.test(email)) return true; // test@, test2@, etc.
  if (/^demo\./.test(email)) return true;
  // Random-looking placeholder usernames generated by some seed/scripts.
  if (/^ls_\d+_/i.test(u.name || "")) return true;
  return false;
}

async function main() {
  console.log(`\n📬 Re-engagement send — ${LIVE ? "LIVE" : "DRY RUN"}${TEST_EMAIL ? ` (test → ${TEST_EMAIL})` : ""}\n`);

  // Pull all real student users with an email address.
  const { data: users, error } = await s
    .from("users")
    .select("id, email, name, role, placement_test_taken, subscription_plan, learning_language, total_xp, last_activity_date, created_at")
    .eq("role", "USER")
    .eq("is_active", true)
    .not("email", "is", null);
  if (error) throw error;

  let placement = 0, premium = 0, skipped = 0, skippedTest = 0, sent = 0, failed = 0;

  // --test mode: prefer the test recipient's own DB record so the preview
  // is personalized correctly. Falls back to the email local-part.
  let testFirstName;
  if (TEST_EMAIL) {
    const { data: testU } = await s.from("users").select("name").eq("email", TEST_EMAIL).maybeSingle();
    testFirstName = (testU?.name || TEST_EMAIL.split("@")[0]).split(/\s+/)[0];
  }

  for (const u of users) {
    if (isTestAccount(u)) { skippedTest++; continue; }
    const firstName = TEST_EMAIL ? testFirstName : (u.name || u.email.split("@")[0]).split(/\s+/)[0];
    const lang = LANG_NAME[u.learning_language] || null;
    const paying = u.subscription_plan && u.subscription_plan !== "FREE";

    let tpl;
    if (paying) {
      skipped++;
      continue;
    } else if (!u.placement_test_taken) {
      tpl = renderPlacement({ firstName, lang });
      placement++;
    } else {
      tpl = renderPremium({ firstName, lang });
      premium++;
    }

    const to = TEST_EMAIL || u.email;
    const scheduledAt = jitteredScheduledAt();

    if (!LIVE) {
      const when = scheduledAt ? ` at ${scheduledAt}` : "";
      console.log(`  → ${tpl.subject}  (to=${to}, kind=${u.placement_test_taken ? "premium" : "placement"})${when}`);
      if (TEST_EMAIL) break;
      continue;
    }

    try {
      const payload = {
        from: FROM,
        to,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
        reply_to: "njinu@francolink.net",
      };
      if (scheduledAt) payload.scheduled_at = scheduledAt;

      const result = sendViaCurl(payload);
      console.log(`  ✅ ${to.padEnd(40)} id=${result.id}${scheduledAt ? ` @ ${scheduledAt}` : ""}`);
      sent++;
    } catch (e) {
      console.error(`  ❌ ${to}: ${e.message}`);
      failed++;
    }

    if (TEST_EMAIL) break;

    // Be polite to Resend (free tier: 2 req/sec).
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log("\n─── Summary ───");
  console.log("  Placement-test emails:", placement);
  console.log("  Premium-upsell emails:", premium);
  console.log("  Skipped (already paying):", skipped);
  console.log("  Skipped (test/demo account):", skippedTest);
  if (LIVE) {
    console.log("  Sent:", sent);
    console.log("  Failed:", failed);
  } else {
    console.log("\n  (dry run — no emails sent. Add --live to send.)");
  }
  console.log();
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
