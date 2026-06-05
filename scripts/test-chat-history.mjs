import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REF = URL.replace("https://", "").split(".")[0];
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ROOM = "4d1267b7-83f7-4646-8df3-2bcd7595e11c";

function cookieHeader(session) {
  const name = `sb-${REF}-auth-token`;
  const b64 = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const MAX = 3180;
  if (b64.length <= MAX) return `${name}=${b64}`;
  const ch = [];
  for (let i = 0, x = 0; i < b64.length; i += MAX, x++) ch.push(`${name}.${x}=${b64.slice(i, i + MAX)}`);
  return ch.join("; ");
}
async function login(email) {
  const c = createClient(URL, ANON);
  const { data } = await c.auth.signInWithPassword({ email, password: "FrancoTest!2026" });
  return cookieHeader(data.session);
}

const tutorCookie = await login("demo.tutor@francolink.test");
const studentCookie = await login("demo.student@francolink.test");

const stamp = "hist-" + Date.now();

// Tutor posts a message via the chat API.
const post = await fetch(`http://localhost:3000/api/space/${ROOM}/chat`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: tutorCookie },
  body: JSON.stringify({ text: stamp + " from tutor", name: "Demo Tutor", role: "tutor" }),
});
console.log("tutor chat POST:", post.status);

// Student (link-joined, NOT an RLS member) posts too.
const post2 = await fetch(`http://localhost:3000/api/space/${ROOM}/chat`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: studentCookie },
  body: JSON.stringify({ text: stamp + " from student", name: "Demo Student", role: "student" }),
});
console.log("student chat POST:", post2.status);

await new Promise((r) => setTimeout(r, 400));

// Re-open the room as the student — history should include BOTH messages.
const html = await (await fetch(`http://localhost:3000/room/${ROOM}`, { headers: { cookie: studentCookie } })).text();
const ok1 = html.includes(stamp + " from tutor");
const ok2 = html.includes(stamp + " from student");
console.log("student room shows tutor msg:", ok1);
console.log("student room shows student msg:", ok2);
process.exit(post.ok && post2.ok && ok1 && ok2 ? 0 : 1);
