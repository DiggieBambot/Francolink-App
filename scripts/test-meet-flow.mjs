// Runtime smoke test for the Google-Meet-style classroom flow.
//   node scripts/test-meet-flow.mjs   (dev server must be on :3000)
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REF = URL.replace("https://", "").split(".")[0];
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE = "http://localhost:3000";

function sessionCookies(session) {
  const name = `sb-${REF}-auth-token`;
  const b64 = "base64-" + Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const MAX = 3180;
  if (b64.length <= MAX) return [`${name}=${b64}`];
  const chunks = [];
  for (let i = 0, idx = 0; i < b64.length; i += MAX, idx++) chunks.push(`${name}.${idx}=${b64.slice(i, i + MAX)}`);
  return chunks;
}
async function signIn(email) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password: "FrancoTest!2026" });
  if (error) throw new Error(`${email}: ${error.message}`);
  return data.session;
}
async function get(path, session, redirect = "manual") {
  const res = await fetch(BASE + path, { headers: { cookie: sessionCookies(session).join("; ") }, redirect });
  const body = res.status < 300 ? await res.text() : "";
  return { status: res.status, location: res.headers.get("location"), body };
}
const errIn = (b) => /Application error|Internal Server Error|Unhandled Runtime|This page could not be found/i.test(b);

(async () => {
  const tutor = await signIn("demo.tutor@francolink.test");
  const student = await signIn("demo.student@francolink.test");
  let pass = true;
  const ok = (c, label, extra = "") => { console.log(`${c ? "✅" : "❌"} ${label}${extra ? "  " + extra : ""}`); if (!c) pass = false; };

  // 1. People tab renders with the new sections
  const ppl = await get("/tutor/students", tutor);
  ok(ppl.status === 200 && !errIn(ppl.body), "People tab renders", `(${ppl.status})`);
  ok(/Your live classroom/.test(ppl.body), "  shows 'Your live classroom' card");
  ok(/Wants to join/.test(ppl.body), "  shows 'Wants to join' panel");
  ok(/Marie Pending|demo\.pending/.test(ppl.body), "  lists the pending request");
  ok(/Invite to class/.test(ppl.body), "  per-student 'Invite to class' button");

  // 2. Start a session → redirect into a /room/[id]
  const start = await get("/space/new", tutor);
  const roomMatch = (start.location || "").match(/\/room\/([0-9a-f-]{36})/);
  ok(start.status === 307 && !!roomMatch, "Start a session redirects to /room/[id]", start.location || "");
  const roomPath = roomMatch ? `/room/${roomMatch[1]}` : null;

  if (roomPath) {
    // 3. Tutor opens the room
    const asTutor = await get(roomPath, tutor, "follow");
    ok(asTutor.status === 200 && !errIn(asTutor.body), "Tutor renders the classroom", `(${asTutor.status})`);
    ok(/Invite|Pick a lesson to begin|Live space/.test(asTutor.body), "  room UI present (Invite / pick lesson)");

    // 4. Student opens the SAME link (no pre-connection) and joins
    const asStudent = await get(roomPath, student, "follow");
    ok(asStudent.status === 200 && !errIn(asStudent.body), "Student joins via link", `(${asStudent.status})`);
    ok(!/not in this session/i.test(asStudent.body), "  student is NOT rejected");

    // 5. Re-open as tutor → reuses the SAME room (stable link)
    const start2 = await get("/space/new", tutor);
    ok(start2.location === start.location, "Re-opening reuses the same classroom link", start2.location || "");
  }

  // 6. Dashboard still renders
  const dash = await get("/tutor", tutor);
  ok(dash.status === 200 && !errIn(dash.body), "Tutor dashboard renders", `(${dash.status})`);

  console.log(pass ? "\n🎉 ALL PASS" : "\n⚠️  FAILURES ABOVE");
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error("💥", e.message); process.exit(1); });
