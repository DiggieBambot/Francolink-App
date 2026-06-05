// scripts/test-auth-runtime.mjs
//
// Runtime smoke test of the real authenticated routes. Creates a test student
// and tutor, signs them in, forges the @supabase/ssr session cookie, and hits
// the actual dashboard/lesson routes on the running dev server — checking each
// renders (HTTP 200, no Next error boundary). Cleans up after.
//
//   (dev server must be running on :3000)
//   node scripts/test-auth-runtime.mjs

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REF = URL.replace("https://", "").split(".")[0];
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BASE = "http://localhost:3000";
const TAG = "rt_" + Date.now();
const created = [];

// Build the @supabase/ssr cookie(s) for a session (base64- prefixed, chunked).
function sessionCookies(session) {
  const name = `sb-${REF}-auth-token`;
  const json = JSON.stringify(session);
  const b64 = "base64-" + Buffer.from(json, "utf8").toString("base64url");
  const MAX = 3180;
  if (b64.length <= MAX) return [`${name}=${b64}`];
  const chunks = [];
  for (let i = 0, idx = 0; i < b64.length; i += MAX, idx++) {
    chunks.push(`${name}.${idx}=${b64.slice(i, i + MAX)}`);
  }
  return chunks;
}

async function makeUser(email, role) {
  const password = "Test123!" + TAG;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error("create: " + error.message);
  const id = data.user.id;
  created.push(id);
  await admin.from("users").upsert({ id, email, name: role + " Test", role });
  // Sign in (anon client) to get a real session.
  const anonClient = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: si, error: sierr } = await anonClient.auth.signInWithPassword({ email, password });
  if (sierr) throw new Error("signin: " + sierr.message);
  return { id, session: si.session };
}

async function checkRoute(path, session, label) {
  const cookies = sessionCookies(session).join("; ");
  const res = await fetch(BASE + path, { headers: { cookie: cookies }, redirect: "manual" });
  const body = res.status < 300 ? await res.text() : "";
  const hasError = /Application error|Internal Server Error|Unhandled Runtime|error-boundary|This page could not be found/i.test(body);
  const loc = res.headers.get("location") || "";
  const ok = (res.status === 200 && !hasError) || (res.status >= 300 && res.status < 400);
  const detail = res.status >= 300 ? `→ ${loc}` : hasError ? "(error in body!)" : "";
  console.log(`  ${ok ? "✓" : "✗"} [${res.status}] ${label}: ${path} ${detail}`);
  return ok;
}

let pass = 0, fail = 0;
const track = (ok) => (ok ? pass++ : fail++);

try {
  console.log("Creating test users + sessions…");
  const student = await makeUser(`${TAG}_student@test.local`, "STUDENT");
  const tutor = await makeUser(`${TAG}_tutor@test.local`, "TUTOR");
  // give tutor an invite code
  await admin.from("users").update({ tutor_invite_code: TAG.toUpperCase().slice(0, 8), tutor_plan: "free" }).eq("id", tutor.id);
  console.log("  student + tutor ready\n");

  // grab a published lesson slug
  const { data: lesson } = await admin.from("tutor_lessons").select("slug").eq("status", "published").limit(1).single();

  console.log("STUDENT routes:");
  track(await checkRoute("/dashboard", student.session, "student dashboard"));
  track(await checkRoute("/library", student.session, "catalogue"));
  if (lesson) track(await checkRoute(`/library/lesson/${lesson.slug}`, student.session, "lesson (student view)"));
  // student hitting tutor area should redirect away
  track(await checkRoute("/tutor", student.session, "tutor area (should redirect)"));

  console.log("\nTUTOR routes:");
  track(await checkRoute("/tutor", tutor.session, "tutor dashboard"));
  track(await checkRoute("/tutor/students", tutor.session, "tutor students (invite box)"));
  track(await checkRoute("/tutor/sessions/new", tutor.session, "new session form"));
  if (lesson) track(await checkRoute(`/library/lesson/${lesson.slug}`, tutor.session, "lesson (tutor view)"));

  console.log(`\n${fail === 0 ? "✅" : "⚠️"} ${pass} passed, ${fail} failed`);
} catch (e) {
  console.error("\n❌ " + e.message);
} finally {
  console.log("\nCleanup…");
  for (const id of created) {
    await admin.from("users").delete().eq("id", id);
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
  console.log("  removed", created.length, "test users");
}
