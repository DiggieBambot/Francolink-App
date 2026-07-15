// End-to-end homework flow test against the running dev server (port 3001).
// Uses @supabase/ssr itself to mint correctly-formatted auth cookies from the
// captured sessions, then drives the real HTTP routes as student + tutor.

import dotenv from "dotenv";
dotenv.config({ path: "/Users/pc/Documents/Projects/francolink/.env.local" });
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const BASE = process.env.HW_BASE || "http://localhost:3001";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const svc = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { studentSession, tutorSession, studentId } = JSON.parse(fs.readFileSync("/tmp/fl-test-sessions.json"));

// Mint the exact cookies @supabase/ssr expects for a given session.
async function cookieHeaderFor(session) {
  const jar = new Map();
  const client = createServerClient(URL, ANON, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  await client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  // Force a persist by touching the session.
  await client.auth.getUser();
  return [...jar.entries()].map(([n, v]) => `${n}=${encodeURIComponent(v)}`).join("; ");
}

async function req(path, cookie, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
}

function assert(label, cond, extra = "") {
  console.log(`${cond ? "✅" : "❌"} ${label}${extra ? "  — " + extra : ""}`);
  if (!cond) process.exitCode = 1;
}

async function main() {
  console.log(`Target: ${BASE}\n`);

  const studentCookie = await cookieHeaderFor(studentSession);
  const tutorCookie = await cookieHeaderFor(tutorSession);
  assert("student cookie minted", studentCookie.includes("auth-token"));
  assert("tutor cookie minted", tutorCookie.includes("auth-token"));

  // Homework id for `fruits`.
  const { data: hw } = await svc.from("lesson_homework").select("id, questions").eq("lesson_slug", "fruits").single();
  const nQ = hw.questions.length;

  // Clean prior submission + assignment + notifications so the test is repeatable.
  await svc.from("homework_submissions").delete().eq("homework_id", hw.id).eq("student_id", studentId);
  await svc.from("homework_assignments").delete().eq("homework_id", hw.id).eq("student_id", studentId);
  await svc.from("notifications").delete().eq("user_id", studentId);

  const answers = Array.from({ length: nQ }, (_, i) => `Réponse test ${i + 1}`);

  // 0. Submitting BEFORE assignment → 403 (assignment-gated).
  const pre = await req("/api/homework/submit", studentCookie, { homeworkId: hw.id, answers });
  assert("submit before assignment → 403", pre.status === 403, `status ${pre.status}`);

  // 0b. Tutor assigns the homework to the student.
  const assign = await req("/api/homework/assign", tutorCookie, { slug: "fruits", studentIds: [studentId] });
  assert("tutor assign → 200", assign.status === 200, `status ${assign.status} ${JSON.stringify(assign.json)}`);
  assert("assigned count 1", assign.json?.assigned === 1);

  // 0c. Student got a 'homework_assigned' notification.
  const { data: notifs1 } = await svc.from("notifications").select("type").eq("user_id", studentId);
  assert("student notified of assignment", (notifs1 || []).some((n) => n.type === "homework_assigned"));

  // 1. Student submits.
  const sub = await req("/api/homework/submit", studentCookie, { homeworkId: hw.id, answers });
  assert("student submit → 200", sub.status === 200, `status ${sub.status} ${JSON.stringify(sub.json)}`);
  assert("submission tutor_id captured", !!sub.json?.submission?.tutor_id);
  assert("submission status submitted", sub.json?.submission?.status === "submitted");
  const submissionId = sub.json?.submission?.id;

  // 2. Student re-submits (edit before review) → still 200.
  const resub = await req("/api/homework/submit", studentCookie, {
    homeworkId: hw.id,
    answers: answers.map((a) => a + " (edited)"),
  });
  assert("student re-submit before review → 200", resub.status === 200, `status ${resub.status}`);

  // 3. Tutor reviews.
  const rev = await req("/api/homework/review", tutorCookie, { submissionId, feedback: "Très bien ! Keep going." });
  assert("tutor review → 200", rev.status === 200, `status ${rev.status} ${JSON.stringify(rev.json)}`);
  assert("review status reviewed", rev.json?.submission?.status === "reviewed");
  assert("feedback saved", rev.json?.submission?.tutor_feedback?.includes("Très bien"));

  // 4. Student cannot edit after review → 409.
  const after = await req("/api/homework/submit", studentCookie, { homeworkId: hw.id, answers });
  assert("student edit after review → 409", after.status === 409, `status ${after.status}`);

  // 5. Student cannot review (not a tutor) → 403.
  const badRev = await req("/api/homework/review", studentCookie, { submissionId, feedback: "x" });
  assert("student calling review → 403", badRev.status === 403, `status ${badRev.status}`);

  // 5b. Review fired a 'homework_reviewed' notification to the student.
  const { data: notifs2 } = await svc.from("notifications").select("type").eq("user_id", studentId);
  assert("student notified of review", (notifs2 || []).some((n) => n.type === "homework_reviewed"));

  // 6. Tutor generate for a non-batch lesson → 200 draft (does not go live).
  const gen = await req("/api/homework/generate", tutorCookie, { slug: "cuisine" });
  assert("tutor generate draft → 200", gen.status === 200, `status ${gen.status} ${JSON.stringify(gen.json).slice(0,120)}`);
  assert("generated homework is draft + disabled",
    gen.json?.homework?.status === "draft" && gen.json?.homework?.enabled === false);

  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
