#!/usr/bin/env node
// scripts/generate-number-cards.mjs
//
// Renders 1–10 as clean numeral cards with canvas instead of an AI model —
// see the note in src/lib/games/curated/numbers.ts for why.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "games", "numbers");
const SIZE = 512;

const CARDS = [
  { slug: "un", n: "1", bg: "#ef4444" },
  { slug: "deux", n: "2", bg: "#3b82f6" },
  { slug: "trois", n: "3", bg: "#22c55e" },
  { slug: "quatre", n: "4", bg: "#facc15" },
  { slug: "cinq", n: "5", bg: "#f97316" },
  { slug: "six", n: "6", bg: "#a855f7" },
  { slug: "sept", n: "7", bg: "#ec4899" },
  { slug: "huit", n: "8", bg: "#06b6d4" },
  { slug: "neuf", n: "9", bg: "#84cc16" },
  { slug: "dix", n: "10", bg: "#6366f1" },
];

function draw({ n, bg }) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);

  const pad = 48, r = 48;
  const w = SIZE - pad * 2, h = SIZE - pad * 2;
  ctx.beginPath();
  ctx.moveTo(pad + r, pad);
  ctx.arcTo(pad + w, pad, pad + w, pad + h, r);
  ctx.arcTo(pad + w, pad + h, pad, pad + h, r);
  ctx.arcTo(pad, pad + h, pad, pad, r);
  ctx.arcTo(pad, pad, pad + w, pad, r);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${n.length > 1 ? 220 : 300}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(n, SIZE / 2, SIZE / 2 + 20);
  return canvas.toBuffer("image/png");
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
console.log(`\n🔢 Number cards — ${CARDS.length} item(s)\n`);
for (const c of CARDS) {
  writeFileSync(join(OUT_DIR, `${c.slug}.png`), draw(c));
  console.log(`  ${c.slug.padEnd(10)} ${c.n}  ✓`);
}
console.log(`\nDone.\n`);
