// "Apply to teach" on francolink.net.
//
// Deliberately account-free: an applicant submits without signing up, and only
// on acceptance does an admin create the tutor account and listing. A rejected
// applicant therefore never leaves a half-made account behind.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_FROM, getResend } from "@/lib/email/resend";

export const runtime = "nodejs";

const Body = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  country: z.string().trim().max(80).optional().default(""),
  timezone: z.string().trim().max(60).optional().default(""),
  teaches: z.array(z.string().trim().min(2).max(5)).min(1).max(6),
  levels: z.array(z.string().trim().max(4)).max(6).default([]),
  years_experience: z.number().int().min(0).max(70).nullable().default(null),
  weekly_hours: z.number().int().min(1).max(80).nullable().default(null),
  qualifications: z.string().trim().max(2000).optional().default(""),
  about: z.string().trim().min(20).max(3000),
  link: z.string().trim().max(500).optional().default(""),
  // Honeypot.
  company: z.string().optional().default(""),
});

const SUPPORT_INBOX = process.env.SUPPORT_INBOX || "support@francolink.net";

export async function POST(request: Request) {
  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Please check the form and try again." },
      { status: 400 }
    );
  }

  // Bots get a success response — an error just teaches them to retry.
  if (input.company.trim() !== "") return NextResponse.json({ ok: true });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await db.from("tutor_applications").insert({
    full_name: input.full_name,
    email: input.email,
    country: input.country || null,
    timezone: input.timezone || null,
    teaches: input.teaches,
    levels: input.levels,
    years_experience: input.years_experience,
    weekly_hours: input.weekly_hours,
    qualifications: input.qualifications || null,
    about: input.about,
    link: input.link || null,
    source: "website",
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  });

  if (error) {
    // The partial unique index rejects a second application while one is
    // still open. Say so plainly rather than showing a generic failure.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You already have an application with us — we'll be in touch." },
        { status: 409 }
      );
    }
    console.error("[site/teach] insert failed", error);
    return NextResponse.json(
      { error: "We couldn't save your application. Please email us instead." },
      { status: 500 }
    );
  }

  try {
    await getResend().emails.send({
      from: DEFAULT_FROM,
      to: SUPPORT_INBOX,
      replyTo: input.email,
      subject: `[Teach] ${input.full_name} — ${input.teaches.join(", ")}`,
      text: [
        `${input.full_name} <${input.email}>`,
        `Country: ${input.country || "—"}  Timezone: ${input.timezone || "—"}`,
        `Teaches: ${input.teaches.join(", ")}  Levels: ${input.levels.join(", ") || "—"}`,
        `Experience: ${input.years_experience ?? "—"} yrs  Available: ${input.weekly_hours ?? "—"} h/week`,
        `Link: ${input.link || "—"}`,
        "",
        "Qualifications:",
        input.qualifications || "—",
        "",
        "About:",
        input.about,
      ].join("\n"),
    });
  } catch (err) {
    // Already saved — a failed notification must not fail the request.
    console.error("[site/teach] email notification failed", err);
  }

  return NextResponse.json({ ok: true });
}
