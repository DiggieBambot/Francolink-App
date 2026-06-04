// scripts/bulk-convert-lessons.mjs
//
// Convert many Google Docs into tutor_lessons rows.
// Reads doc IDs (one per line; URLs accepted) from a file.
// Skips slugs that already exist (resume-safe), unless --overwrite.
//
// Usage:
//   node scripts/bulk-convert-lessons.mjs <ids-file>
//   node scripts/bulk-convert-lessons.mjs <ids-file> --overwrite
//   node scripts/bulk-convert-lessons.mjs <ids-file> --limit=10 --concurrency=2
//
// Log: /tmp/francolink-logs/bulk-convert.log

import { mkdirSync, appendFileSync, readFileSync } from "fs";
import { dirname } from "path";
import { convertAndUpsert, extractDocId } from "./convert-lesson-doc.mjs";

const LOG_PATH = "/tmp/francolink-logs/bulk-convert.log";
mkdirSync(dirname(LOG_PATH), { recursive: true });

function log(line) {
  const stamped = `[${new Date().toISOString()}] ${line}`;
  console.log(stamped);
  appendFileSync(LOG_PATH, stamped + "\n");
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/bulk-convert-lessons.mjs <ids-file> [--overwrite] [--limit=N] [--concurrency=N]");
  process.exit(1);
}
const overwrite = process.argv.includes("--overwrite");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const concArg = process.argv.find((a) => a.startsWith("--concurrency="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
const concurrency = Math.max(1, concArg ? parseInt(concArg.split("=")[1], 10) : 2);

const lines = readFileSync(file, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

const ids = lines
  .map((l) => ({ raw: l, id: extractDocId(l) }))
  .filter((x) => {
    if (!x.id) log(`skip (unparseable): ${x.raw}`);
    return x.id;
  })
  .slice(0, limit);

log(`Starting bulk convert: ${ids.length} docs · concurrency=${concurrency} · overwrite=${overwrite}`);

let ok = 0, skipped = 0, failed = 0;
let cursor = 0;

async function worker(id) {
  for (;;) {
    const i = cursor++;
    if (i >= ids.length) return;
    const { raw, id: docId } = ids[i];
    const tag = `[${i + 1}/${ids.length}] worker#${id}`;
    try {
      const t0 = Date.now();
      const res = await convertAndUpsert({ docIdOrUrl: docId, overwrite });
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      if (res.skipped) {
        skipped++;
        log(`${tag} skipped ${docId} (${res.skipped}) ${dt}s`);
      } else if (res.written) {
        ok++;
        const flag = res.issues.length ? ` ⚠${res.issues.length}` : "";
        log(`${tag} ${res.mode} ${docId} → ${res.lesson.slug} (${res.lesson.level})${flag} ${dt}s`);
      }
    } catch (err) {
      failed++;
      log(`${tag} ✗ ${docId}: ${err.message}`);
    }
  }
}

const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
await Promise.all(workers);

log(`Done. ok=${ok} skipped=${skipped} failed=${failed}`);
