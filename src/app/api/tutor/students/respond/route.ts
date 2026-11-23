// POST /api/tutor/students/respond
// Body: { studentId: string, action: "accept" | "decline" }
// The logged-in tutor accepts a pending join request (connects the student) or
// declines it (removes the request row). Commission is not decided here.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notifyStudentConfirmed } from "@/lib/email/transactional";
import { notifyUser } from "@/lib/notifications/create";

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

  // Accept: connect the student to this tutor. Students may have multiple
  // teachers, so we never reject on an existing connection. Accepting does
  // NOT attribute commission: that was decided when the request was made —
  // set then if it came through this tutor's invite code, and never for a
  // public-profile request (lib/tutor/commission.ts).
  await service
    .from("tutor_students")
    .update({ status: "active", assigned_at: new Date().toISOString() })
    .eq("tutor_id", user.id)
    .eq("student_id", studentId);

  // Tell the student they're connected — in-app + email.
  const { data: tutorRow } = await service.from("users").select("name").eq("id", user.id).maybeSingle();
  await notifyUser({
    userId: studentId,
    type: "tutor_confirmed",
    title: "You're connected with your tutor",
    body: `${tutorRow?.name || "Your tutor"} confirmed you as their student.`,
    url: "/dashboard",
  });
  await notifyStudentConfirmed(studentId, tutorRow?.name);

  return NextResponse.json({ success: true, status: "accepted" });
}
