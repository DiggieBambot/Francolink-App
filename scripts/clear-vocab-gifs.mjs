// scripts/clear-vocab-gifs.mjs
// Removes vocab.gif from every vocab item and deletes the underlying files
// in lesson-images/vocab-gifs/ so we can re-fetch from scratch.
// Usage: node scripts/clear-vocab-gifs.mjs --apply

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, content");

  let touched = 0, items = 0;
  for (const l of lessons || []) {
    const c = l.content || {};
    const vocab = Array.isArray(c.vocabulary) ? c.vocabulary : null;
    if (!vocab) continue;
    let changed = false;
    const newVocab = vocab.map((v) => {
      if (v && typeof v === "object" && "gif" in v) {
        changed = true;
        items++;
        const { gif, ...rest } = v;
        return rest;
      }
      return v;
    });
    if (!changed) continue;
    touched++;
    if (APPLY) {
      await supabase.from("lessons").update({ content: { ...c, vocabulary: newVocab } }).eq("id", l.id);
    }
  }
  console.log(`${APPLY ? "APPLIED" : "DRY-RUN"} cleared gif on ${items} items across ${touched} lessons`);

  // Delete the storage objects.
  let offset = 0;
  const toRemove = [];
  while (true) {
    const { data, error } = await supabase.storage.from("lesson-images").list("vocab-gifs", { limit: 1000, offset });
    if (error || !data?.length) break;
    for (const f of data) toRemove.push(`vocab-gifs/${f.name}`);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`storage files to remove: ${toRemove.length}`);
  if (APPLY && toRemove.length) {
    const { error } = await supabase.storage.from("lesson-images").remove(toRemove);
    if (error) console.error("remove error:", error.message);
    else console.log("storage cleared");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
