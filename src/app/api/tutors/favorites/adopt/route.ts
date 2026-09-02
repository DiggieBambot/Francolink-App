// Adopt a shortlist built on the marketing site into a real account.
//
// The website cannot write tutor_favorites — it has no session (see
// src/lib/site/shortlist.ts). So the shortlist rides the signup URL as slugs
// and lands here once, on the app host, where the cookie exists.
//
// Idempotent and additive: adopting twice changes nothing, and it never
// removes a favourite the student already had. Someone who shortlists on
// their phone and then signs up on a laptop should not lose either list.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";

/** Matches the cap in the shortlist helper. */
const MAX = 20;

const Body = z.object({
  slugs: z.array(z.string().trim().min(1).max(80)).max(MAX),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Bad shortlist." }, { status: 400 });
  }
  if (input.slugs.length === 0) return NextResponse.json({ adopted: 0 });

  // Resolve slugs to listed tutors only. A slug that no longer exists, or
  // belongs to an unlisted tutor, is dropped silently — the student did
  // nothing wrong and there is nothing for them to fix.
  const { data: profiles } = await supabase
    .from("tutor_public_profiles")
    .select("user_id")
    .in("slug", input.slugs)
    .eq("is_public", true)
    .eq("approval_status", "approved");

  const rows = (profiles ?? [])
    .map((p) => p.user_id as string)
    .filter((id) => id !== user.id)
    .map((tutor_id) => ({ student_id: user.id, tutor_id }));

  if (rows.length === 0) return NextResponse.json({ adopted: 0 });

  const { error } = await supabase
    .from("tutor_favorites")
    .upsert(rows, { onConflict: "student_id,tutor_id", ignoreDuplicates: true });

  if (error) {
    console.error("[favorites/adopt] failed", error);
    return NextResponse.json({ error: "Couldn't save your shortlist." }, { status: 500 });
  }

  return NextResponse.json({ adopted: rows.length });
}
