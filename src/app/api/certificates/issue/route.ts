// Issue a certificate of completion for one level.
//
// Called by the website's level page (cookies) and by the app (bearer token,
// see lib/supabase/request-auth.ts). The body names the level either way:
//
//   { course_id }          the app, which knows the course it is showing
//   { language, level }    the website, from /learn/<language>/<level>
//
// A certificate needs every ACTIVE lesson in the course completed. Switched-
// off lessons used to count too, which made a level impossible to finish the
// moment anyone retired a lesson.
//
// Students cannot write the certificates table (20261005_certificates.sql),
// so the insert goes through the service role, after the check above. One
// per student per level: asking again returns the one they already have.

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getRequestAuth } from "@/lib/supabase/request-auth";

export const runtime = "nodejs";

const Body = z.union([
  z.object({ course_id: z.string().uuid() }),
  z.object({
    language: z.string().trim().min(2).max(20),
    level: z.string().trim().min(2).max(2),
  }),
]);

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** FL-FR-A1-7K3QX9MD: readable, and 40 random bits so nobody can guess one. */
function certificateNumber(language: string, level: string): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O, 1/I
  const bytes = randomBytes(8);
  const tail = [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
  return `FL-${language.slice(0, 2).toUpperCase()}-${level}-${tail}`;
}

const SELECT = "id, certificate_number, language, level, course_title, score, total_xp, issued_at";

export async function POST(request: Request) {
  const { user } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let input: z.infer<typeof Body>;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Send course_id, or language and level." }, { status: 400 });
  }

  const db = service();

  const courseQuery = db
    .from("courses")
    .select("id, slug, title, level, units(lessons(id, is_active))");
  const { data: course } = await ("course_id" in input
    ? courseQuery.eq("id", input.course_id)
    : courseQuery.eq("slug", `${input.language.toLowerCase()}-${input.level.toLowerCase()}`)
  ).maybeSingle();

  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // Certificates are keyed the way the website's URLs are: "french", "A1".
  const language = String(course.slug).split("-")[0];
  const level = String(course.level).toUpperCase();

  const { data: existing } = await db
    .from("certificates")
    .select(SELECT)
    .eq("user_id", user.id)
    .eq("language", language)
    .eq("level", level)
    .maybeSingle();
  if (existing) return NextResponse.json({ certificate: existing, alreadyIssued: true });

  const lessonIds = (course.units ?? [])
    .flatMap((u: { lessons: { id: string; is_active: boolean | null }[] | null }) => u.lessons ?? [])
    .filter((l) => l.is_active !== false)
    .map((l) => l.id);
  if (lessonIds.length === 0) {
    return NextResponse.json({ error: "This level has no lessons yet." }, { status: 400 });
  }

  const { data: progress } = await db
    .from("lesson_progress")
    .select("lesson_id, score")
    .eq("user_id", user.id)
    .eq("status", "COMPLETED")
    .in("lesson_id", lessonIds);

  const done = new Map((progress ?? []).map((p) => [p.lesson_id as string, p.score as number | null]));
  const remaining = lessonIds.filter((id) => !done.has(id)).length;
  if (remaining > 0) {
    return NextResponse.json(
      { error: `Finish the last ${remaining} lesson${remaining === 1 ? "" : "s"} to earn this certificate.`, remaining },
      { status: 403 }
    );
  }

  const scores = lessonIds.map((id) => done.get(id) ?? 100);
  const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const { data: me } = await db.from("users").select("total_xp").eq("id", user.id).single();

  const { data: certificate, error } = await db
    .from("certificates")
    .insert({
      user_id: user.id,
      language,
      level,
      course_title: course.title,
      certificate_number: certificateNumber(language, level),
      score,
      total_xp: me?.total_xp ?? 0,
      issued_at: new Date().toISOString(),
    })
    .select(SELECT)
    .single();

  if (error) {
    // 23505: a second request won the race. Theirs is the certificate.
    if (error.code === "23505") {
      const { data: won } = await db
        .from("certificates")
        .select(SELECT)
        .eq("user_id", user.id)
        .eq("language", language)
        .eq("level", level)
        .maybeSingle();
      if (won) return NextResponse.json({ certificate: won, alreadyIssued: true });
    }
    console.error("[certificates/issue] insert failed", error);
    return NextResponse.json({ error: "Couldn't issue the certificate. Try again." }, { status: 500 });
  }

  return NextResponse.json({ certificate, alreadyIssued: false });
}
