// POST /api/homework/review  { submissionId, feedback }
// The reviewing tutor (or an admin) leaves feedback and marks a submission
// reviewed. A tutor may only review submissions from their own students.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
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
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const role = (me?.role || "").toUpperCase();
  if (role !== "TUTOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Only tutors can review homework" }, { status: 403 });
  }

  const { submissionId, feedback } = await req.json().catch(() => ({}));
  if (!submissionId) return NextResponse.json({ error: "submissionId is required" }, { status: 400 });

  const service = svc();
  const { data: sub } = await service
    .from("homework_submissions")
    .select("id, tutor_id, student_id, lesson_homework:homework_id(lesson_slug, title)")
    .eq("id", submissionId)
    .maybeSingle();
  if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  if (role !== "ADMIN" && sub.tutor_id !== user.id) {
    return NextResponse.json({ error: "This isn't your student's submission" }, { status: 403 });
  }

  const { data: saved, error } = await service
    .from("homework_submissions")
    .update({
      status: "reviewed",
      tutor_feedback: typeof feedback === "string" ? feedback.trim() : null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Let the student know their work was reviewed.
  const hw = (sub as { lesson_homework?: { lesson_slug?: string; title?: string } }).lesson_homework;
  if (sub.student_id && hw?.lesson_slug) {
    await notifyUser({
      userId: sub.student_id,
      type: "homework_reviewed",
      title: "Your tutor reviewed your homework",
      body: `${hw.title || "Homework"} — see their feedback.`,
      url: `/library/lesson/${hw.lesson_slug}#homework`,
    });
  }

  return NextResponse.json({ submission: saved });
}
