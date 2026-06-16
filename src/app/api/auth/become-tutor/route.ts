import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, tutor_invite_code")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.role === "TUTOR") {
    return NextResponse.json({ error: "Already a tutor" }, { status: 400 });
  }

  // Generate unique invite code
  let inviteCode = "";
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = Math.random().toString(36).slice(2, 10).toUpperCase();
    const { data: clash } = await supabase
      .from("users")
      .select("id")
      .eq("tutor_invite_code", candidate)
      .maybeSingle();
    if (!clash) {
      inviteCode = candidate;
      break;
    }
  }

  if (!inviteCode) {
    return NextResponse.json(
      { error: "Failed to generate invite code" },
      { status: 500 }
    );
  }

  // Fetch free plan limits
  const { data: planDetails } = await supabase
    .from("tutor_plans")
    .select("student_limit, session_limit")
    .eq("key", "FREE")
    .single();

  const { error } = await supabase
    .from("users")
    .update({
      role: "TUTOR",
      tutor_plan: "FREE",
      tutor_invite_code: inviteCode,
      student_limit: planDetails?.student_limit || 5,
      monthly_session_limit: planDetails?.session_limit || 10,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to upgrade role" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, inviteCode });
}
