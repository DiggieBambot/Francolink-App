// Create two connected test accounts (a tutor + a student) for homework testing.
// Idempotent: re-running reuses existing auth users by email.
//
//   node scripts/setup-test-accounts.mjs
//
// Prints the login credentials and a fresh signed-in session for each.

import dotenv from "dotenv";
dotenv.config({ path: "/Users/pc/Documents/Projects/francolink/.env.local" });
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const PASSWORD = "FrancoTest!2026";
const TUTOR = { email: "fl-tutor@example.com", name: "Test Tutor" };
const STUDENT = { email: "fl-student@example.com", name: "Test Student" };

async function findUserByEmail(email) {
  // admin.listUsers is paginated; scan a few pages.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

async function ensureAuthUser(email) {
  let u = await findUserByEmail(email);
  if (u) {
    // Make sure the password is what we expect.
    await admin.auth.admin.updateUserById(u.id, { password: PASSWORD, email_confirm: true });
    return u.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  console.log("DB host:", URL.slice(8, 20));

  const tutorId = await ensureAuthUser(TUTOR.email);
  const studentId = await ensureAuthUser(STUDENT.email);

  // Tutor profile.
  const inviteCode = "test-tutor";
  await admin.from("users").upsert(
    {
      id: tutorId,
      email: TUTOR.email,
      name: TUTOR.name,
      role: "TUTOR",
      is_active: true,
      subscription_plan: "FREE",
      learning_language: "fr",
      email_marketing_opt_out: true,
      tutor_invite_code: inviteCode,
      tutor_plan: "pro",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  // Student profile — connected to the tutor (referred_by_tutor_id drives
  // homework routing + the tutor's People list).
  await admin.from("users").upsert(
    {
      id: studentId,
      email: STUDENT.email,
      name: STUDENT.name,
      role: "USER",
      is_active: true,
      subscription_plan: "FREE",
      learning_language: "fr",
      email_marketing_opt_out: true,
      referred_by_tutor_id: tutorId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  // Relationship row (accepted).
  await admin.from("tutor_students").upsert(
    { tutor_id: tutorId, student_id: studentId, status: "active", assigned_at: new Date().toISOString() },
    { onConflict: "tutor_id,student_id" }
  );

  // Grab a fresh session for each (for cookie-based API testing).
  async function session(email) {
    const c = createClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
    if (error) return { error: error.message };
    return { access_token: data.session.access_token, refresh_token: data.session.refresh_token };
  }

  const tutorSession = await session(TUTOR.email);
  const studentSession = await session(STUDENT.email);

  console.log("\n=== TEST ACCOUNTS (login at /login) ===");
  console.log(`Tutor:   ${TUTOR.email}   /   ${PASSWORD}   (id ${tutorId})`);
  console.log(`Student: ${STUDENT.email}   /   ${PASSWORD}   (id ${studentId})`);
  console.log("Invite code:", inviteCode);

  const out = { tutorId, studentId, tutorSession, studentSession, password: PASSWORD };
  const fs = await import("node:fs");
  fs.writeFileSync("/tmp/fl-test-sessions.json", JSON.stringify(out, null, 2));
  console.log("\nSessions written to /tmp/fl-test-sessions.json");
  console.log("student token ok:", !!studentSession.access_token, "| tutor token ok:", !!tutorSession.access_token);
}

main().catch((e) => { console.error(e); process.exit(1); });
