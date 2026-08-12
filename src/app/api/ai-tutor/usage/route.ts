// src/app/api/ai-tutor/usage/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTutorAccess } from "@/lib/ai/tutor-access";
import { buildTutorContext } from "@/lib/ai/tutor-context";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await getTutorAccess(supabase, user.id);
    if (!access) {
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }

    // The page needs the level and language before the first message so the
    // voice and the microphone are right from the opening turn.
    const context = await buildTutorContext(
      supabase,
      user.id,
      access.learningLanguage
    );

    // Offer the last lesson the student's human tutor covered as a one-tap way
    // into lesson mode. Without an entry point, "lesson mode" is a capability
    // nobody ever reaches — an empty chat box gives a student no idea what to
    // do, which is the most common way a tutor chat goes unused.
    const { data: recent } = await supabase
      .from("lesson_coverage")
      .select("tutor_lesson_id, lesson_title")
      .eq("student_id", user.id)
      .not("tutor_lesson_id", "is", null)
      .order("covered_on", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      hasAccess: access.hasAccess,
      tutorEnabled: access.tutorEnabled,
      learningLanguage: access.learningLanguage,
      level: context.level,
      suggestedLesson: recent?.tutor_lesson_id
        ? { id: recent.tutor_lesson_id, title: recent.lesson_title }
        : null,
      plan: access.plan,
      messagesUsed: access.messagesUsed,
      monthlyLimit: access.monthlyLimit,
      remainingMessages: access.remainingMessages,
      period: access.period,
      isPrivileged: access.isPrivileged,
    });
  } catch (error) {
    console.error("AI usage check error:", error);
    return NextResponse.json({ error: "Failed to check usage" }, { status: 500 });
  }
}
