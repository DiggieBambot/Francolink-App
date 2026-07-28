#!/usr/bin/env node
// scripts/generate-food-extras.mjs
//
// pizza.png and oeuf.png (egg) hand-drawn with canvas instead of FLUX: the AI
// model kept adding clutter (other foods in frame) or unwanted extras (bird
// legs on the egg) despite explicit negative prompts. A simple flat vector
// shape is both faster and guaranteed correct for these two.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "games", "food");
const SIZE = 512;

function drawEgg() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);

  const cx = SIZE / 2, cy = SIZE / 2 + 20;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 170);
  ctx.bezierCurveTo(cx + 130, cy - 170, cx + 130, cy + 60, cx + 100, cy + 120);
  ctx.bezierCurveTo(cx + 60, cy + 190, cx - 60, cy + 190, cx - 100, cy + 120);
  ctx.bezierCurveTo(cx - 130, cy + 60, cx - 130, cy - 170, cx, cy - 170);
  ctx.closePath();
  ctx.fillStyle = "#fdf6ec";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#e8dcc8";
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx - 45, cy - 70, 24, 55, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fill();

  return canvas.toBuffer("image/png");
}

function drawPizza() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);

  const cx = SIZE / 2, cy = SIZE / 2, r = 190;

  // crust
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#f0b84f";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#c9862a";
  ctx.stroke();

  // cheese base
  ctx.beginPath();
  ctx.arc(cx, cy, r - 22, 0, Math.PI * 2);
  ctx.fillStyle = "#fcd97a";
  ctx.fill();

  // slice lines (6 slices)
  ctx.strokeStyle = "#e0ac4a";
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * (r - 22), cy + Math.sin(a) * (r - 22));
    ctx.stroke();
  }

  // pepperoni
  const pepperoni = [
    [cx - 80, cy - 60], [cx + 70, cy - 40], [cx - 20, cy + 20],
    [cx + 60, cy + 80], [cx - 90, cy + 70], [cx + 10, cy - 100],
  ];
  for (const [x, y] of pepperoni) {
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#d9432e";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#a72e1d";
    ctx.stroke();
  }

  return canvas.toBuffer("image/png");
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "oeuf.png"), drawEgg());
writeFileSync(join(OUT_DIR, "pizza.png"), drawPizza());
console.log("Drew oeuf.png and pizza.png in public/games/food/");
