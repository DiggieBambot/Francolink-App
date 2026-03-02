import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { language, level } = await request.json();
    if (!language || !level) {
      return NextResponse.json({ error: "language and level required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("certificates")
      .select("id, certificate_number")
      .eq("user_id", user.id)
      .eq("language", language)
      .eq("level", level.toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json({ certificate: existing, alreadyIssued: true });
    }

    const { data: course } = await supabase
      .from("courses")
      .select(`id, title, units ( lessons (id) )`)
      .eq("slug", `${language}-${level.toLowerCase()}`)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const allLessonIds = (course.units as any[])
      .flatMap((u: any) => u.lessons.map((l: any) => l.id));

    if (allLessonIds.length === 0) {
      return NextResponse.json({ error: "No lessons found" }, { status: 400 });
    }

    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id, score")
      .eq("user_id", user.id)
      .eq("status", "COMPLETED")
      .in("lesson_id", allLessonIds);

    const completedIds = new Set((progress || []).map((p: any) => p.lesson_id));
    const allCompleted = allLessonIds.every((id: string) => completedIds.has(id));

    if (!allCompleted) {
      return NextResponse.json({ error: "Level not fully completed" }, { status: 403 });
    }

    const scores = (progress || []).map((p: any) => p.score || 100);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 100;

    const { data: userData } = await supabase
      .from("users")
      .select("total_xp")
      .eq("id", user.id)
      .single();

    const { data: certNumData } = await supabase.rpc("generate_certificate_number", {
      p_language: language,
      p_level: level.toUpperCase(),
    });

    const certNumber = certNumData || `FL-${language.substring(0,2).toUpperCase()}-${level.toUpperCase()}-${Date.now()}`;

    const { data: certificate, error: insertError } = await supabase
      .from("certificates")
      .insert({
        user_id: user.id,
        language,
        level: level.toUpperCase(),
        course_title: course.title,
        certificate_number: certNumber,
        score: avgScore,
        total_xp: userData?.total_xp || 0,
        issued_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Certificate insert error:", insertError);
      return NextResponse.json({ error: "Failed to issue certificate" }, { status: 500 });
    }

    return NextResponse.json({ certificate, alreadyIssued: false });
  } catch (err) {
    console.error("Certificate issue error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
