// Pre-generate the TTS clips the app needs and park them in the tts-cache
// bucket, so a learner never waits on the paid path.
//
//   npx tsx scripts/warm-tts.mts --source self --lang fr             # dry run
//   npx tsx scripts/warm-tts.mts --source self --lang fr --live
//   npx tsx scripts/warm-tts.mts --source self --lang fr --live --limit 200
//   npx tsx scripts/warm-tts.mts --source tutor --lang fr --live
//
// --source self  : the self-learning course (lessons + units + courses)
// --source tutor : the tutor-led catalogue (tutor_lessons)
// --source all   : both
//
// Replaces warm-tts-cache.mjs, which knew only about tutor_lessons — so the
// 688 self-learning lessons, which are what an unaccompanied student actually
// works through, had no warmed audio at all.
//
// The storage path comes from @/lib/tts/cache-key, the same module the route
// uses. Do not re-derive it here: when the two drifted, warming filled the
// bucket with clips the route never looked up.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { config } from "dotenv";
config({ path: ".env.local" });

import { adminClient } from "../src/lib/lessons/worker/process";
import { TTS_BUCKET, ttsCachePath, voiceFor } from "../src/lib/tts/cache-key";

const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
const val = (f: string) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};

const LIVE = has("--live");
const LANG = (val("--lang") ?? "fr").toLowerCase();
const SOURCE = (val("--source") ?? "self").toLowerCase();
const LIMIT = parseInt(val("--limit") ?? "100000", 10);
const SPEED = Number(val("--speed") ?? 1.0);

const supa = adminClient();
const openaiKey = process.env.OPENAI_API_KEY;

/** Text worth speaking, and where it came from — the source label makes the
 *  dry run readable and lets a partial run be prioritised sensibly. */
interface Clip {
  text: string;
  source: string;
}

function push(out: Map<string, Clip>, text: unknown, source: string) {
  if (typeof text !== "string") return;
  const t = text.trim();
  // Below three characters there is nothing to hear; above the route's own cap
  // the request would be rejected anyway.
  if (t.length < 3 || t.length > 1000) return;
  if (!out.has(t)) out.set(t, { text: t, source });
}

/** The self-learning course. Only the target-language strings: translations,
 *  tips and culture notes are English explanation and must not be spoken by a
 *  French voice. */
async function collectSelf(map: Map<string, Clip>) {
  const { data: langs } = await supa.from("languages").select("id, code");
  const wanted = new Set((langs ?? []).filter((l: any) => String(l.code).toLowerCase().startsWith(LANG)).map((l: any) => l.id));

  const { data: courses } = await supa.from("courses").select("id, language_id");
  const courseIds = (courses ?? []).filter((c: any) => wanted.size === 0 || wanted.has(c.language_id)).map((c: any) => c.id);

  const { data: units } = await supa.from("units").select("id, course_id");
  const unitIds = (units ?? []).filter((u: any) => courseIds.includes(u.course_id)).map((u: any) => u.id);

  for (let from = 0; ; from += 200) {
    const { data, error } = await supa.from("lessons").select("id, unit_id, content").range(from, from + 199);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const l of data) {
      if (!unitIds.includes(l.unit_id)) continue;
      const c: any = l.content ?? {};
      for (const v of c.vocabulary ?? []) {
        push(map, v.term, "vocabulary");
        push(map, v.exampleSentence, "vocab example");
      }
      for (const line of c.dialogue?.lines ?? []) push(map, line.text, "dialogue");
      for (const g of c.grammar ?? []) for (const e of g.examples ?? []) push(map, e.original, "grammar example");
    }
    if (data.length < 200) break;
  }
}

/** The tutor-led catalogue. */
async function collectTutor(map: Map<string, Clip>) {
  for (let from = 0; ; from += 200) {
    const { data, error } = await supa
      .from("tutor_lessons").select("content").eq("language", LANG).range(from, from + 199);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const row of data) {
      for (const s of ((row.content as any)?.sections ?? [])) {
        for (const it of s.items ?? []) {
          push(map, it.tts_text ?? it.term, "vocabulary");
          push(map, it.example, "vocab example");
        }
        for (const line of s.lines ?? []) push(map, line.text, "dialogue");
        for (const ex of s.exchanges ?? []) push(map, ex.text, "dialogue");
        for (const p of s.pairs ?? []) { push(map, p.question, "matching"); push(map, p.answer, "matching"); }
        if (s.passage) push(map, s.passage, "passage");
      }
    }
    if (data.length < 200) break;
  }
}

// ── collect ────────────────────────────────────────────────────────────────

const map = new Map<string, Clip>();
if (SOURCE === "self" || SOURCE === "all") await collectSelf(map);
if (SOURCE === "tutor" || SOURCE === "all") await collectTutor(map);

const voice = voiceFor(LANG);
const wanted = [...map.values()].map((c) => ({ ...c, path: ttsCachePath(c.text, voice, SPEED, LANG) }));

// ── what is already there ──────────────────────────────────────────────────

const folder = wanted[0]?.path.split("/")[0] ?? "french";
const existing = new Set<string>();
for (let offset = 0; ; offset += 1000) {
  const { data } = await supa.storage.from(TTS_BUCKET).list(folder, { limit: 1000, offset });
  if (!data?.length) break;
  for (const f of data) existing.add(`${folder}/${f.name}`);
  if (data.length < 1000) break;
}

const missing = wanted.filter((c) => !existing.has(c.path));
const chars = missing.reduce((n, c) => n + c.text.length, 0);

const bySource = new Map<string, { clips: number; chars: number }>();
for (const c of missing) {
  const s = bySource.get(c.source) ?? { clips: 0, chars: 0 };
  s.clips++; s.chars += c.text.length;
  bySource.set(c.source, s);
}

console.log(`\nsource=${SOURCE}  language=${LANG}  voice=${voice}  speed=${SPEED}`);
console.log(`  clips needed   : ${wanted.length}`);
console.log(`  already cached : ${wanted.length - missing.length}`);
console.log(`  to generate    : ${missing.length}  (${chars.toLocaleString()} characters)`);
for (const [s, v] of [...bySource].sort((a, b) => b[1].clips - a[1].clips)) {
  console.log(`      ${String(v.clips).padStart(5)}  ${s.padEnd(16)} ${v.chars.toLocaleString()} chars`);
}

if (!LIVE) {
  console.log(`\nDry run — nothing generated, nothing spent.`);
  console.log(`Sample:`);
  missing.slice(0, 8).forEach((c) => console.log(`  ${c.path}\n    "${c.text.slice(0, 70)}"`));
  console.log(`\nRe-run with --live to generate. --limit N caps the batch.\n`);
  process.exit(0);
}

if (!openaiKey) {
  console.error("OPENAI_API_KEY is not set.");
  process.exit(1);
}

// ── generate ───────────────────────────────────────────────────────────────

// Shortest first: vocabulary is what a learner presses most and costs least,
// so a capped or interrupted run still leaves the most-used audio warmed.
const batch = missing.sort((a, b) => a.text.length - b.text.length).slice(0, LIMIT);
console.log(`\nGenerating ${batch.length} clips...\n`);

let done = 0, failed = 0;
for (const clip of batch) {
  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice,
        input: clip.text,
        speed: SPEED,
        response_format: "mp3",
        instructions:
          "Read the text exactly as written, as a native speaker of the target language, with natural pronunciation, liaison and rhythm. Do not add or omit anything.",
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 90)}`);
    const buf = Buffer.from(await res.arrayBuffer());

    const { error } = await supa.storage
      .from(TTS_BUCKET)
      .upload(clip.path, buf, { contentType: "audio/mpeg", upsert: false });
    if (error && !/already exists/i.test(error.message)) throw new Error(error.message);

    done++;
    if (done % 25 === 0) console.log(`  ${done}/${batch.length}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL "${clip.text.slice(0, 40)}" — ${err instanceof Error ? err.message.slice(0, 80) : err}`);
  }
}

console.log(`\nDone. Generated ${done}, failed ${failed}, ${missing.length - done} still missing.\n`);
