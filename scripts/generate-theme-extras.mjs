#!/usr/bin/env node
// scripts/generate-theme-extras.mjs
//
// Hand-drawn canvas replacements for images that failed QA (baked-in text,
// garbled captions, or visual confusion with another item in the same theme)
// after the day's Cloudflare Workers AI free-tier quota was exhausted. Same
// rationale as scripts/generate-food-extras.mjs.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SIZE = 512;

function card(draw) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  draw(ctx);
  return canvas.toBuffer("image/png");
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ── travel/bus.png — yellow bus, no text ────────────────────────────────
function drawBus(ctx) {
  const bx = 90, by = 190, bw = 332, bh = 150;
  roundedRect(ctx, bx, by, bw, bh, 34);
  ctx.fillStyle = "#f9c53a";
  ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = "#c98f14"; ctx.stroke();

  // windows
  ctx.fillStyle = "#bfe3ee";
  for (let i = 0; i < 4; i++) {
    roundedRect(ctx, bx + 30 + i * 72, by + 26, 54, 46, 8);
    ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "#2c3e50"; ctx.stroke();
  }
  // door line
  ctx.strokeStyle = "#c98f14"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(bx + bw - 66, by); ctx.lineTo(bx + bw - 66, by + bh); ctx.stroke();
  // stripe
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(bx, by + bh - 46, bw, 12);
  // wheels
  for (const wx of [bx + 78, bx + bw - 78]) {
    ctx.beginPath(); ctx.arc(wx, by + bh, 32, 0, Math.PI * 2);
    ctx.fillStyle = "#2c3e50"; ctx.fill();
    ctx.beginPath(); ctx.arc(wx, by + bh, 13, 0, Math.PI * 2);
    ctx.fillStyle = "#95a5a6"; ctx.fill();
  }
}

// ── home/maison.png — simple house, no text ─────────────────────────────
function drawHouse(ctx) {
  const cx = 256, baseY = 400, w = 220, h = 150, roofH = 100;
  // walls
  ctx.fillStyle = "#fde8b8";
  ctx.fillRect(cx - w / 2, baseY - h, w, h);
  ctx.lineWidth = 6; ctx.strokeStyle = "#c98f14"; ctx.strokeRect(cx - w / 2, baseY - h, w, h);
  // roof
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 24, baseY - h);
  ctx.lineTo(cx, baseY - h - roofH);
  ctx.lineTo(cx + w / 2 + 24, baseY - h);
  ctx.closePath();
  ctx.fillStyle = "#e0574a"; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = "#a63a2f"; ctx.stroke();
  // door
  roundedRect(ctx, cx - 32, baseY - 92, 64, 92, 8);
  ctx.fillStyle = "#8a5a2b"; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = "#5c3a1b"; ctx.stroke();
  // windows
  for (const wx of [cx - 74, cx + 44]) {
    roundedRect(ctx, wx, baseY - h + 26, 40, 40, 6);
    ctx.fillStyle = "#bfe3ee"; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "#2c3e50"; ctx.stroke();
  }
  // ground
  ctx.beginPath(); ctx.ellipse(cx, baseY + 10, w / 2 + 50, 18, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#a7d97a"; ctx.fill();
}

// ── home/lit.png — bed, no watermark ─────────────────────────────────────
function drawBed(ctx) {
  const bx = 90, by = 230, bw = 332, bh = 100;
  // frame
  roundedRect(ctx, bx, by, bw, bh, 16);
  ctx.fillStyle = "#f7cf82"; ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = "#a6711f"; ctx.stroke();
  // posts
  for (const px of [bx + 14, bx + bw - 14]) {
    ctx.beginPath(); ctx.arc(px, by - 6, 16, 0, Math.PI * 2);
    ctx.fillStyle = "#f0b854"; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "#a6711f"; ctx.stroke();
    ctx.fillRect(px - 12, by - 6, 24, bh + 40);
    ctx.strokeRect(px - 12, by - 6, 24, bh + 40);
  }
  // pillow
  roundedRect(ctx, bx + 60, by - 46, 130, 70, 22);
  ctx.fillStyle = "#fdf0d5"; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = "#c98f14"; ctx.stroke();
  // blanket
  ctx.beginPath();
  ctx.moveTo(bx + 190, by + 10);
  ctx.quadraticCurveTo(bx + 260, by - 10, bx + 300, by + 20);
  ctx.lineTo(bx + 300, by + bh + 34);
  ctx.lineTo(bx + 190, by + bh + 34);
  ctx.closePath();
  ctx.fillStyle = "#6fb3d8"; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = "#3f7fa3"; ctx.stroke();
}

// ── home/fourchette.png — fork alone, no plate ───────────────────────────
function drawFork(ctx) {
  ctx.save();
  ctx.translate(256, 256);
  ctx.fillStyle = "#c7d3da";
  ctx.strokeStyle = "#5b6b74";
  ctx.lineWidth = 5;

  // single continuous silhouette: 4 tines -> head -> long handle
  const tineW = 12, tineGap = 16, tineTop = -220, tineBottom = -140;
  const tineXs = [-1.5 * tineGap, -0.5 * tineGap, 0.5 * tineGap, 1.5 * tineGap];

  ctx.beginPath();
  // left side, up the outer tine
  ctx.moveTo(tineXs[0] - tineW / 2, tineBottom);
  ctx.lineTo(tineXs[0] - tineW / 2, tineTop);
  ctx.arc(tineXs[0], tineTop, tineW / 2, Math.PI, 0, false);
  ctx.lineTo(tineXs[0] + tineW / 2, tineBottom);
  // across to next tine (valley)
  for (let i = 1; i < 4; i++) {
    ctx.lineTo(tineXs[i] - tineW / 2, tineBottom);
    ctx.lineTo(tineXs[i] - tineW / 2, tineTop);
    ctx.arc(tineXs[i], tineTop, tineW / 2, Math.PI, 0, false);
    ctx.lineTo(tineXs[i] + tineW / 2, tineBottom);
  }
  // shoulder out to the head/handle
  ctx.lineTo(46, -110);
  ctx.quadraticCurveTo(50, -60, 22, -20);
  ctx.lineTo(22, 190);
  ctx.arc(0, 190, 22, 0, Math.PI, false);
  ctx.lineTo(-22, -20);
  ctx.quadraticCurveTo(-50, -60, -46, -110);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ── nature/champignon.png — mushroom, no caption ─────────────────────────
function drawMushroom(ctx) {
  const cx = 256, capY = 210;
  // stem
  roundedRect(ctx, cx - 34, capY, 68, 140, 24);
  ctx.fillStyle = "#fdf1da"; ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = "#d68a3a"; ctx.stroke();
  // cap
  ctx.beginPath();
  ctx.ellipse(cx, capY, 130, 90, 0, Math.PI, 0, false);
  ctx.closePath();
  ctx.fillStyle = "#e0392e"; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = "#a3241c"; ctx.stroke();
  // spots
  ctx.fillStyle = "#ffffff";
  const spots = [[-70, -50, 16], [-20, -75, 14], [35, -68, 15], [80, -40, 13], [0, -30, 12]];
  for (const [dx, dy, r] of spots) {
    ctx.beginPath(); ctx.arc(cx + dx, capY + dy, r, 0, Math.PI * 2); ctx.fill();
  }
}

const TARGETS = [
  { theme: "travel", slug: "bus", draw: drawBus },
  { theme: "home", slug: "maison", draw: drawHouse },
  { theme: "home", slug: "lit", draw: drawBed },
  { theme: "home", slug: "fourchette", draw: drawFork },
  { theme: "nature", slug: "champignon", draw: drawMushroom },
];

for (const t of TARGETS) {
  const dir = join(ROOT, "public", "games", t.theme);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${t.slug}.png`), card(t.draw));
  console.log(`  ${t.theme}/${t.slug}.png ✓`);
}
console.log("\nDone.\n");
