import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function authedClient(email) {
  const c = createClient(URL, ANON);
  const { data, error } = await c.auth.signInWithPassword({ email, password: "FrancoTest!2026" });
  if (error) throw new Error(`${email}: ${error.message}`);
  c.realtime.setAuth(data.session.access_token);
  return c;
}

const tutor = await authedClient("demo.tutor@francolink.test");
const student = await authedClient("demo.student@francolink.test");
const topic = "session:4d1267b7-83f7-4646-8df3-2bcd7595e11c";

let gotHi = null;
const chS = student.channel(topic, { config: { presence: { key: "student" } } });
chS.on("broadcast", { event: "highlight:set" }, ({ payload }) => { gotHi = payload; });
await new Promise((res) => chS.subscribe((s) => s === "SUBSCRIBED" && res()));

const chT = tutor.channel(topic, { config: { presence: { key: "tutor" } } });
await new Promise((res) => chT.subscribe((s) => s === "SUBSCRIBED" && res()));
await new Promise((r) => setTimeout(r, 400));

await chT.send({ type: "broadcast", event: "highlight:set", payload: { ids: ["s0/v0/term"] } });
await new Promise((r) => setTimeout(r, 1500));

console.log("AUTHED student received highlight:", JSON.stringify(gotHi));
process.exit(gotHi ? 0 : 1);
