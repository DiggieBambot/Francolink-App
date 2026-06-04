// scripts/generate-vocab-gifs.mjs
//
// Adds an animated GIF to verb-like vocab items using the GIPHY v1 API.
// GIFs are downloaded once and cached in Supabase Storage so we never hotlink
// GIPHY's CDN at runtime.
//
// Usage:
//   node scripts/generate-vocab-gifs.mjs               # dry-run (counts only)
//   node scripts/generate-vocab-gifs.mjs --apply       # actually fetch + upload
//   node scripts/generate-vocab-gifs.mjs --apply --limit=10
//
// Requires:
//   GIPHY_API_KEY=... in .env.local  (developers.giphy.com → create app)
//
// Resume-safe: skips any item where vocab.gif is already set.

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : Infinity;

const BUCKET = "lesson-images";
const PREFIX = "vocab-gifs";
const THROTTLE_MS = 250; // gentle pace against Tenor

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GIPHY_KEY = process.env.GIPHY_API_KEY;
if (APPLY && !GIPHY_KEY) {
  console.error("Missing GIPHY_API_KEY in .env.local");
  process.exit(1);
}

function asciiSlug(s, maxLen = 60) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen);
}

// Take the first segment when a translation lists multiple meanings ("like /
// to love"), strip leading articles/"to", and remove punctuation so the
// resulting Tenor query is a single clean phrase.
function cleanQuery(translation) {
  const first = String(translation || "").split(/[\/,;|]/)[0];
  return first
    .trim()
    .toLowerCase()
    .replace(/^(to |the |a |an )/g, "")
    .replace(/[^a-z0-9 \-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Word-boundary verb check. Matches "verb", "verb/noun", "noun/verb",
// "verb phrase", but NOT "adverb".
function isVerbish(pos) {
  if (!pos) return false;
  const tokens = String(pos).toLowerCase().split(/[\/,\s]+/).filter(Boolean);
  return tokens.includes("verb");
}

async function giphySearch(query) {
  // Stickers endpoint: cleaner, illustration-style, mostly transparent
  // backgrounds — much better fit for vocab flashcards than reaction GIFs.
  const url = new URL("https://api.giphy.com/v1/stickers/search");
  url.searchParams.set("api_key", GIPHY_KEY);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  url.searchParams.set("rating", "g");
  url.searchParams.set("lang", "en");
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const txt = await res.text();
    const err = new Error(`GIPHY ${res.status}: ${txt.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// GIPHY image renditions we care about, in preference order. Each has a
// .url + .width + .height + .size (string of bytes).
// Picking a ~200px tall rendition is plenty for the 80px flashcard slot.
const PREFERRED_RENDITIONS = [
  "fixed_height_small",     // ~100px tall
  "fixed_height",           // ~200px tall
  "fixed_width_small",      // ~100px wide
  "downsized_small",        // <= 200KB mp4 — skip non-gif
];

function pickBestResult(results) {
  if (!Array.isArray(results) || results.length === 0) return null;
  for (const r of results) {
    const images = r?.images || {};
    for (const key of PREFERRED_RENDITIONS) {
      const rend = images[key];
      if (!rend?.url) continue;
      const url = rend.url;
      // Only accept .gif (downsized_small is mp4)
      if (!url.includes(".gif")) continue;
      const w = parseInt(rend.width, 10) || 0;
      const h = parseInt(rend.height, 10) || 0;
      const size = parseInt(rend.size, 10) || 0;
      if (w < 80 || h < 80) continue;
      if (size > 1_500_000) continue;
      return { url, dims: [w, h], size };
    }
  }
  // last-resort: original.url from first result
  const first = results[0]?.images?.original?.url;
  return first ? { url: first } : null;
}

async function downloadAndUpload(srcUrl, slug) {
  const res = await fetch(srcUrl);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const path = `${PREFIX}/${slug}.gif`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: "image/gif", upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}

async function main() {
  console.log("─".repeat(72));
  console.log(`Vocab GIF generation (${APPLY ? "APPLY" : "DRY-RUN"})`);
  console.log(`Scope: verb-ish part-of-speech only   Bucket: ${BUCKET}/${PREFIX}`);
  console.log("─".repeat(72));

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, content");

  const eligible = [];
  let lessonsWithEligible = 0;
  for (const l of lessons || []) {
    const vocab = Array.isArray(l.content?.vocabulary) ? l.content.vocabulary : [];
    let touched = false;
    vocab.forEach((v, idx) => {
      if (!isVerbish(v?.partOfSpeech)) return;
      if (v?.gif) return; // already done
      const term = v?.term ?? v?.word ?? v?.french;
      const translation = v?.translation ?? v?.definition ?? v?.meaning;
      if (!term || !translation) return;
      eligible.push({ lessonId: l.id, title: l.title, idx, term, translation, pos: v.partOfSpeech });
      touched = true;
    });
    if (touched) lessonsWithEligible++;
  }

  console.log(`Lessons checked: ${lessons?.length ?? 0}`);
  console.log(`Lessons with verb-ish vocab missing GIFs: ${lessonsWithEligible}`);
  console.log(`Eligible vocab items: ${eligible.length}`);

  if (eligible.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  if (!APPLY) {
    console.log("\nFirst 10 to attempt:");
    for (const e of eligible.slice(0, 10)) {
      console.log(`  · "${e.term}" → "${cleanQuery(e.translation)}" [${e.pos}]`);
    }
    console.log("\nDRY-RUN — pass --apply to fetch + upload.");
    return;
  }

  const slice = eligible.slice(0, LIMIT);
  if (LIMIT < Infinity) console.log(`(--limit=${LIMIT})`);

  let ok = 0, skipped = 0, failed = 0;
  for (let i = 0; i < slice.length; i++) {
    const e = slice[i];
    const tag = `[${i + 1}/${slice.length}]`;
    const query = cleanQuery(e.translation);
    process.stdout.write(`${tag} "${e.term}" (${query})… `);
    try {
      const data = await giphySearch(query);
      const best = pickBestResult(data?.data);
      if (!best) {
        console.log("— no match");
        skipped++;
        continue;
      }
      const slug = `${asciiSlug(e.term)}-${asciiSlug(e.translation, 30)}`;
      const publicUrl = await downloadAndUpload(best.url, slug);

      // Re-read current lesson content (avoid clobbering concurrent updates)
      const { data: cur } = await supabase
        .from("lessons")
        .select("content")
        .eq("id", e.lessonId)
        .single();
      const content = cur?.content || {};
      const vocab = Array.isArray(content.vocabulary) ? [...content.vocabulary] : [];
      if (!vocab[e.idx]) {
        console.log("— vocab index gone");
        failed++;
        continue;
      }
      vocab[e.idx] = { ...vocab[e.idx], gif: publicUrl };
      const { error: upErr } = await supabase
        .from("lessons")
        .update({ content: { ...content, vocabulary: vocab } })
        .eq("id", e.lessonId);
      if (upErr) throw new Error(`DB update: ${upErr.message}`);
      console.log("✓");
      ok++;
    } catch (err) {
      console.log(`✗ ${err.message?.slice(0, 100) || err}`);
      failed++;
      if (err.status === 403 || err.status === 401) {
        console.error("→ auth failure, stopping early");
        break;
      }
    }
    await new Promise((r) => setTimeout(r, THROTTLE_MS));
  }

  console.log(`\n${"─".repeat(72)}`);
  console.log(`Done. ok=${ok}  no_match=${skipped}  failed=${failed}`);
  console.log("Re-run any time — items with gif set are skipped.");
}

main().catch((e) => { console.error(e); process.exit(1); });
