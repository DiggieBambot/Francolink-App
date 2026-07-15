// POST /api/homework/assign  { slug, studentIds: string[] }
// A tutor sends a lesson's (published) homework to one or more of THEIR students.
// Creates assignment rows (idempotent) and notifies each student.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notifyMany } from "@/lib/notifications/create";

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
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const role = (me?.role || "").toUpperCase();
  if (role !== "TUTOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Only tutors can send homework" }, { status: 403 });
  }

  const { slug, studentIds } = await req.json().catch(() => ({}));
  if (!slug || !Array.isArray(studentIds) || studentIds.length === 0) {
    return NextResponse.json({ error: "slug and studentIds are required" }, { status: 400 });
  }

  const service = svc();

  // Homework must exist and be published (ready to send).
  const { data: hw } = await service
    .from("lesson_homework")
    .select("id, lesson_id, lesson_slug, title, status, enabled")
    .eq("lesson_slug", slug)
    .maybeSingle();
  if (!hw || !hw.enabled || hw.status !== "published") {
    return NextResponse.json({ error: "No published homework for this lesson yet" }, { status: 404 });
  }

  // Only allow assigning to this tutor's own connected students.
  const { data: mine } = await service
    .from("users")
    .select("id")
    .eq("referred_by_tutor_id", user.id)
    .in("id", studentIds);
  const validIds = (mine || []).map((r) => r.id);
  if (validIds.length === 0) {
    return NextResponse.json({ error: "None of those students are connected to you" }, { status: 403 });
  }

  const rows = validIds.map((student_id) => ({
    homework_id: hw.id,
    lesson_id: hw.lesson_id,
    lesson_slug: hw.lesson_slug,
    student_id,
    tutor_id: user.id,
    assigned_at: new Date().toISOString(),
  }));

  const { error: insErr } = await service
    .from("homework_assignments")
    .upsert(rows, { onConflict: "homework_id,student_id" });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  await notifyMany(validIds, {
    type: "homework_assigned",
    title: "New homework from your tutor",
    body: `${hw.title} — tap to complete it.`,
    url: `/library/lesson/${hw.lesson_slug}#homework`,
  });

  return NextResponse.json({ ok: true, assigned: validIds.length });
}
