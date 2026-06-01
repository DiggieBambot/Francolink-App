// scripts/strip-vocab-audio.mjs
// Removes the dead `audio` key from every lesson.content.vocabulary[*].
// Usage: node scripts/strip-vocab-audio.mjs           (dry-run)
//        node scripts/strip-vocab-audio.mjs --apply   (writes)

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id, title, content");

  if (error) throw error;

  let lessonsTouched = 0;
  let itemsTouched = 0;

  for (const l of lessons) {
    const c = l.content || {};
    const vocab = Array.isArray(c.vocabulary) ? c.vocabulary : null;
    if (!vocab) continue;

    let changed = false;
    const newVocab = vocab.map((v) => {
      if (v && typeof v === "object" && "audio" in v) {
        changed = true;
        itemsTouched++;
        const { audio, ...rest } = v;
        return rest;
      }
      return v;
    });

    if (!changed) continue;
    lessonsTouched++;

    if (APPLY) {
      const newContent = { ...c, vocabulary: newVocab };
      const { error: upErr } = await supabase
        .from("lessons")
        .update({ content: newContent })
        .eq("id", l.id);
      if (upErr) {
        console.error(`  ✗ ${l.title}: ${upErr.message}`);
      } else {
        console.log(`  ✓ ${l.title} (${vocab.filter(v => v?.audio).length} items)`);
      }
    } else {
      console.log(`  · ${l.title} would drop ${vocab.filter(v => v?.audio).length} audio keys`);
    }
  }

  console.log(`\n${APPLY ? "APPLIED" : "DRY-RUN"}: lessons touched=${lessonsTouched}, vocab items touched=${itemsTouched}`);
  if (!APPLY) console.log("Re-run with --apply to write.");
}

main().catch((e) => { console.error(e); process.exit(1); });
