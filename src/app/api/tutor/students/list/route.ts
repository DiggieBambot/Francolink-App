// GET /api/tutor/students/list
// The signed-in tutor's active students ({ id, name }), for client-side
// pickers. Same source of truth as every server-side "my students" read:
// tutor_students via lib/tutor/students.ts — never users.referred_by_tutor_id,
// which is the commission field and misses students who joined from a public
// profile or by booking.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTutorStudents } from "@/lib/tutor/students";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const students = await getTutorStudents(user.id);
  return NextResponse.json({ students: students.map((s) => ({ id: s.id, name: s.name })) });
}
