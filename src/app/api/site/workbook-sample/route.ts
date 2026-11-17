// "Send me Partie 0 free" on francolink.net.
//
// Anyone may sign up; no account. Saves the lead and sends the sample email
// at once. If that send fails the lead stays at step 0 and the daily sequence
// cron sends it on its next run, so a Resend hiccup never loses a signup.

import { NextResponse } from "next/server";
import { z } from "zod";
import { looksHuman } from "@/lib/site/form-token";
import { service } from "@/lib/workbook/files";
import { sendCampaignEmail } from "@/lib/email/send";
import { STEPS, leadUnsubscribeUrl } from "@/lib/email/campaigns/workbook-sample";

export const runtime = "nodejs";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

const Body = z.object({
  email: z.email().max(200),
  source: z.enum(["sales-page", "sample-page"]).default("sales-page"),
  utm: z.record(z.string(), z.string().max(200)).optional().default({}),
  // Honeypot.
  company: z.string().optional().default(""),
  // Proof the form was actually rendered — see lib/site/form-token.
  form_token: z.string().optional().default(""),
});

/** Resending the sample to the same address more often than this is a bot or a double click. */
const RESEND_AFTER_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  let input: z.infer<typeof Body>;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }

  // Bots learn nothing: same answer as a real signup.
  if (input.company.trim() !== "") return NextResponse.json({ ok: true });
  if (!looksHuman(input.form_token)) {
    console.log("[workbook-sample] rejected: no valid form token");
    return NextResponse.json({ ok: true });
  }

  const email = input.email.trim().toLowerCase();
  const utm: Record<string, string> = {};
  for (const k of UTM_KEYS) if (input.utm[k]) utm[k] = input.utm[k];

  const db = service();
  const { data: existing } = await db
    .from("workbook_leads")
    .select("id, step, last_sent_at, unsubscribed_at")
    .eq("email", email)
    .maybeSingle();

  let leadId: string;
  if (existing) {
    leadId = existing.id;
    // Asking again is consent again.
    if (existing.unsubscribed_at) {
      await db.from("workbook_leads").update({ unsubscribed_at: null }).eq("id", leadId);
    }
    const recent =
      existing.last_sent_at &&
      Date.now() - new Date(existing.last_sent_at).getTime() < RESEND_AFTER_MS;
    if (recent) return NextResponse.json({ ok: true });
  } else {
    const { data, error } = await db
      .from("workbook_leads")
      .insert({
        email,
        source: input.source,
        utm: Object.keys(utm).length ? utm : null,
      })
      .select("id")
      .single();
    if (error || !data) {
      // A double submit racing the first insert: the lead exists, which is fine.
      if (error?.code === "23505") return NextResponse.json({ ok: true });
      console.error("[workbook-sample] insert failed", error);
      return NextResponse.json(
        { error: "We couldn't save that. Please try again." },
        { status: 500 }
      );
    }
    leadId = data.id;
  }

  try {
    const unsub = leadUnsubscribeUrl(leadId);
    const { subject, html, text } = STEPS[0].render({
      firstName: email.split("@")[0],
      unsubscribeUrl: unsub,
    });
    await sendCampaignEmail({ to: email, subject, html, text, unsubscribeUrl: unsub });
    // Only a first signup advances the sequence; a re-request just resends the sample.
    await db
      .from("workbook_leads")
      .update({
        last_sent_at: new Date().toISOString(),
        ...(existing && existing.step > 0 ? {} : { step: 1 }),
      })
      .eq("id", leadId);
  } catch (e) {
    console.error("[workbook-sample] sample send failed; cron will retry", (e as Error).message);
  }

  return NextResponse.json({ ok: true });
}
