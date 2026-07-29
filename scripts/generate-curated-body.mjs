#!/usr/bin/env node
// scripts/generate-curated-body.mjs
//
// Generates the Body theme. Unlike other themes (one FLUX call per word), this
// generates ONE base character illustration and composites a distinct
// highlight ring onto a copy of it for every body part in src/lib/games/curated/body.ts
// — so every word shows the same figure with a clear pointer at the right spot.
//
// Usage:
//   node --env-file=.env.local scripts/generate-curated-body.mjs               # generate all
//   node --env-file=.env.local scripts/generate-curated-body.mjs --only=oreille,pied
//   node --env-file=.env.local scripts/generate-curated-body.mjs --regen-base   # new base figure too

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "games", "body");
const BASE_CACHE = join(OUT_DIR, "_base.png"); // underscore: not a vocab slug

const ONLY = (process.argv.find((a) => a.startsWith("--only="))?.split("=")[1] || "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const REGEN_BASE = process.argv.includes("--regen-base");

const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const SIZE = 512;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error("Missing CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN in .env.local.");
  process.exit(1);
}

function loadBody() {
  const src = readFileSync(join(ROOT, "src/lib/games/curated/body.ts"), "utf8");
  const m = src.match(/export const BODY: CuratedItem\[\] = (\[[\s\S]*?\n\]);/);
  if (!m) { console.error("Could not find BODY array"); process.exit(1); }
  // eslint-disable-next-line no-eval
  return eval(m[1]);
}

async function generateImage(prompt, seed) {
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

const BASE_PROMPT = "a cartoon kid standing facing forward, arms out, full body, flat illustration, plain white background, centered, no text";

async function getBaseFigure() {
  if (!REGEN_BASE && existsSync(BASE_CACHE)) return loadImage(BASE_CACHE);
  const png = await generateImage(BASE_PROMPT);
  const img = await loadImage(png);
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  const scale = Math.max(SIZE / img.width, SIZE / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  ctx.drawImage(img, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh);
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(BASE_CACHE, canvas.toBuffer("image/png"));
  return loadImage(BASE_CACHE);
}

function drawRing(ctx, a) {
  const cx = a.x * SIZE, cy = a.y * SIZE;
  ctx.save();
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#f59e0b";
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, a.size * SIZE, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Zoom into the region around the part, keeping enough of the body around it
// for context. Without this every tile would be the same full-body figure
// differing only by a small ring — indistinguishable at in-game tile size
// (~70-130px). `zoom` is the crop's half-extent in normalized units.
function cropBox(a, zoom) {
  const half = zoom ?? Math.max(a.size * 3.2, 0.16);
  let x = a.x - half, y = a.y - half, s = half * 2;
  // keep the crop inside the image
  if (s > 1) { x = 0; y = 0; s = 1; }
  else {
    x = Math.min(Math.max(x, 0), 1 - s);
    y = Math.min(Math.max(y, 0), 1 - s);
  }
  return { x: x * SIZE, y: y * SIZE, s: s * SIZE };
}

async function main() {
  const baseImg = await getBaseFigure();
  let items = loadBody();
  if (ONLY.length) items = items.filter((a) => ONLY.includes(a.slug));

  console.log(`\n🧍 Curated body — ${items.length} item(s)\n`);
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  for (const item of items) {
    // draw the annotated full figure once, then crop+scale the region of interest
    const full = createCanvas(SIZE, SIZE);
    const fctx = full.getContext("2d");
    fctx.fillStyle = "#ffffff";
    fctx.fillRect(0, 0, SIZE, SIZE);
    fctx.drawImage(baseImg, 0, 0, SIZE, SIZE);
    if (item.annotate) drawRing(fctx, item.annotate);

    const box = cropBox(item.annotate, item.zoom);
    const out = createCanvas(SIZE, SIZE);
    const octx = out.getContext("2d");
    octx.fillStyle = "#ffffff";
    octx.fillRect(0, 0, SIZE, SIZE);
    octx.drawImage(full, box.x, box.y, box.s, box.s, 0, 0, SIZE, SIZE);

    writeFileSync(join(OUT_DIR, `${item.slug}.png`), out.toBuffer("image/png"));
    console.log(`  ${item.slug.padEnd(10)} ${item.translation.padEnd(8)} zoom ${(box.s / SIZE).toFixed(2)} ✓`);
  }
  console.log(`\nDone.\n`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
