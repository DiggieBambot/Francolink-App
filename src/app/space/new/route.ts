// GET /space/new
// Opens the tutor's reusable classroom (Google-Meet style). Creates it on first
// use, then redirects into /room/[id]. The tutor shares that room link with a
// student via the People tab or any other channel.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTutorRoom } from "@/lib/lessons/lesson-space";

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?next=/space/new`);

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const role = (me?.role || "").toUpperCase();
  if (role !== "TUTOR" && role !== "ADMIN") {
    // Students don't create rooms — they join via a link a tutor sends them.
    return NextResponse.redirect(`${origin}/dashboard?error=tutors_only`);
  }

  const room = await getOrCreateTutorRoom(user.id);
  return NextResponse.redirect(`${origin}/room/${room.id}`);
}
