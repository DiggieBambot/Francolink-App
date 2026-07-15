// Tests the room-link "Join class" flow against the running dev server.
import dotenv from "dotenv";
dotenv.config({ path: "/Users/pc/Documents/Projects/francolink/.env.local" });
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const BASE = "http://localhost:3001";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const svc = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TUTOR = "a63f218e-e463-43f0-b822-e4c79ac3dc50";
const STUDENT = "1fd7438d-1e08-4b3b-be3f-7e0c96bfe659";

async function studentCookie() {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data } = await c.auth.signInWithPassword({ email: "fl-student@example.com", password: "FrancoTest!2026" });
  const jar = new Map();
  const ssr = createServerClient(URL, ANON, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (l) => l.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  await ssr.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  return [...jar.entries()].map(([n, v]) => `${n}=${encodeURIComponent(v)}`).join("; ");
}

function assert(label, cond, extra = "") {
  console.log(`${cond ? "✅" : "❌"} ${label}${extra ? "  — " + extra : ""}`);
  if (!cond) process.exitCode = 1;
}

async function main() {
  const cookie = await studentCookie();

  // Disconnect the test student so the prompt/flow applies.
  await svc.from("users").update({ referred_by_tutor_id: null }).eq("id", STUDENT);
  await svc.from("tutor_students").delete().eq("tutor_id", TUTOR).eq("student_id", STUDENT);

  // A published lesson to attach to the room.
  const { data: lesson } = await svc.from("tutor_lessons").select("id").eq("status", "published").limit(1).single();

  // Create an OPEN classroom owned by the tutor (student_id === tutor_id sentinel).
  const { data: room, error: roomErr } = await svc
    .from("tutor_lesson_sessions")
    .insert({ tutor_id: TUTOR, student_id: TUTOR, tutor_lesson_id: lesson.id, status: "active", started_at: new Date().toISOString() })
    .select("id")
    .single();
  if (roomErr) throw new Error("room insert: " + roomErr.message);
  console.log("room:", room.id);

  // 1. Student joins the class from the room.
  const r1 = await fetch(`${BASE}/api/tutor/join-from-room`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ sessionId: room.id }),
  });
  const j1 = await r1.json();
  assert("join-from-room → 200 pending", r1.status === 200 && j1.status === "pending", `status ${r1.status} ${JSON.stringify(j1)}`);

  // 2. A pending tutor_students row exists, referred_by still null (not auto-attributed).
  const { data: rel } = await svc.from("tutor_students").select("status").eq("tutor_id", TUTOR).eq("student_id", STUDENT).maybeSingle();
  const { data: me } = await svc.from("users").select("referred_by_tutor_id").eq("id", STUDENT).maybeSingle();
  assert("pending request row created", !!rel);
  assert("referred_by NOT set yet (tutor must accept)", me?.referred_by_tutor_id == null);

  // 3. Idempotent second call.
  const r2 = await fetch(`${BASE}/api/tutor/join-from-room`, {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ sessionId: room.id }),
  });
  assert("second join call ok", r2.status === 200);

  // 4. Room HTML shows the prompt only BEFORE a request exists — verify the copy
  //    is wired by checking the component string renders when unconnected+no row.
  //    (Reset to unconnected + no row, fetch room as student.)
  await svc.from("users").update({ referred_by_tutor_id: null }).eq("id", STUDENT);
  await svc.from("tutor_students").delete().eq("tutor_id", TUTOR).eq("student_id", STUDENT);
  const html = await (await fetch(`${BASE}/room/${room.id}`, { headers: { Cookie: cookie } })).text();
  assert("room shows Join-class prompt for unconnected student", /Join .*class\?/.test(html), html.includes("Join") ? "" : "no Join copy found");

  // Cleanup: reconnect the student (so homework tests keep working) + drop the room.
  await svc.from("users").update({ referred_by_tutor_id: TUTOR }).eq("id", STUDENT);
  await svc.from("tutor_students").upsert(
    { tutor_id: TUTOR, student_id: STUDENT, status: "active", assigned_at: new Date().toISOString() },
    { onConflict: "tutor_id,student_id" }
  );
  await svc.from("tutor_lesson_sessions").delete().eq("id", room.id);
  console.log("\nDone (student reconnected, room removed).");
}

main().catch((e) => { console.error(e); process.exit(1); });
