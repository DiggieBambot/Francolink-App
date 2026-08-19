// "Notify me when tutors are available" on francolink.net/tutors.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { looksHuman } from "@/lib/site/form-token";

export const runtime = "nodejs";

const Body = z.object({
  email: z.email().max(200),
  language: z.string().trim().min(2).max(5).nullable().default(null),
  level: z.string().trim().max(4).optional().default(""),
  note: z.string().trim().max(500).optional().default(""),
  // Honeypot.
  company: z.string().optional().default(""),
  // Proof the form was actually rendered — see lib/site/form-token.
  form_token: z.string().optional().default(""),
});

export async function POST(request: Request) {
  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "That email doesn't look right." },
      { status: 400 }
    );
  }

  if (input.company.trim() !== "") return NextResponse.json({ ok: true });

  // Drive-by bots POST straight at this route without ever loading the form,
  // so they have no token. Answer 200 so they learn nothing and don't retry.
  if (!looksHuman(input.form_token)) {
    console.log("[tutor-waitlist] rejected: no valid form token");
    return NextResponse.json({ ok: true });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await db.from("tutor_waitlist").insert({
    email: input.email,
    language: input.language,
    level: input.level || null,
    note: input.note || null,
    source: "website",
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
  });

  if (error) {
    // Already on the list for this language — that's a success from the
    // visitor's point of view, not an error to show them.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, already: true });
    }
    console.error("[site/tutor-waitlist] insert failed", error);
    return NextResponse.json(
      { error: "We couldn't save that. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
