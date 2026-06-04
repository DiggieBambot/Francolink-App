// scripts/import-local-folder.mjs
//
// Bulk-import lessons from a LOCAL folder of .docx files (downloaded from Drive).
// No Drive API calls → no anti-abuse throttling. Converts each via OpenAI,
// repairs word-order, hydrates Pexels images, and upserts into tutor_lessons.
//
// Usage:
//   node scripts/import-local-folder.mjs <folderPath>
//   node scripts/import-local-folder.mjs <folderPath> --overwrite
//   node scripts/import-local-folder.mjs <folderPath> --concurrency=4 --limit=10
//
// Env (.env.local): OPENAI_API_KEY, PEXELS_API_KEY,
//                   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { readdirSync, statSync, readFileSync, mkdirSync, appendFileSync } from "fs";
import { join, extname, relative } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import mammoth from "mammoth";

config({ path: ".env.local" });

const {
  geminiConvert,
  repairWordOrder,
  validateLesson,
} = await import("../src/lib/lessons/convert.ts");
const { hydrateImages } = await import("../src/lib/lessons/hydrate-images.ts");

const folderArg = process.argv[2];
if (!folderArg) {
  console.error("Usage: node scripts/import-local-folder.mjs <folderPath> [--overwrite] [--concurrency=N] [--limit=N]");
  process.exit(1);
}
const overwrite = process.argv.includes("--overwrite");
const concArg = process.argv.find((a) => a.startsWith("--concurrency="));
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const CONCURRENCY = concArg ? parseInt(concArg.split("=")[1], 10) : 4;
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

const LOG = "/tmp/francolink-logs/local-import.log";
mkdirSync("/tmp/francolink-logs", { recursive: true });
function log(line) {
  const stamped = `[${new Date().toISOString()}] ${line}`;
  console.log(stamped);
  appendFileSync(LOG, stamped + "\n");
}

// Recursively collect .docx files.
function walk(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name.startsWith("~$")) continue; // skip hidden / Word lock files
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, base, out);
    else if (extname(name).toLowerCase() === ".docx") {
      out.push({ path: full, rel: relative(base, full) });
    }
  }
  return out;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importOne(file) {
  const sourceUrlEarly = `local:${file.rel}`;
  // Fast-path: if this exact source file is already imported, skip WITHOUT
  // spending an OpenAI conversion. Makes resume runs near-instant.
  if (!overwrite) {
    const { data: already } = await supabase
      .from("tutor_lessons")
      .select("slug")
      .eq("source_url", sourceUrlEarly)
      .maybeSingle();
    if (already) return { mode: "skip", slug: already.slug };
  }

  const buf = readFileSync(file.path);
  const { value: text } = await mammoth.extractRawText({ buffer: buf });
  const cleaned = text.replace(/\r\n/g, "\n").replace(/ /g, " ").trim();
  if (cleaned.length < 100) throw new Error(`doc text too short (${cleaned.length} chars)`);

  const lesson = await geminiConvert(cleaned);
  repairWordOrder(lesson);
  try {
    await hydrateImages(lesson);
  } catch (err) {
    log(`   ⚠ hydration failed: ${err.message}`);
  }
  const issues = validateLesson(lesson);

  const sourceUrl = `local:${file.rel}`;

  // Find a unique slug. If the base slug is taken by a DIFFERENT source file,
  // append -2/-3/... so two different lessons never collapse into one.
  const baseSlug = lesson.slug;
  let slug = baseSlug;
  for (let n = 1; ; n++) {
    const { data: existing } = await supabase
      .from("tutor_lessons")
      .select("id, source_url")
      .eq("slug", slug)
      .maybeSingle();

    if (!existing) break; // slug is free → insert below

    if (existing.source_url === sourceUrl) {
      // Same source file already imported under this slug.
      if (!overwrite) return { mode: "skip", slug };
      const { error } = await supabase
        .from("tutor_lessons")
        .update({ ...buildRow(lesson, sourceUrl, issues, slug) })
        .eq("id", existing.id);
      if (error) throw new Error(`update: ${error.message}`);
      return { mode: "update", slug };
    }
    // Slug taken by a different file → try next suffix.
    slug = `${baseSlug}-${n + 1}`;
  }

  lesson.slug = slug;
  const { error } = await supabase.from("tutor_lessons").insert(buildRow(lesson, sourceUrl, issues, slug));
  if (error) throw new Error(`insert: ${error.message}`);
  return { mode: slug === baseSlug ? "insert" : "insert(suffixed)", slug };
}

function buildRow(lesson, sourceUrl, issues, slug) {
  return {
    slug,
    title: lesson.title,
    language: lesson.language || "fr",
    level: lesson.level,
    duration_minutes: lesson.duration_minutes || null,
    topic_tags: Array.isArray(lesson.topic_tags) ? lesson.topic_tags : [],
    source_url: sourceUrl,
    status: "review",
    content: lesson,
    conversion_notes: issues.length ? issues.join("; ") : null,
  };
}

const files = walk(folderArg).slice(0, LIMIT);
log(`Found ${files.length} .docx files. concurrency=${CONCURRENCY} overwrite=${overwrite}`);

let ok = 0, skipped = 0, failed = 0, cursor = 0;
let quotaHit = false;

async function worker(id) {
  while (!quotaHit) {
    const i = cursor++;
    if (i >= files.length) return;
    const f = files[i];
    try {
      const res = await importOne(f);
      if (res.mode === "skip") { skipped++; log(`[${i + 1}/${files.length}] skip ${f.rel} → ${res.slug}`); }
      else { ok++; log(`[${i + 1}/${files.length}] ${res.mode} ${f.rel} → ${res.slug}`); }
    } catch (err) {
      if (err?.name === "QuotaExhaustedError") {
        quotaHit = true;
        log(`[${i + 1}/${files.length}] ⛔ OpenAI quota/billing problem — stopping. ${err.message}`);
        return;
      }
      failed++;
      log(`[${i + 1}/${files.length}] ✗ ${f.rel}: ${err.message?.slice(0, 200)}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)));
log(`Done. ok=${ok} skipped=${skipped} failed=${failed}${quotaHit ? " (stopped on quota)" : ""}`);
