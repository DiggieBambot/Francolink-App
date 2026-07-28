#!/usr/bin/env node
// scripts/generate-color-swatches.mjs
//
// Colors are drawn directly with canvas instead of an AI model — asking FLUX
// for "a solid red swatch" risks gradients, off-hues, or stray shapes, and a
// color word has an exact, known value. A rounded rect in the precise hex is
// unambiguous by construction and needs no QA pass.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "games", "colors");
const SIZE = 512;

// Kid-friendly, unambiguous hues — bright and saturated, not muddy in-betweens.
const SWATCHES = [
  { slug: "rouge",  hex: "#ef4444" },
  { slug: "bleu",   hex: "#3b82f6" },
  { slug: "vert",   hex: "#22c55e" },
  { slug: "jaune",  hex: "#facc15" },
  { slug: "orange", hex: "#f97316" },
  { slug: "violet", hex: "#a855f7" },
  { slug: "rose",   hex: "#ec4899" },
  { slug: "noir",   hex: "#1f2937" },
  { slug: "blanc",  hex: "#ffffff", stroke: "#d1d5db" },
  { slug: "marron", hex: "#92400e" },
  { slug: "gris",   hex: "#9ca3af" },
];

function draw({ hex, stroke }) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);

  const pad = 64, r = 48;
  const w = SIZE - pad * 2, h = SIZE - pad * 2;
  ctx.beginPath();
  ctx.moveTo(pad + r, pad);
  ctx.arcTo(pad + w, pad, pad + w, pad + h, r);
  ctx.arcTo(pad + w, pad + h, pad, pad + h, r);
  ctx.arcTo(pad, pad + h, pad, pad, r);
  ctx.arcTo(pad, pad, pad + w, pad, r);
  ctx.closePath();
  ctx.fillStyle = hex;
  ctx.fill();
  if (stroke) { ctx.lineWidth = 4; ctx.strokeStyle = stroke; ctx.stroke(); }
  return canvas.toBuffer("image/png");
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
console.log(`\n🎨 Color swatches — ${SWATCHES.length} item(s)\n`);
for (const s of SWATCHES) {
  writeFileSync(join(OUT_DIR, `${s.slug}.png`), draw(s));
  console.log(`  ${s.slug.padEnd(10)} ${s.hex}  ✓`);
}
console.log(`\nDone.\n`);
