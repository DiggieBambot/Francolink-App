#!/usr/bin/env node
// scripts/generate-vocab-library.mjs
//
// Fills the shared vocab picture library (src/lib/vocab-library/concepts.ts)
// and uploads it to Supabase Storage at lesson-images/vocab-library/<slug>.png,
// where both lessons and the kids' games read from.
//
// "figure" concepts (body parts) reuse ONE base cartoon child with a highlight
// ring composited at the right spot and a crop around it — the same technique
// as scripts/generate-curated-body.mjs, which is what makes "knee" readable
// instead of a photo of someone's leg. "object" concepts get a single-subject
// FLUX illustration.
//
// Usage:
//   node --env-file=.env.local scripts/generate-vocab-library.mjs
//   node --env-file=.env.local scripts/generate-vocab-library.mjs --only=knee,neck --force
//   node --env-file=.env.local scripts/generate-vocab-library.mjs --regen-base
//   node --env-file=.env.local scripts/generate-vocab-library.mjs --dry   # write to public/vocab-library/ only

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LOCAL_DIR = join(ROOT, "public", "vocab-library");
// The games' body theme already ships a base figure; reuse it so the library
// and the existing game tiles show the same child.
const BASE_CACHE = join(ROOT, "public", "games", "body", "_base.png");

const ONLY = (process.argv.find((a) => a.startsWith("--only="))?.split("=")[1] || "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const FORCE = process.argv.includes("--force");
const REGEN_BASE = process.argv.includes("--regen-base");
const DRY = process.argv.includes("--dry");

const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const SIZE = 512;
const BUCKET = "lesson-images";
const PREFIX = "vocab-library";
const THROTTLE_MS = 400;

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DRY && (!SUPA_URL || !SUPA_KEY)) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = DRY ? null : createClient(SUPA_URL, SUPA_KEY);

// Read the plain-data concept list without a build step.
function loadConcepts() {
  const src = readFileSync(join(ROOT, "src/lib/vocab-library/concepts.ts"), "utf8");
  const m = src.match(/export const CONCEPTS: Concept\[\] = (\[[\s\S]*?\n\]);/);
  if (!m) { console.error("Could not find the CONCEPTS array"); process.exit(1); }
  // eslint-disable-next-line no-eval
  return eval(m[1].replace(/kind: "(figure|object)"/g, 'kind: "$1"')); // trusted, in-repo source
}

async function flux(prompt, seed) {
  if (!ACCOUNT_ID || !API_TOKEN) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN — needed to generate new images");
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;
  const body = { prompt, num_steps: 6 };
  if (seed) body.seed = seed;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Cloudflare AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const b64 = json?.result?.image;
  if (!b64) throw new Error(`No image: ${JSON.stringify(json).slice(0, 160)}`);
  return Buffer.from(b64, "base64");
}

const BASE_PROMPT =
  "a cartoon kid standing facing forward, arms out, full body, flat illustration, plain white background, centered, no text";

async function getBaseFigure() {
  if (!REGEN_BASE && existsSync(BASE_CACHE)) return loadImage(readFileSync(BASE_CACHE));
  const png = await flux(BASE_PROMPT);
  const img = await loadImage(png);
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  const scale = Math.max(SIZE / img.width, SIZE / img.height);
  ctx.drawImage(img, (SIZE - img.width * scale) / 2, (SIZE - img.height * scale) / 2,
    img.width * scale, img.height * scale);
  mkdirSync(dirname(BASE_CACHE), { recursive: true });
  writeFileSync(BASE_CACHE, canvas.toBuffer("image/png"));
  return loadImage(readFileSync(BASE_CACHE));
}

function drawRing(ctx, a) {
  ctx.save();
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#f59e0b";
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(a.x * SIZE, a.y * SIZE, a.size * SIZE, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Crop around the ring, keeping enough body for context. Without this every
// picture is the same full figure differing by one small ring.
function cropBox(a, zoom) {
  const half = zoom ?? Math.max(a.size * 3.2, 0.16);
  let x = a.x - half, y = a.y - half, s = half * 2;
  if (s > 1) { x = 0; y = 0; s = 1; }
  else {
    x = Math.min(Math.max(x, 0), 1 - s);
    y = Math.min(Math.max(y, 0), 1 - s);
  }
  return { x: x * SIZE, y: y * SIZE, s: s * SIZE };
}

function renderFigure(baseImg, concept) {
  const full = createCanvas(SIZE, SIZE);
  const fctx = full.getContext("2d");
  fctx.fillStyle = "#ffffff";
  fctx.fillRect(0, 0, SIZE, SIZE);
  fctx.drawImage(baseImg, 0, 0, SIZE, SIZE);
  drawRing(fctx, concept.annotate);

  const box = cropBox(concept.annotate, concept.zoom);
  const out = createCanvas(SIZE, SIZE);
  const octx = out.getContext("2d");
  octx.fillStyle = "#ffffff";
  octx.fillRect(0, 0, SIZE, SIZE);
  octx.drawImage(full, box.x, box.y, box.s, box.s, 0, 0, SIZE, SIZE);
  return out.toBuffer("image/png");
}

async function renderObject(concept) {
  const prompt = [
    concept.prompt || concept.label,
    "single subject, centered, full item visible, isolated on a plain white background",
    "cute simple flat vector illustration, cheerful bright colors, clean bold outlines, soft shapes",
    "no text, no letters, no words, no watermark, no border",
    "children's flashcard style",
  ].join(", ");
  const png = await flux(prompt);
  const img = await loadImage(png);
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  const scale = Math.max(SIZE / img.width, SIZE / img.height);
  ctx.drawImage(img, (SIZE - img.width * scale) / 2, (SIZE - img.height * scale) / 2,
    img.width * scale, img.height * scale);
  return canvas.toBuffer("image/png");
}

async function alreadyUploaded(slug) {
  const { data } = await supabase.storage.from(BUCKET).list(PREFIX, { search: `${slug}.png` });
  return Boolean(data?.some((f) => f.name === `${slug}.png`));
}

async function upload(slug, buf) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(`${PREFIX}/${slug}.png`, buf, { contentType: "image/png", upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(`${PREFIX}/${slug}.png`).data.publicUrl;
}

async function main() {
  let concepts = loadConcepts();
  if (ONLY.length) concepts = concepts.filter((c) => ONLY.includes(c.slug));
  if (!concepts.length) { console.error("No concepts matched --only"); process.exit(1); }

  const needsFigure = concepts.some((c) => c.kind === "figure");
  const baseImg = needsFigure ? await getBaseFigure() : null;

  mkdirSync(LOCAL_DIR, { recursive: true });
  console.log(`\n📚 vocab library — ${concepts.length} concept(s)${DRY ? " (dry: local only)" : ""}\n`);
  let ok = 0, skip = 0, fail = 0;

  for (const c of concepts) {
    process.stdout.write(`  ${c.slug.padEnd(12)} ${c.kind.padEnd(7)} `);
    try {
      if (!DRY && !FORCE && (await alreadyUploaded(c.slug))) {
        console.log("skip (in library)");
        skip++;
        continue;
      }
      const buf = c.kind === "figure" ? renderFigure(baseImg, c) : await renderObject(c);
      writeFileSync(join(LOCAL_DIR, `${c.slug}.png`), buf);
      if (DRY) console.log(`✓  → public/vocab-library/${c.slug}.png`);
      else console.log(`✓  ${await upload(c.slug, buf)}`);
      ok++;
      if (c.kind === "object") await new Promise((r) => setTimeout(r, THROTTLE_MS));
    } catch (e) {
      console.log(`✗  ${e.message}`);
      fail++;
    }
  }
  console.log(`\nDone.  ok=${ok}  skipped=${skip}  failed=${fail}\n`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
