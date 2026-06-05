import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const a = createClient(URL, ANON);
const b = createClient(URL, ANON);
const topic = "session:tt-" + Date.now();
let gotHi = null, gotTr = null;

const chB = b.channel(topic);
chB.on("broadcast", { event: "highlight:set" }, ({ payload }) => { gotHi = payload; });
chB.on("broadcast", { event: "translation:set" }, ({ payload }) => { gotTr = payload; });
await new Promise((res) => chB.subscribe((s) => s === "SUBSCRIBED" && res()));

const chA = a.channel(topic);
await new Promise((res) => chA.subscribe((s) => s === "SUBSCRIBED" && res()));
await new Promise((r) => setTimeout(r, 300));

await chA.send({ type: "broadcast", event: "highlight:set", payload: { ids: ["s0/v0/term"] } });
await chA.send({ type: "broadcast", event: "translation:set", payload: { keys: ["bonjour"] } });
await new Promise((r) => setTimeout(r, 1500));

console.log("highlight received by B:", JSON.stringify(gotHi));
console.log("translation received by B:", JSON.stringify(gotTr));
process.exit(gotHi && gotTr ? 0 : 1);
