// POST /api/tutor/students/respond
// Body: { studentId: string, action: "accept" | "decline" }
// The logged-in tutor accepts a pending join request (connects the student and
// sets referred_by_tutor_id, which also drives commission attribution) or
// declines it (removes the request row).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Caller must be a tutor/admin.
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const role = (me?.role || "").toUpperCase();
  if (role !== "TUTOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Only tutors can manage requests" }, { status: 403 });
  }

  const { studentId, action } = await req.json().catch(() => ({}));
  if (!studentId || (action !== "accept" && action !== "decline")) {
    return NextResponse.json({ error: "studentId and a valid action are required" }, { status: 400 });
  }

  const service = svc();

  // Ensure a request row actually exists for this pair (prevents acting on strangers).
  const { data: link } = await service
    .from("tutor_students")
    .select("id")
    .eq("tutor_id", user.id)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!link) {
    return NextResponse.json({ error: "No request from this student" }, { status: 404 });
  }

  if (action === "decline") {
    await service.from("tutor_students").delete().eq("tutor_id", user.id).eq("student_id", studentId);
    return NextResponse.json({ success: true, status: "declined" });
  }

  // Accept: connect the student to this tutor. Only set referred_by if the student
  // isn't already attributed to a different tutor.
  const { data: student } = await service
    .from("users")
    .select("referred_by_tutor_id")
    .eq("id", studentId)
    .maybeSingle();

  if (student?.referred_by_tutor_id && student.referred_by_tutor_id !== user.id) {
    return NextResponse.json(
      { error: "This student is already connected to another tutor." },
      { status: 409 }
    );
  }

  const { error: upErr } = await service
    .from("users")
    .update({ referred_by_tutor_id: user.id, updated_at: new Date().toISOString() })
    .eq("id", studentId);
  if (upErr) {
    return NextResponse.json({ error: "Failed to connect student" }, { status: 500 });
  }

  await service
    .from("tutor_students")
    .update({ status: "active", assigned_at: new Date().toISOString() })
    .eq("tutor_id", user.id)
    .eq("student_id", studentId);

  return NextResponse.json({ success: true, status: "accepted" });
}
