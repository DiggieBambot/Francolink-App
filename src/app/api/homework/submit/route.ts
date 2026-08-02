// POST /api/homework/submit  { homeworkId, answers: string[] }
// A signed-in student submits (or re-submits, until a tutor reviews) their
// answers. tutor_id is taken from the assignment row — the tutor who actually
// sent it — so the right review dashboard picks it up.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/analytics/activity";
import { recordActivity } from "@/lib/streak/record-activity";

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
  if (!user) return NextResponse.json({ error: "Please sign in to submit homework" }, { status: 401 });

  const { homeworkId, answers } = await req.json().catch(() => ({}));
  if (!homeworkId || !Array.isArray(answers)) {
    return NextResponse.json({ error: "homeworkId and answers are required" }, { status: 400 });
  }

  const service = svc();

  // Homework must exist and be live.
  const { data: hw } = await service
    .from("lesson_homework")
    .select("id, lesson_id, enabled, status, questions")
    .eq("id", homeworkId)
    .maybeSingle();
  if (!hw || !hw.enabled || hw.status !== "published") {
    return NextResponse.json({ error: "Homework is not available" }, { status: 404 });
  }

  // Homework is assignment-gated: a tutor must have sent it to this student.
  const { data: assignment } = await service
    .from("homework_assignments")
    .select("tutor_id")
    .eq("homework_id", homeworkId)
    .eq("student_id", user.id)
    .maybeSingle();
  if (!assignment) {
    return NextResponse.json({ error: "This homework hasn't been assigned to you" }, { status: 403 });
  }

  // Don't allow overwriting a submission a tutor has already reviewed.
  const { data: existing } = await service
    .from("homework_submissions")
    .select("id, status")
    .eq("homework_id", homeworkId)
    .eq("student_id", user.id)
    .maybeSingle();
  if (existing?.status === "reviewed") {
    return NextResponse.json({ error: "Your tutor has already reviewed this — it can't be changed." }, { status: 409 });
  }

  // Normalise answers to [{ answer }] aligned to the number of questions.
  const qCount = Array.isArray(hw.questions) ? hw.questions.length : answers.length;
  const normalized = Array.from({ length: qCount }, (_, i) => ({
    answer: typeof answers[i] === "string" ? answers[i].trim() : "",
  }));

  const { data: saved, error } = await service
    .from("homework_submissions")
    .upsert(
      {
        homework_id: homeworkId,
        lesson_id: hw.lesson_id,
        student_id: user.id,
        tutor_id: assignment.tutor_id,
        answers: normalized,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "homework_id,student_id" }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Canonical funnel/retention event — feeds the §1 analytics "Submitted
  // homework" step and homework-doer retention (see docs/integration-hooks.md).
  await logActivity(user.id, "homework_submitted", { metadata: { homeworkId } });

  // Homework counts as activity toward the daily streak.
  await recordActivity(user.id, { kind: "homework" });

  return NextResponse.json({ submission: saved });
}
