// scripts/clear-vocab-visuals.mjs
// Clears image AND gif fields from every vocab item and deletes the
// underlying storage objects in lesson-images/vocab/ and
// lesson-images/vocab-gifs/ so we can repopulate from a single source.
//
// Usage: node scripts/clear-vocab-visuals.mjs --apply

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const KEEP_VOCAB_FOLDER = process.argv.includes("--keep-vocab-folder"); // don't delete files under vocab/

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listAll(prefix) {
  const all = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage
      .from("lesson-images")
      .list(prefix, { limit: 1000, offset });
    if (error || !data?.length) break;
    for (const f of data) all.push(`${prefix}/${f.name}`);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

async function main() {
  const { data: lessons } = await supabase.from("lessons").select("id, content");
  let touched = 0, imageCleared = 0, gifCleared = 0;

  for (const l of lessons || []) {
    const c = l.content || {};
    const vocab = Array.isArray(c.vocabulary) ? c.vocabulary : null;
    if (!vocab) continue;
    let changed = false;
    const newVocab = vocab.map((v) => {
      if (!v || typeof v !== "object") return v;
      const { image, gif, ...rest } = v;
      if ("image" in v) imageCleared++;
      if ("gif" in v) gifCleared++;
      if ("image" in v || "gif" in v) changed = true;
      return rest;
    });
    if (!changed) continue;
    touched++;
    if (APPLY) {
      await supabase.from("lessons").update({ content: { ...c, vocabulary: newVocab } }).eq("id", l.id);
    }
  }

  console.log(`${APPLY ? "APPLIED" : "DRY-RUN"} cleared image on ${imageCleared} items, gif on ${gifCleared} items across ${touched} lessons`);

  const vocabGifs = await listAll("vocab-gifs");
  const vocab = KEEP_VOCAB_FOLDER ? [] : await listAll("vocab");
  console.log(`storage files under vocab-gifs: ${vocabGifs.length}`);
  if (!KEEP_VOCAB_FOLDER) console.log(`storage files under vocab: ${vocab.length}`);

  if (APPLY) {
    const all = [...vocabGifs, ...vocab];
    // Supabase remove() accepts up to 1000 keys per call.
    for (let i = 0; i < all.length; i += 900) {
      const batch = all.slice(i, i + 900);
      const { error } = await supabase.storage.from("lesson-images").remove(batch);
      if (error) console.error(`batch ${i}: ${error.message}`);
    }
    console.log("storage cleared");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
