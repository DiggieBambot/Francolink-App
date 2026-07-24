// GET /space/new
// There is no longer a shared classroom — every student has their own private
// room. Send tutors to their student list, where each student has an "Enter
// room" action that opens that student's private space. Students join via the
// link their tutor sends them.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?next=/space/new`);

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const role = (me?.role || "").toUpperCase();
  if (role !== "TUTOR" && role !== "ADMIN") {
    // Students don't create rooms — they open their space via /space/open.
    return NextResponse.redirect(`${origin}/space/open`);
  }

  return NextResponse.redirect(`${origin}/tutor/students`);
}
