// scripts/test-become-tutor-flow.mjs
//
// End-to-end runtime test of the "become a tutor" + sign-out flow against the
// running dev server (:3000). Creates a real student, forges the @supabase/ssr
// session cookie, and verifies:
//   1. /become-tutor renders (200, no error boundary) for a logged-in student
//   2. POST /api/auth/become-tutor upgrades the role to TUTOR (+ invite code)
//   3. /tutor dashboard then renders for that same user
//   4. /auth/signout 303-redirects to /login and expires the sb-* cookies
// Cleans up after.
//
//   node scripts/test-become-tutor-flow.mjs

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REF = URL.replace("https://", "").split(".")[0];
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BASE = "http://localhost:3000";
const TAG = "bt_" + Date.now();
const created = [];

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

async function makeStudent(email) {
  const password = "Test123!" + TAG;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error("create: " + error.message);
  const id = data.user.id;
  created.push(id);
  await admin.from("users").upsert({ id, email, name: "Student Test", role: "STUDENT" });
  const anonClient = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: si, error: sierr } = await anonClient.auth.signInWithPassword({ email, password });
  if (sierr) throw new Error("signin: " + sierr.message);
  return { id, session: si.session };
}

let pass = 0, fail = 0;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label} ${detail}`);
  ok ? pass++ : fail++;
};

try {
  console.log("Creating test student + session…");
  const student = await makeStudent(`${TAG}_student@test.local`);
  const cookie = sessionCookies(student.session).join("; ");
  console.log("  ready\n");

  // 1. become-tutor page renders for a logged-in student
  console.log("1) /become-tutor page (logged-in student):");
  {
    const res = await fetch(BASE + "/become-tutor", { headers: { cookie }, redirect: "manual" });
    const body = res.status === 200 ? await res.text() : "";
    const notFound = /This page could not be found|Application error/i.test(body);
    const hasUpgrade = /Become a Tutor|Upgrade to Tutor/i.test(body);
    check(res.status === 200 && !notFound && hasUpgrade, "renders upgrade page", `[${res.status}]`);
  }

  // 2. POST the upgrade
  console.log("\n2) POST /api/auth/become-tutor:");
  {
    const res = await fetch(BASE + "/api/auth/become-tutor", { method: "POST", headers: { cookie } });
    const json = await res.json().catch(() => ({}));
    check(res.status === 200 && json.success === true, "API returns success", `[${res.status}] code=${json.inviteCode || "?"}`);

    const { data: row } = await admin.from("users").select("role, tutor_plan, tutor_invite_code, student_limit").eq("id", student.id).single();
    check(row?.role === "TUTOR", "DB role is now TUTOR", `(role=${row?.role})`);
    check(!!row?.tutor_invite_code, "invite code persisted", `(${row?.tutor_invite_code})`);
  }

  // 3. tutor dashboard renders for the upgraded user (fresh session not needed — role read server-side)
  console.log("\n3) /tutor dashboard (now a tutor):");
  {
    const res = await fetch(BASE + "/tutor", { headers: { cookie }, redirect: "manual" });
    const body = res.status === 200 ? await res.text() : "";
    const notFound = /This page could not be found|Application error/i.test(body);
    // 200 render OR a non-login redirect both acceptable; a redirect to /dashboard would be the bug
    const loc = res.headers.get("location") || "";
    const bad = loc.includes("/dashboard") || loc.includes("/login");
    check((res.status === 200 && !notFound) || (res.status >= 300 && res.status < 400 && !bad), "tutor dashboard reachable", `[${res.status}]${loc ? " → " + loc : ""}`);
  }

  // 4. sign-out
  console.log("\n4) /auth/signout:");
  {
    const res = await fetch(BASE + "/auth/signout", { headers: { cookie }, redirect: "manual" });
    const loc = res.headers.get("location") || "";
    const setCookie = res.headers.get("set-cookie") || "";
    check(res.status === 303 && loc.includes("/login"), "303 → /login", `[${res.status}]`);
    check(/Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(setCookie), "expires auth cookies", "");
  }

  console.log(`\n${fail === 0 ? "✅ ALL PASS" : "⚠️ FAILURES"} — ${pass} passed, ${fail} failed`);
} catch (e) {
  console.error("\n❌ " + e.message);
  fail++;
} finally {
  console.log("\nCleanup…");
  for (const id of created) {
    await admin.from("users").delete().eq("id", id);
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
  console.log("  removed", created.length, "test users");
  process.exit(fail === 0 ? 0 : 1);
}
