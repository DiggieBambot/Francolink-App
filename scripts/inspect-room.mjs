import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const REF = URL.replace("https://", "").split(".")[0];
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ROOM = "4d1267b7-83f7-4646-8df3-2bcd7595e11c";

function cookies(session) {
  const name = `sb-${REF}-auth-token`;
  const b64 = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
  const MAX = 3180;
  if (b64.length <= MAX) return [`${name}=${b64}`];
  const ch = [];
  for (let i = 0, x = 0; i < b64.length; i += MAX, x++) ch.push(`${name}.${x}=${b64.slice(i, i + MAX)}`);
  return ch;
}
async function fetchRoom(email) {
  const c = createClient(URL, ANON);
  const { data } = await c.auth.signInWithPassword({ email, password: "FrancoTest!2026" });
  const r = await fetch(`http://localhost:3000/room/${ROOM}`, { headers: { cookie: cookies(data.session).join("; ") } });
  return await r.text();
}

for (const email of ["demo.tutor@francolink.test", "demo.student@francolink.test"]) {
  const html = await fetchRoom(email);
  const highlightSpans = (html.match(/data-highlight-id/g) || []).length;
  console.log(`\n=== ${email} ===`);
  console.log("data-highlight-id spans:", highlightSpans);
  console.log("has 'Pick a lesson to begin':", html.includes("Pick a lesson to begin"));
  console.log("has tutor highlight hint:", html.includes("Click any French phrase"));
  console.log("has 'Show translation' chip:", html.includes("Show translation"));
  const m = html.match(/data-highlight-id="([^"]+)"/);
  console.log("first highlight id:", m ? m[1] : "(none)");
}
