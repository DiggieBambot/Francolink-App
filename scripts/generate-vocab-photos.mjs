// scripts/generate-vocab-photos.mjs
//
// Fetches a clean stock photo for every vocab item via the Pexels API,
// caches it in Supabase Storage at lesson-images/vocab-photos/<slug>.jpg,
// and writes the public URL to lessons.content.vocabulary[].image.
//
// Usage:
//   node scripts/generate-vocab-photos.mjs               # dry-run (counts)
//   node scripts/generate-vocab-photos.mjs --apply       # fetch + upload
//   node scripts/generate-vocab-photos.mjs --apply --limit=20
//
// Requires PEXELS_API_KEY in .env.local. Resume-safe: skips items where
// vocab.image already starts with the lesson-images/vocab-photos prefix.

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : Infinity;

const BUCKET = "lesson-images";
const PREFIX = "vocab-photos";
const THROTTLE_MS = 250; // Pexels free tier: 200 req/hr — well within limit

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PEXELS_KEY = process.env.PEXELS_API_KEY;
if (APPLY && !PEXELS_KEY) {
  console.error("Missing PEXELS_API_KEY in .env.local");
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

// Take first segment of "X / Y", strip "to/the/a/an", drop punctuation.
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

async function pexelsSearch(query) {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "5");
  url.searchParams.set("orientation", "square");
  url.searchParams.set("size", "small");
  const res = await fetch(url, {
    headers: { Authorization: PEXELS_KEY, Accept: "application/json" },
  });
  if (!res.ok) {
    const txt = await res.text();
    const err = new Error(`Pexels ${res.status}: ${txt.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Pexels Photo.src has: original, large, large2x, medium, small, portrait,
// landscape, tiny. "medium" is ~350px wide — perfect for the 80px display
// slot and keeps payload small.
function pickPhoto(results) {
  if (!Array.isArray(results) || results.length === 0) return null;
  for (const r of results) {
    const url = r?.src?.medium;
    if (url) return { url, alt: r.alt || "", id: r.id };
  }
  return null;
}

async function downloadAndUpload(srcUrl, slug) {
  const res = await fetch(srcUrl);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const ext = contentType.includes("png") ? "png" : "jpg";
  const path = `${PREFIX}/${slug}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}

function alreadyPexels(image) {
  return typeof image === "string" && image.includes(`/${BUCKET}/${PREFIX}/`);
}

async function main() {
  console.log("─".repeat(72));
  console.log(`Vocab photos via Pexels (${APPLY ? "APPLY" : "DRY-RUN"})`);
  console.log(`Bucket: ${BUCKET}/${PREFIX}   Throttle: ${THROTTLE_MS}ms`);
  console.log("─".repeat(72));

  const { data: lessons } = await supabase.from("lessons").select("id, content");
  const eligible = [];
  for (const l of lessons || []) {
    const vocab = Array.isArray(l.content?.vocabulary) ? l.content.vocabulary : [];
    vocab.forEach((v, idx) => {
      if (alreadyPexels(v?.image)) return;
      const term = v?.term ?? v?.word ?? v?.french;
      const translation = v?.translation ?? v?.definition ?? v?.meaning;
      if (!term || !translation) return;
      eligible.push({
        lessonId: l.id,
        idx,
        term,
        translation,
        query: cleanQuery(translation),
      });
    });
  }

  console.log(`Lessons checked: ${lessons?.length ?? 0}`);
  console.log(`Eligible vocab items: ${eligible.length}`);

  if (eligible.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  if (!APPLY) {
    console.log("\nFirst 10 queries:");
    for (const e of eligible.slice(0, 10)) {
      console.log(`  · "${e.term}" → "${e.query}"`);
    }
    console.log("\nDRY-RUN — pass --apply to fetch + upload.");
    return;
  }

  const slice = eligible.slice(0, LIMIT);
  if (LIMIT < Infinity) console.log(`(--limit=${LIMIT})`);

  let ok = 0, skipped = 0, failed = 0;
  const start = Date.now();

  for (let i = 0; i < slice.length; i++) {
    const e = slice[i];
    const tag = `[${i + 1}/${slice.length}]`;
    process.stdout.write(`${tag} "${e.term}" (${e.query})… `);
    try {
      if (!e.query) {
        console.log("— empty query");
        skipped++;
        continue;
      }
      const data = await pexelsSearch(e.query);
      const photo = pickPhoto(data?.photos);
      if (!photo) {
        console.log("— no match");
        skipped++;
        continue;
      }
      const slug = `${asciiSlug(e.term)}-${asciiSlug(e.query, 30)}`;
      const publicUrl = await downloadAndUpload(photo.url, slug);

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
      vocab[e.idx] = { ...vocab[e.idx], image: publicUrl };
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
      if (err.status === 401 || err.status === 403) {
        console.error("→ auth failure, stopping");
        break;
      }
    }
    await new Promise((r) => setTimeout(r, THROTTLE_MS));

    if ((i + 1) % 50 === 0) {
      const elapsed = (Date.now() - start) / 1000;
      const rate = (i + 1) / elapsed;
      const remaining = (slice.length - i - 1) / rate;
      console.log(`   … ${ok} ok / ${skipped} no_match / ${failed} failed   rate=${rate.toFixed(2)}/s   eta=${Math.round(remaining)}s`);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  console.log(`\n${"─".repeat(72)}`);
  console.log(`Done in ${elapsed}s.  ok=${ok}  no_match=${skipped}  failed=${failed}`);
  console.log("Resume-safe: re-run any time to fill misses.");
}

main().catch((e) => { console.error(e); process.exit(1); });
