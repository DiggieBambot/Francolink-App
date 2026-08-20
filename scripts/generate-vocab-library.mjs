#!/usr/bin/env node
// scripts/generate-vocab-library.mjs
//
// Fills the shared vocab picture library (src/lib/vocab-library/concepts.ts)
// and uploads it to Supabase Storage at lesson-images/vocab-library/<slug>.png,
// where both lessons and the kids' games read from.
//
// Each concept is rendered by the method that gives a child the clearest,
// least ambiguous picture — see the notes in concepts.ts:
//   figure   one base cartoon child + a highlight ring + a crop
//   from     copy an already hand-verified game tile, never regenerate it
//   object   a single-subject FLUX illustration
//   shape    drawn with canvas — a model renders "diamond" as a gemstone
//   numeral  drawn with canvas — image models garble digits
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
const GEMINI_KEY = process.env.GEMINI_API_KEY;

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
  return eval(m[1]); // trusted, in-repo source
}

// A concept's picture always comes from exactly one place.
function methodOf(c) {
  if (c.from) return "copy";
  if (c.kind === "figure") return "figure";
  if (c.kind === "shape") return "shape";
  if (c.kind === "numeral") return "numeral";
  return "flux";
}

// FLUX.1-schnell, reached through Cloudflare Workers AI first and Hugging Face
// second. Cloudflare's free tier stops at 10,000 neurons a day, which a full
// library build blows through; falling back to the SAME model elsewhere keeps
// every picture in one art style instead of half the set looking foreign.
let cloudflareExhausted = false;

async function fluxCloudflare(prompt, seed) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;
  const body = { prompt, steps: 6 };
  if (seed) body.seed = seed;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = (await res.text()).slice(0, 200);
    if (res.status === 429 || /daily free allocation/.test(text)) {
      cloudflareExhausted = true;
      const err = new Error("cloudflare quota");
      err.quota = true;
      throw err;
    }
    throw new Error(`Cloudflare AI ${res.status}: ${text}`);
  }
  const json = await res.json();
  const b64 = json?.result?.image;
  if (!b64) throw new Error(`No image: ${JSON.stringify(json).slice(0, 160)}`);
  return Buffer.from(b64, "base64");
}

// Gemini is the standby when Cloudflare's daily allocation runs out. It is a
// different model, so the prompt leans hard on the same style words to keep
// the two halves of the library looking like one set.
async function imageGemini(prompt) {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
    {
      method: "POST",
      headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) throw new Error(`Gemini: no image in response`);
  return Buffer.from(part.inlineData.data, "base64");
}

async function flux(prompt, seed) {
  const canCloudflare = ACCOUNT_ID && API_TOKEN && !cloudflareExhausted;
  if (canCloudflare) {
    try {
      return await fluxCloudflare(prompt, seed);
    } catch (e) {
      if (!e.quota) throw e;
      console.log("\n  … Cloudflare daily quota reached — switching to Hugging Face\n");
    }
  }
  if (!GEMINI_KEY) {
    throw new Error(
      cloudflareExhausted
        ? "Cloudflare quota exhausted and no GEMINI_API_KEY to fall back to"
        : "Missing CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN"
    );
  }
  return imageGemini(prompt);
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

// Copy a hand-verified game tile straight in — the games curated these by eye,
// so regenerating them would only risk making them worse.
function copyTile(concept) {
  const p = join(ROOT, "public", "games", concept.from.theme, `${concept.from.slug}.png`);
  if (!existsSync(p)) throw new Error(`missing tile ${concept.from.theme}/${concept.from.slug}.png`);
  return readFileSync(p);
}

const SHAPE_FILL = "#38bdf8";
const SHAPE_LINE = "#0f172a";

function renderShape(concept) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE * 0.3;
  ctx.beginPath();
  switch (concept.shape) {
    case "circle":
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    case "square":
      ctx.rect(cx - r, cy - r, r * 2, r * 2);
      break;
    case "rectangle":
      ctx.rect(cx - r * 1.35, cy - r * 0.75, r * 2.7, r * 1.5);
      break;
    case "triangle":
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy + r * 0.8);
      ctx.lineTo(cx - r, cy + r * 0.8);
      ctx.closePath();
      break;
    case "oval":
      ctx.ellipse(cx, cy, r * 1.3, r * 0.85, 0, 0, Math.PI * 2);
      break;
    case "diamond":
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.75, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r * 0.75, cy);
      ctx.closePath();
      break;
    case "heart": {
      const t = cy - r * 0.55;
      ctx.moveTo(cx, cy + r * 0.9);
      ctx.bezierCurveTo(cx - r * 1.5, cy - r * 0.2, cx - r * 0.6, t - r * 0.75, cx, t);
      ctx.bezierCurveTo(cx + r * 0.6, t - r * 0.75, cx + r * 1.5, cy - r * 0.2, cx, cy + r * 0.9);
      break;
    }
    case "star": {
      const spikes = 5, outer = r, inner = r * 0.42;
      for (let i = 0; i < spikes * 2; i++) {
        const rad = i % 2 === 0 ? outer : inner;
        const ang = (Math.PI / spikes) * i - Math.PI / 2;
        const fn = i === 0 ? "moveTo" : "lineTo";
        ctx[fn](cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad);
      }
      ctx.closePath();
      break;
    }
    default:
      throw new Error(`unknown shape "${concept.shape}"`);
  }
  ctx.fillStyle = SHAPE_FILL;
  ctx.fill();
  ctx.lineWidth = 12;
  ctx.lineJoin = "round";
  ctx.strokeStyle = SHAPE_LINE;
  ctx.stroke();
  return canvas.toBuffer("image/png");
}

// Matches the palette and layout of scripts/generate-number-cards.mjs so 11+
// sits beside the games' 1-10 cards without looking like a different set.
const NUMERAL_BG = ["#ef4444", "#3b82f6", "#22c55e", "#facc15", "#f97316",
                    "#a855f7", "#ec4899", "#06b6d4", "#84cc16", "#6366f1"];

function renderNumeral(concept) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  const bg = NUMERAL_BG[concept.numeral % NUMERAL_BG.length];
  const pad = SIZE * 0.08, r = SIZE * 0.1;
  ctx.beginPath();
  ctx.roundRect(pad, pad, SIZE - pad * 2, SIZE - pad * 2, r);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const digits = String(concept.numeral);
  ctx.font = `bold ${digits.length > 2 ? SIZE * 0.36 : SIZE * 0.48}px sans-serif`;
  ctx.fillText(digits, SIZE / 2, SIZE / 2);
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

  const needsFigure = concepts.some((c) => methodOf(c) === "figure");
  const baseImg = needsFigure ? await getBaseFigure() : null;

  mkdirSync(LOCAL_DIR, { recursive: true });
  console.log(`\n📚 vocab library — ${concepts.length} concept(s)${DRY ? " (dry: local only)" : ""}\n`);
  let ok = 0, skip = 0, fail = 0;

  for (const c of concepts) {
    process.stdout.write(`  ${c.slug.padEnd(20)} ${methodOf(c).padEnd(7)} `);
    try {
      if (!DRY && !FORCE && (await alreadyUploaded(c.slug))) {
        console.log("skip (in library)");
        skip++;
        continue;
      }
      const method = methodOf(c);
      const buf =
        method === "copy" ? copyTile(c)
        : method === "figure" ? renderFigure(baseImg, c)
        : method === "shape" ? renderShape(c)
        : method === "numeral" ? renderNumeral(c)
        : await renderObject(c);
      writeFileSync(join(LOCAL_DIR, `${c.slug}.png`), buf);
      if (DRY) console.log(`✓  → public/vocab-library/${c.slug}.png`);
      else console.log(`✓  ${await upload(c.slug, buf)}`);
      ok++;
      if (method === "flux") await new Promise((r) => setTimeout(r, THROTTLE_MS));
    } catch (e) {
      console.log(`✗  ${e.message}`);
      fail++;
    }
  }
  console.log(`\nDone.  ok=${ok}  skipped=${skip}  failed=${fail}\n`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
