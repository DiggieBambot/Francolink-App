// scripts/prewarm-tts.mjs
// Prewarms the Supabase tts-cache bucket by generating audio for every unique French
// string in published lesson content (vocab terms, example sentences, dialogue lines,
// grammar examples) for the configured voices.
//
// Usage:
//   node scripts/prewarm-tts.mjs               # dry-run (counts only)
//   node scripts/prewarm-tts.mjs --apply       # actually generate + upload
//   node scripts/prewarm-tts.mjs --apply --voice=Helene
//   node scripts/prewarm-tts.mjs --apply --limit=50    # cap for testing
//
// Resume-safe: skips any (text,voice) already present in tts-cache.

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const VOICE_ARG = process.argv.find((a) => a.startsWith("--voice="));
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const SCOPE_ARG = process.argv.find((a) => a.startsWith("--scope="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : Infinity;

// Scope: comma-separated source names to include. Sources:
//   vocab.term, vocab.example, dialogue.line, grammar.example
// Default: all four.
const ALL_SCOPES = new Set(["vocab.term", "vocab.example", "dialogue.line", "grammar.example"]);
const SCOPE = SCOPE_ARG
  ? new Set(SCOPE_ARG.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean))
  : ALL_SCOPES;
for (const s of SCOPE) {
  if (!ALL_SCOPES.has(s)) {
    console.error(`Unknown scope: ${s}. Valid: ${[...ALL_SCOPES].join(", ")}`);
    process.exit(1);
  }
}

const VOICES = VOICE_ARG ? [VOICE_ARG.split("=")[1]] : ["Hélène", "Alain"];
const SPEED = 1.0;
const LANGUAGE = "fr";
const BUCKET = "tts-cache";
const THROTTLE_MS = 200;          // gentle pace between Inworld calls
const RETRY_BACKOFF_MS = [1000, 3000, 8000]; // retry attempts on transient errors

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const INWORLD_KEY = process.env.INWORLD_API_KEY;
if (APPLY && !INWORLD_KEY) {
  console.error("Missing INWORLD_API_KEY in .env.local");
  process.exit(1);
}

function asciiSlug(s, maxLen) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen);
}

function textToFilename(text, voice, speed) {
  return `${asciiSlug(text, 60)}_${asciiSlug(voice, 20)}_${speed}.wav`;
}

function clean(s) {
  if (typeof s !== "string") return null;
  const t = s.trim();
  return t.length > 0 ? t : null;
}

function extractFromLesson(lesson) {
  const out = [];
  const c = lesson.content || {};
  const vocab = Array.isArray(c.vocabulary) ? c.vocabulary : [];
  for (const v of vocab) {
    const term = clean(v?.term ?? v?.word ?? v?.french);
    if (term) out.push({ text: term, source: "vocab.term" });
    const ex = clean(v?.exampleSentence?.original ?? v?.example?.original);
    if (ex) out.push({ text: ex, source: "vocab.example" });
  }
  const dialogue = c.dialogue;
  if (dialogue && Array.isArray(dialogue.lines)) {
    for (const line of dialogue.lines) {
      const t = clean(line?.text ?? line?.original);
      if (t) out.push({ text: t, source: "dialogue.line" });
    }
  }
  const grammar = Array.isArray(c.grammar) ? c.grammar : [];
  for (const point of grammar) {
    const examples = Array.isArray(point?.examples) ? point.examples : [];
    for (const ex of examples) {
      const t = clean(ex?.original);
      if (t) out.push({ text: t, source: "grammar.example" });
    }
  }
  return out;
}

async function existingCacheSet() {
  const set = new Set();
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list("french", {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      console.error(`Error listing cache: ${error.message}`);
      return set;
    }
    if (!data || data.length === 0) break;
    for (const f of data) set.add(f.name);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return set;
}

async function callInworld(text, voice) {
  const res = await fetch("https://api.inworld.ai/tts/v1/voice", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${INWORLD_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voice_id: voice,
      model_id: "inworld-tts-1",
      language: LANGUAGE,
      speed: SPEED,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    const error = new Error(`Inworld ${res.status}: ${err.slice(0, 200)}`);
    error.status = res.status;
    throw error;
  }
  const data = await res.json();
  const b64 = data.audioContent;
  if (!b64) throw new Error("Inworld returned no audioContent");
  return Buffer.from(b64, "base64");
}

async function generateWithRetry(text, voice) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRY_BACKOFF_MS.length; attempt++) {
    try {
      return await callInworld(text, voice);
    } catch (err) {
      lastErr = err;
      // Don't retry on 4xx (bad request / auth)
      if (err.status && err.status >= 400 && err.status < 500) throw err;
      if (attempt < RETRY_BACKOFF_MS.length) {
        await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS[attempt]));
      }
    }
  }
  throw lastErr;
}

async function uploadAudio(buffer, filename) {
  const path = `french/${filename}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: "audio/wav", upsert: false });
  if (error && error.message !== "The resource already exists") throw error;
}

async function main() {
  console.log("─".repeat(72));
  console.log(`TTS prewarm (${APPLY ? "APPLY" : "DRY-RUN"})`);
  console.log(`Voices: ${VOICES.join(", ")}   Speed: ${SPEED}   Bucket: ${BUCKET}`);
  console.log("─".repeat(72));

  // 1. Load all published lessons (skip lessons whose course is unpublished)
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select(`
      id, title, content,
      unit:units!inner (
        is_premium,
        course:courses!inner (slug, is_published)
      )
    `)
    .order("created_at");
  if (error) throw error;
  const publishedLessons = lessons.filter((l) => l.unit?.course?.is_published);
  console.log(`Lessons loaded: ${lessons.length}   published: ${publishedLessons.length}`);

  // 2. Extract unique strings
  const allItems = [];
  const sourceCount = {};
  for (const l of publishedLessons) {
    const items = extractFromLesson(l);
    for (const it of items) {
      if (!SCOPE.has(it.source)) continue;
      allItems.push(it);
      sourceCount[it.source] = (sourceCount[it.source] || 0) + 1;
    }
  }
  console.log(`Scope: ${[...SCOPE].join(", ")}`);
  console.log("Text sources (raw):");
  for (const [k, v] of Object.entries(sourceCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(20)} ${v}`);
  }

  // 3. Dedup texts
  const uniqueTexts = new Map(); // text → source(s)
  for (const it of allItems) {
    if (!uniqueTexts.has(it.text)) uniqueTexts.set(it.text, new Set());
    uniqueTexts.get(it.text).add(it.source);
  }
  console.log(`Unique texts: ${uniqueTexts.size}`);

  // 4. Cross with voices and compute file paths
  const targets = [];
  for (const text of uniqueTexts.keys()) {
    for (const voice of VOICES) {
      targets.push({ text, voice, filename: textToFilename(text, voice, SPEED) });
    }
  }
  console.log(`Total (text × voice) targets: ${targets.length}`);

  // 5. Check existing cache to skip
  console.log("\nChecking existing cache…");
  const existing = await existingCacheSet();
  console.log(`Existing cached files: ${existing.size}`);

  const todo = targets.filter((t) => !existing.has(t.filename));
  console.log(`To generate: ${todo.length}\n`);

  if (todo.length === 0) {
    console.log("Cache fully warm. Nothing to do.");
    return;
  }

  if (!APPLY) {
    console.log("DRY-RUN — no API calls made. Re-run with --apply to generate.\n");
    console.log("Sample of what would be generated (first 10):");
    for (const t of todo.slice(0, 10)) {
      console.log(`  · [${t.voice}] "${t.text.slice(0, 60)}${t.text.length > 60 ? "…" : ""}"`);
    }
    return;
  }

  // 6. Generate
  const sliced = todo.slice(0, LIMIT);
  if (LIMIT < Infinity) console.log(`(--limit=${LIMIT}, processing first ${sliced.length})\n`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  const start = Date.now();

  for (let i = 0; i < sliced.length; i++) {
    const t = sliced[i];
    const tag = `[${i + 1}/${sliced.length}]`;
    process.stdout.write(`${tag} ${t.voice} "${t.text.slice(0, 50)}${t.text.length > 50 ? "…" : ""}"… `);
    try {
      const buf = await generateWithRetry(t.text, t.voice);
      await uploadAudio(buf, t.filename);
      ok++;
      console.log("✓");
    } catch (err) {
      failed++;
      console.log(`✗ ${err.message?.slice(0, 100) || err}`);
    }
    if (i < sliced.length - 1) await new Promise((r) => setTimeout(r, THROTTLE_MS));

    // Periodic progress recap
    if ((i + 1) % 50 === 0) {
      const elapsed = (Date.now() - start) / 1000;
      const rate = (i + 1) / elapsed;
      const remaining = (sliced.length - i - 1) / rate;
      console.log(`   … ${ok} ok / ${failed} failed   rate=${rate.toFixed(2)}/s   eta=${Math.round(remaining)}s`);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  console.log(`\n${"─".repeat(72)}`);
  console.log(`Done in ${elapsed}s.   ok=${ok}   failed=${failed}   skipped=${skipped}`);
  console.log(`Re-run anytime to resume — already-cached files are skipped.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
