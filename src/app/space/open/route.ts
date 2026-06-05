// GET /space/open?partner=<userId>
// Resolves the current user's role + the partner, gets/creates the persistent
// lesson space for the pair, and redirects into /room/[id].

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getOrCreateLessonSpace } from "@/lib/lessons/lesson-space";

function createService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const partner = req.nextUrl.searchParams.get("partner");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?next=/space/open${partner ? `?partner=${partner}` : ""}`);

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const myRole = (me?.role || "").toUpperCase();
  const iAmTutor = myRole === "TUTOR" || myRole === "ADMIN";

  // Resolve the partner. If not given, pick the user's single connection.
  let partnerId = partner || "";
  const svc = createService();
  if (!partnerId) {
    if (iAmTutor) {
      const { data } = await svc.from("tutor_students").select("student_id").eq("tutor_id", user.id).eq("status", "active").limit(1).maybeSingle();
      partnerId = data?.student_id || "";
    } else {
      const { data } = await svc.from("tutor_students").select("tutor_id").eq("student_id", user.id).eq("status", "active").limit(1).maybeSingle();
      partnerId = data?.tutor_id || "";
    }
  }
  if (!partnerId) {
    // No connection yet → guide them.
    return NextResponse.redirect(`${origin}/${iAmTutor ? "tutor/students" : "dashboard"}?error=no_connection`);
  }

  const tutorId = iAmTutor ? user.id : partnerId;
  const studentId = iAmTutor ? partnerId : user.id;

  // Verify the pair is actually connected.
  const { data: link } = await svc
    .from("tutor_students")
    .select("id")
    .eq("tutor_id", tutorId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!link) {
    return NextResponse.redirect(`${origin}/${iAmTutor ? "tutor/students" : "dashboard"}?error=not_connected`);
  }

  const space = await getOrCreateLessonSpace(tutorId, studentId);
  return NextResponse.redirect(`${origin}/room/${space.id}`);
}
