// Contact form on the front-facing website (francolink.net/contact).
//
// Stores the message so nothing is lost if email delivery fails, then tries to
// notify the team by email. A failed notification must never fail the request —
// the row is already saved.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_FROM, getResend } from "@/lib/email/resend";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  topic: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(10).max(4000),
  // Honeypot — a filled value means a bot.
  company: z.string().optional().default(""),
});

const SUPPORT_INBOX = process.env.SUPPORT_INBOX || "support@francolink.net";

export async function POST(request: Request) {
  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Please check the form and try again." },
      { status: 400 }
    );
  }

  // Silently accept honeypot hits: a bot that gets an error learns to retry.
  if (parsed.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.name,
    email: parsed.email,
    topic: parsed.topic || null,
    message: parsed.message,
    source: "website",
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  });

  if (error) {
    console.error("[site/contact] insert failed", error);
    return NextResponse.json(
      { error: "We couldn't save your message. Please email us directly." },
      { status: 500 }
    );
  }

  try {
    await getResend().emails.send({
      from: DEFAULT_FROM,
      to: SUPPORT_INBOX,
      replyTo: parsed.email,
      subject: `[Website] ${parsed.topic || "New message"} — ${parsed.name}`,
      text: [
        `From: ${parsed.name} <${parsed.email}>`,
        `Topic: ${parsed.topic || "—"}`,
        "",
        parsed.message,
      ].join("\n"),
    });
  } catch (err) {
    // Already persisted — surface in logs and let the visitor see success.
    console.error("[site/contact] email notification failed", err);
  }

  return NextResponse.json({ ok: true });
}
