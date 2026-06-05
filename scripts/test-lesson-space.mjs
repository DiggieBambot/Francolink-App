// Runtime test of the shared lesson space: connect a tutor+student, open the
// space via /space/open, confirm the room loads, and switch the lesson.
//   node scripts/test-lesson-space.mjs   (dev server on :3000)

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REF = URL.replace("https://", "").split(".")[0];
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BASE = "http://localhost:3000";
const TAG = "ls_" + Date.now();
const created = [];

function cookieHeader(session) {
  const name = `sb-${REF}-auth-token`;
  const b64 = "base64-" + Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const MAX = 3180;
  if (b64.length <= MAX) return `${name}=${b64}`;
  const parts = [];
  for (let i = 0, idx = 0; i < b64.length; i += MAX, idx++) parts.push(`${name}.${idx}=${b64.slice(i, i + MAX)}`);
  return parts.join("; ");
}
async function makeUser(email, role) {
  const password = "Test123!" + TAG;
  const { data } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  created.push(data.user.id);
  await admin.from("users").upsert({ id: data.user.id, email, name: role + " Test", role });
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: si } = await c.auth.signInWithPassword({ email, password });
  return { id: data.user.id, session: si.session };
}
const A = (cond, msg) => { if (!cond) throw new Error("FAIL: " + msg); console.log("  ✓ " + msg); };

try {
  const tutor = await makeUser(`${TAG}_t@test.local`, "TUTOR");
  const student = await makeUser(`${TAG}_s@test.local`, "STUDENT");
  // connect them
  await admin.from("users").update({ referred_by_tutor_id: tutor.id }).eq("id", student.id);
  await admin.from("tutor_students").insert({ tutor_id: tutor.id, student_id: student.id, status: "active" });
  console.log("tutor + student connected\n");

  // 1. Tutor opens the space
  const open = await fetch(`${BASE}/space/open?partner=${student.id}`, {
    headers: { cookie: cookieHeader(tutor.session) }, redirect: "manual",
  });
  const loc = open.headers.get("location") || "";
  A(open.status >= 300 && /\/room\//.test(loc), `/space/open → redirect to room (${loc.split("/").pop()})`);
  const roomId = loc.split("/room/")[1];

  // 2. Both can load the room
  const tRoom = await fetch(`${BASE}/room/${roomId}`, { headers: { cookie: cookieHeader(tutor.session) } });
  A(tRoom.status === 200, "tutor loads room (no-lesson state) 200");
  const sRoom = await fetch(`${BASE}/room/${roomId}`, { headers: { cookie: cookieHeader(student.session) } });
  A(sRoom.status === 200, "student loads same room 200");

  // 3. Pick a lesson via the API
  const { data: lesson } = await admin.from("tutor_lessons").select("id, title").eq("status", "published").limit(1).single();
  const setRes = await fetch(`${BASE}/api/space/${roomId}/lesson`, {
    method: "POST", headers: { cookie: cookieHeader(student.session), "content-type": "application/json" },
    body: JSON.stringify({ lessonId: lesson.id }),
  });
  A(setRes.status === 200, `student sets lesson "${lesson.title}" → 200`);

  // 4. Space row now has the lesson
  const { data: sp } = await admin.from("tutor_lesson_sessions").select("tutor_lesson_id").eq("id", roomId).single();
  A(sp.tutor_lesson_id === lesson.id, "space.tutor_lesson_id persisted");

  // 5. Lesson content API works (for live swap)
  const cRes = await fetch(`${BASE}/api/lessons/${lesson.id}`, { headers: { cookie: cookieHeader(tutor.session) } });
  A(cRes.status === 200, "GET /api/lessons/[id] returns content 200");

  console.log("\n✅ Lesson space flow works end-to-end.");
} catch (e) {
  console.error("\n❌ " + e.message);
} finally {
  console.log("\nCleanup…");
  for (const id of created) {
    await admin.from("tutor_lesson_sessions").delete().eq("tutor_id", id);
    await admin.from("tutor_lesson_sessions").delete().eq("student_id", id);
    await admin.from("tutor_students").delete().eq("tutor_id", id);
    await admin.from("tutor_students").delete().eq("student_id", id);
    await admin.from("users").delete().eq("id", id);
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
  console.log("  removed", created.length, "users + their space");
}
