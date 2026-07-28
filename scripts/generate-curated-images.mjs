#!/usr/bin/env node
// scripts/generate-curated-images.mjs
//
// Generic version of generate-curated-animals.mjs: generates verified,
// single-subject illustrations for any curated theme in src/lib/games/curated/
// and writes them to /public/games/<theme>/. Meant to be eyeballed one by one —
// regenerate any that read wrong (garbled text, wrong subject, etc).
//
// Usage:
//   node --env-file=.env.local scripts/generate-curated-images.mjs --theme=food
//   node --env-file=.env.local scripts/generate-curated-images.mjs --theme=food --force
//   node --env-file=.env.local scripts/generate-curated-images.mjs --theme=food --only=pomme,pain
//   node --env-file=.env.local scripts/generate-curated-images.mjs --theme=food --only=pomme --seed=7 --force

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const THEME = process.argv.find((a) => a.startsWith("--theme="))?.split("=")[1];
if (!THEME) { console.error("Usage: --theme=<slug> is required (matches src/lib/games/curated/<slug>.ts)"); process.exit(1); }
const OUT_DIR = join(ROOT, "public", "games", THEME);

const FORCE = process.argv.includes("--force");
const ONLY = (process.argv.find((a) => a.startsWith("--only="))?.split("=")[1] || "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const SEED = Number(process.argv.find((a) => a.startsWith("--seed="))?.split("=")[1] || 0);

const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const SIZE = 512;
const THROTTLE_MS = 400;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error("Missing CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN in .env.local.");
  process.exit(1);
}

// Pull the exported const array (named ANIMALS/FOOD/COLORS/...) out of the
// theme's plain-data TS file without a build step.
function loadItems(theme) {
  const path = join(ROOT, `src/lib/games/curated/${theme}.ts`);
  if (!existsSync(path)) { console.error(`No curated file at ${path}`); process.exit(1); }
  const src = readFileSync(path, "utf8");
  const m = src.match(/export const [A-Z_]+: CuratedItem\[\] = (\[[\s\S]*?\n\]);/);
  if (!m) { console.error(`Could not find an "export const X: CuratedItem[] = [...]" array in ${path}`); process.exit(1); }
  // eslint-disable-next-line no-eval
  return eval(m[1]); // trusted, in-repo source
}

function promptFor(item) {
  return [
    item.prompt,
    "single subject, centered, full item visible, isolated on a plain white background",
    "cute simple flat vector illustration, cheerful bright colors, clean bold outlines, soft shapes",
    "no text, no letters, no words, no watermark, no border",
    "children's flashcard style",
  ].join(", ");
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

async function compose(pngBuffer, annotate) {
  const img = await loadImage(pngBuffer);
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  const scale = Math.max(SIZE / img.width, SIZE / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  ctx.drawImage(img, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh);
  if (annotate) drawAnnotation(ctx, annotate);
  return canvas.toBuffer("image/png");
}

function drawAnnotation(ctx, a) {
  const cx = a.x * SIZE, cy = a.y * SIZE;
  ctx.save();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#f59e0b";
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 6;
  if (a.kind === "ring") {
    ctx.beginPath();
    ctx.arc(cx, cy, a.size * SIZE, 0, Math.PI * 2);
    ctx.stroke();
  } else if (a.kind === "arrow") {
    const len = a.size * SIZE;
    const fromX = cx + len * 0.7, fromY = cy - len * 0.7;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    const ang = Math.atan2(cy - fromY, cx - fromX);
    const h = 20;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - h * Math.cos(ang - 0.4), cy - h * Math.sin(ang - 0.4));
    ctx.lineTo(cx - h * Math.cos(ang + 0.4), cy - h * Math.sin(ang + 0.4));
    ctx.closePath();
    ctx.fillStyle = "#f59e0b";
    ctx.fill();
  }
  ctx.restore();
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  let items = loadItems(THEME);
  if (ONLY.length) items = items.filter((a) => ONLY.includes(a.slug));

  console.log(`\n🎨 Curated ${THEME} — ${items.length} item(s)${FORCE ? " (force)" : ""}\n`);
  let ok = 0, skip = 0, fail = 0;
  for (const item of items) {
    const out = join(OUT_DIR, `${item.slug}.png`);
    if (!FORCE && existsSync(out)) { console.log(`  ${item.slug.padEnd(14)} skip (exists)`); skip++; continue; }
    process.stdout.write(`  ${item.slug.padEnd(14)} ${item.translation.padEnd(12)} `);
    try {
      const png = await generateImage(promptFor(item), SEED);
      const composed = await compose(png, item.annotate);
      writeFileSync(out, composed);
      console.log(`✓  → public/games/${THEME}/${item.slug}.png`);
      ok++;
    } catch (e) {
      console.log(`✗  ${e.message}`);
      fail++;
    }
    await new Promise((r) => setTimeout(r, THROTTLE_MS));
  }
  console.log(`\nDone.  ok=${ok}  skipped=${skip}  failed=${fail}\n`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
