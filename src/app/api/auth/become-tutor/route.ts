import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST() {
  // Authenticate the caller with their cookie session…
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // …but perform the privileged role change with the service-role client so
  // it isn't blocked by RLS on the `role` column.
  const supabase = createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

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

  // Fetch free plan limits (tutor_plans may be empty — fall back to defaults).
  const { data: planDetails } = await supabase
    .from("tutor_plans")
    .select("student_limit")
    .eq("key", "FREE")
    .maybeSingle();

  // NB: the users table has no `monthly_session_limit` column — only
  // role, tutor_plan, tutor_invite_code, commission_balance, student_limit.
  const { error } = await supabase
    .from("users")
    .update({
      role: "TUTOR",
      tutor_plan: "FREE",
      tutor_invite_code: inviteCode,
      student_limit: planDetails?.student_limit || 5,
      commission_balance: 0,
    })
    .eq("id", user.id);

  if (error) {
    console.error("become-tutor update error:", error.message);
    return NextResponse.json(
      { error: "Failed to upgrade role: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, inviteCode });
}
