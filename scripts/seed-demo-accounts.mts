// Create (or refresh) the two demo accounts used to film the student and
// tutor dashboards for social videos.
//
//   npx tsx scripts/seed-demo-accounts.mts
//
// Both live on the reserved @demo.francolink.net domain (see src/lib/demo.ts),
// so admin metrics skip them and no email is ever sent to them. The tutor gets
// an approved but never-public profile with bookings off, so real students
// can't find or book them. Nothing financial is written: no payments, no
// commission ledger rows.
//
// Passwords are generated once and stored in .env.local as DEMO_STUDENT_* and
// DEMO_TUTOR_*. Re-running is safe: it resets the passwords to those values and
// refreshes the activity so the streak and "last active" stay current.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { config } from "dotenv";
config({ path: ".env.local" });
import { appendFileSync } from "fs";
import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { DEMO_EMAIL_DOMAIN } from "../src/lib/demo";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const DAY = 86_400_000;
const today = new Date();
const iso = (d: Date) => d.toISOString();
const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

function credential(kind: "STUDENT" | "TUTOR", localPart: string) {
  const email = process.env[`DEMO_${kind}_EMAIL`] || `${localPart}@${DEMO_EMAIL_DOMAIN}`;
  let password = process.env[`DEMO_${kind}_PASSWORD`];
  if (!password) {
    password = randomBytes(12).toString("base64url");
    appendFileSync(".env.local", `\n# Demo account for filming (scripts/seed-demo-accounts.mts)\nDEMO_${kind}_EMAIL=${email}\nDEMO_${kind}_PASSWORD=${password}\n`);
  }
  return { email, password };
}

async function authUser(email: string, password: string, name: string): Promise<string> {
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) {
      await db.auth.admin.updateUserById(hit.id, { password, email_confirm: true });
      return hit.id;
    }
    if (data.users.length < 1000) break;
  }
  // email_confirm: true marks it verified and sends no confirmation email.
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
  if (error) throw error;
  return data.user.id;
}

const problems: string[] = [];
async function write(label: string, q: PromiseLike<{ error: any }>) {
  const { error } = await q;
  if (error) problems.push(`${label}: ${error.message}`);
}

const student = credential("STUDENT", "student");
const tutor = credential("TUTOR", "tutor");
const studentId = await authUser(student.email, student.password, "Alex Morgan");
const tutorId = await authUser(tutor.email, tutor.password, "Claire Dubois");

// The invite code shows on camera; resolveJoinTarget refuses demo tutors, so it can't be redeemed.
await write("tutor row", db.from("users").upsert({
  id: tutorId, email: tutor.email, name: "Claire Dubois", role: "TUTOR",
  tutor_plan: "FREE", tutor_invite_code: "DEMOCLAIRE", student_limit: 5,
  timezone: "America/Toronto", signup_source: "demo", updated_at: iso(today),
}));
await write("student row", db.from("users").upsert({
  id: studentId, email: student.email, name: "Alex Morgan", role: "USER",
  learning_language: "fr", subscription_plan: "PREMIUM",
  current_streak: 12, longest_streak: 21, total_xp: 1840,
  last_activity_date: dateOnly(today), last_seen_at: iso(today),
  placement_test_taken: true, placement_test_level: "A2",
  referred_by_tutor_id: tutorId, signup_source: "demo", updated_at: iso(today),
}));
await write("student language", db.from("user_languages").upsert(
  { user_id: studentId, language_code: "fr", placement_taken: true, placement_level: "A2" },
  { onConflict: "user_id,language_code" },
));

// Approved FrancoLink tutor, but never listed and not bookable.
await write("tutor profile", db.from("tutor_public_profiles").upsert({
  user_id: tutorId, slug: "demo-claire-dubois",
  headline: "Conversational French and TCF Canada prep",
  bio: "Demo profile used for product videos.",
  teaches: ["fr"], speaks: ["fr", "en"], levels: ["A1", "A2", "B1", "B2"],
  specialties: ["TCF Canada", "Conversation"], years_experience: 8,
  country: "CA", timezone: "America/Toronto",
  is_public: false, accepts_bookings: false, approval_status: "approved",
}, { onConflict: "user_id" }));

await write("tutor-student link", db.from("tutor_students").upsert(
  { tutor_id: tutorId, student_id: studentId, status: "active", assigned_at: iso(new Date(+today - 40 * DAY)) },
  { onConflict: "tutor_id,student_id" },
));

// The first nine lessons of French A1, completed over the last few weeks.
const { data: courses } = await db.from("courses")
  .select("id, slug, level, units ( id, order_index, lessons ( id, order_index ) )")
  .like("slug", "french-%").eq("is_published", true).order("level").limit(1);
const lessons = (courses?.[0]?.units ?? [])
  .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
  .flatMap((u: any) => (u.lessons ?? []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)))
  .slice(0, 9);
if (!lessons.length) problems.push("lesson progress: no published French course found");
await write("reset lesson progress", db.from("lesson_progress").delete().eq("user_id", studentId));
for (const [i, l] of lessons.entries()) {
  await write(`lesson ${i + 1}`, db.from("lesson_progress").insert({
    user_id: studentId, lesson_id: l.id, status: "COMPLETED",
    completed_at: iso(new Date(+today - (lessons.length - i) * 2 * DAY)),
  }));
}

// Two past lessons and one coming up, so both dashboards show history and a next session.
await write("reset sessions", db.from("tutor_lesson_sessions").delete().eq("tutor_id", tutorId));
const at = (days: number, hour: number) => { const d = new Date(+today + days * DAY); d.setUTCHours(hour, 0, 0, 0); return d; };
await write("sessions", db.from("tutor_lesson_sessions").insert([
  { tutor_id: tutorId, student_id: studentId, title: "Ordering at a café", status: "completed",
    scheduled_at: iso(at(-7, 22)), started_at: iso(at(-7, 22)), ended_at: iso(new Date(+at(-7, 22) + 50 * 60_000)) },
  { tutor_id: tutorId, student_id: studentId, title: "TCF Canada: expression orale", status: "completed",
    scheduled_at: iso(at(-2, 22)), started_at: iso(at(-2, 22)), ended_at: iso(new Date(+at(-2, 22) + 50 * 60_000)) },
  { tutor_id: tutorId, student_id: studentId, title: "Talking about your weekend", status: "scheduled",
    scheduled_at: iso(at(2, 22)) },
]));

console.log(`Demo student: ${student.email}`);
console.log(`Demo tutor:   ${tutor.email}`);
console.log("Passwords are in .env.local (DEMO_STUDENT_PASSWORD, DEMO_TUTOR_PASSWORD).");
if (problems.length) {
  console.log(`\n${problems.length} write(s) failed; the accounts still work, those panels will just be emptier:`);
  for (const p of problems) console.log("  - " + p);
}
