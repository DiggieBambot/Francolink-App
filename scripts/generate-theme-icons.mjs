#!/usr/bin/env node
// scripts/generate-theme-icons.mjs
//
// Generates one clean icon illustration per game theme via Cloudflare Workers
// AI (FLUX-1-schnell), uploads to Supabase Storage under theme-icons/, and
// prints the public URLs so they can be pasted into src/lib/games/themes.ts.
//
// Usage:
//   node --env-file=.env.local scripts/generate-theme-icons.mjs            # dry-run (prompts)
//   node --env-file=.env.local scripts/generate-theme-icons.mjs --apply    # generate + upload

import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const BUCKET = "lesson-images";
const PREFIX = "theme-icons";

if (APPLY && (!ACCOUNT_ID || !API_TOKEN)) {
  console.error("Missing CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN.");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// [slug, subject-for-the-icon]
const THEME_ICONS = [
  ["animals", "a cute happy dog and cat"],
  ["food", "a slice of pizza and an apple"],
  ["clothes", "a t-shirt and a hat"],
  ["body", "a smiling cartoon face"],
  ["family", "a happy family of parents and a child"],
  ["home", "a cozy little house"],
  ["colors", "a rainbow paint palette"],
  ["numbers", "colorful numbers one two three"],
  ["actions", "a running person in motion"],
  ["places", "a city skyline with a park"],
  ["travel", "a car, a plane and a suitcase"],
  ["weather", "a sun behind a cloud with raindrops"],
  ["time", "a friendly wall clock and calendar"],
  ["nature", "a green tree and a flower"],
  ["sports", "a soccer ball and a basketball"],
];

function promptFor(subject) {
  return [
    subject,
    "single centered icon",
    "flat vector illustration, sticker style",
    "bold rounded shapes, bright cheerful colors, thick clean outlines",
    "plain white background",
    "no text, no letters, no words",
    "app icon, children's education app",
  ].join(", ");
}

async function generateImage(prompt) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, num_steps: 4 }),
  });
  if (!res.ok) throw new Error(`CF ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const b64 = json?.result?.image;
  if (!b64) throw new Error(`No image: ${JSON.stringify(json).slice(0, 200)}`);
  return Buffer.from(b64, "base64");
}

async function upload(buffer, slug) {
  const path = `${PREFIX}/${slug}.png`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: "image/png",
    upsert: true,
  });
  if (error && !/already exists/i.test(error.message)) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function main() {
  console.log(`\n🎨 Theme icons — ${APPLY ? "APPLY" : "DRY RUN"}\n`);
  const results = {};
  for (const [slug, subject] of THEME_ICONS) {
    const prompt = promptFor(subject);
    if (!APPLY) {
      console.log(`  ${slug.padEnd(10)} ${prompt}`);
      continue;
    }
    process.stdout.write(`  ${slug.padEnd(10)} `);
    try {
      const png = await generateImage(prompt);
      const url = await upload(png, slug);
      results[slug] = url;
      console.log("✓");
    } catch (e) {
      console.log(`✗ ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  if (APPLY) {
    console.log("\n// icon URLs by slug (paste into themes.ts):");
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log("\n(dry run — pass --apply to generate.)");
  }
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
