// scripts/create-test-session.mjs
//
// Create a tutor_lesson_sessions row for testing the live room.
// Usage:
//   node scripts/create-test-session.mjs <tutor_email> <student_email> <tutor_lesson_slug>
//
// Prints the session ID and the URL to visit in two browsers (one logged in as
// each side).

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const [, , tutorEmail, studentEmail, lessonSlug] = process.argv;
if (!tutorEmail || !studentEmail || !lessonSlug) {
  console.error(
    "Usage: node scripts/create-test-session.mjs <tutor_email> <student_email> <tutor_lesson_slug>"
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUserIdByEmail(email) {
  const { data: row, error } = await supabase
    .from("users")
    .select("id, role, first_name")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  if (!row) throw new Error(`No user with email: ${email}`);
  return row;
}

const tutor = await getUserIdByEmail(tutorEmail);
const student = await getUserIdByEmail(studentEmail);
console.log(`Tutor:   ${tutor.first_name || tutor.id} (${tutor.role})`);
console.log(`Student: ${student.first_name || student.id} (${student.role})`);

const { data: lesson, error: lessonErr } = await supabase
  .from("tutor_lessons")
  .select("id, title")
  .eq("slug", lessonSlug)
  .maybeSingle();
if (lessonErr) throw lessonErr;
if (!lesson) {
  console.error(`No tutor_lessons row with slug: ${lessonSlug}`);
  process.exit(1);
}
console.log(`Lesson:  ${lesson.title} (${lesson.id})`);

const { data: session, error: insErr } = await supabase
  .from("tutor_lesson_sessions")
  .insert({
    tutor_id: tutor.id,
    student_id: student.id,
    tutor_lesson_id: lesson.id,
    status: "active",
    started_at: new Date().toISOString(),
    title: `Test session: ${lesson.title}`,
  })
  .select("id")
  .single();
if (insErr) throw insErr;

console.log(`\n✓ Session ${session.id} created.`);
console.log(`\nOpen in two browser windows (logged in as each side):`);
console.log(`  http://localhost:3000/room/${session.id}`);
