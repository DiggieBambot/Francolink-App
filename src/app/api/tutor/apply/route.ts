// An existing tutor applying to become a FrancoLink tutor — one we send
// students to and pay per lesson, as opposed to someone using the platform as
// a tool for students they found themselves.
//
// Distinct from /api/site/teach: the applicant is signed in, so identity comes
// from the session rather than the form. Nothing the client sends decides who
// the application belongs to.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_FROM, getResend } from "@/lib/email/resend";

export const runtime = "nodejs";

const Body = z.object({
  teaches: z.array(z.string().trim().min(2).max(5)).min(1).max(6),
  levels: z.array(z.string().trim().max(4)).max(6).default([]),
  years_experience: z.number().int().min(0).max(70).nullable().default(null),
  weekly_hours: z.number().int().min(1).max(80).nullable().default(null),
  qualifications: z.string().trim().max(2000).optional().default(""),
  about: z.string().trim().min(20).max(3000),
  link: z.string().trim().max(500).optional().default(""),
  country: z.string().trim().max(80).optional().default(""),
  timezone: z.string().trim().max(60).optional().default(""),
});

const SUPPORT_INBOX = process.env.SUPPORT_INBOX || "support@francolink.net";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: me } = await supabase
    .from("users")
    .select("name, email, role, timezone")
    .eq("id", user.id)
    .maybeSingle();

  const role = (me?.role || "").toUpperCase();
  if (role !== "TUTOR" && role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only tutor accounts can apply." },
      { status: 403 }
    );
  }

  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Please check the form and try again." },
      { status: 400 }
    );
  }

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await db.from("tutor_applications").insert({
    // Identity comes from the session, never from the request body.
    applicant_user_id: user.id,
    full_name: me?.name || user.email || "FrancoLink tutor",
    email: me?.email || user.email,
    country: input.country || null,
    timezone: input.timezone || me?.timezone || null,
    teaches: input.teaches,
    levels: input.levels,
    years_experience: input.years_experience,
    weekly_hours: input.weekly_hours,
    qualifications: input.qualifications || null,
    about: input.about,
    link: input.link || null,
    source: "app",
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You already have an application under review." },
        { status: 409 }
      );
    }
    console.error("[tutor/apply] insert failed", error);
    return NextResponse.json(
      { error: "We couldn't save your application. Please try again." },
      { status: 500 }
    );
  }

  try {
    await getResend().emails.send({
      from: DEFAULT_FROM,
      to: SUPPORT_INBOX,
      replyTo: me?.email || undefined,
      subject: `[Teach · in-app] ${me?.name || user.email} — ${input.teaches.join(", ")}`,
      text: [
        `Existing tutor applying to become a FrancoLink tutor.`,
        `${me?.name} <${me?.email}>`,
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
    console.error("[tutor/apply] email notification failed", err);
  }

  return NextResponse.json({ ok: true });
}
