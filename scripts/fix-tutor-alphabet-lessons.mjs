#!/usr/bin/env node
// scripts/fix-tutor-alphabet-lessons.mjs
//
// Patches tutor_lessons rows whose warmup_vocabulary section is a series of
// single bare letters (the alphabet-a-f / g-m / n-s / t-z lessons). For each
// such item, sets a `tts_text` field with the proper French letter name
// (Ache, Elle, Emme, Double Vé, I grec, Zède, ...) so the SpeakButton plays
// a real word the TTS engine knows, not a guess at an uppercase letter.
//
// Usage:
//   node --env-file=.env.local scripts/fix-tutor-alphabet-lessons.mjs            # dry-run
//   node --env-file=.env.local scripts/fix-tutor-alphabet-lessons.mjs --apply    # write to DB

import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// French letter names (spelled-out native words).
const FR_NAMES = {
  A:"A", B:"Bé", C:"Cé", D:"Dé", E:"E", F:"Effe", G:"Gé",
  H:"Ache", I:"I", J:"Ji", K:"Ka", L:"Elle", M:"Emme", N:"Enne",
  O:"O", P:"Pé", Q:"Ku", R:"Erre", S:"Esse", T:"Té", U:"U",
  V:"Vé", W:"Double Vé", X:"Ixe", Y:"I grec", Z:"Zède",
};

// Slugs to patch. All four French alphabet-range tutor lessons use the same
// shape: a warmup_vocabulary section whose items are bare single letters.
const SLUGS = ["alphabet-a-f", "alphabet-g-m", "alphabet-n-s", "alphabet-t-z"];

function patchContent(content) {
  if (!content || !Array.isArray(content.sections)) return { changed: false, content };
  let changed = false;
  const next = JSON.parse(JSON.stringify(content));
  for (const sec of next.sections) {
    if (sec.kind !== "warmup_vocabulary") continue;
    if (!Array.isArray(sec.items)) continue;
    for (const item of sec.items) {
      const t = (item.term || "").trim();
      // Only touch single-letter items in A-Z. Leave the rest alone.
      if (t.length === 1 && /^[A-Z]$/i.test(t)) {
        const upper = t.toUpperCase();
        const name = FR_NAMES[upper];
        if (name && item.tts_text !== name) {
          item.tts_text = name;
          changed = true;
        }
      }
    }
  }
  return { changed, content: next };
}

async function main() {
  console.log(`\n🔤 Tutor alphabet lessons — ${APPLY ? "APPLY" : "DRY RUN"}\n`);

  for (const slug of SLUGS) {
    const { data: lesson, error } = await s
      .from("tutor_lessons")
      .select("id, slug, title, content")
      .eq("slug", slug)
      .maybeSingle();
    if (error) { console.error(`  ❌ ${slug}: ${error.message}`); continue; }
    if (!lesson) { console.log(`  ⚠️  ${slug}: not found`); continue; }

    const { changed, content } = patchContent(lesson.content);
    const letterItems = (content.sections || [])
      .filter((s) => s.kind === "warmup_vocabulary")
      .flatMap((s) => s.items || [])
      .filter((it) => /^[A-Z]$/i.test((it.term || "").trim()));

    console.log(`  ${slug} (${lesson.title})`);
    console.log(`    letter items: ${letterItems.length}`);
    letterItems.slice(0, 3).forEach((it) =>
      console.log(`      term="${it.term}"  tts_text="${it.tts_text}"`)
    );
    if (!changed) {
      console.log(`    (no changes)`);
      continue;
    }

    if (!APPLY) {
      console.log(`    → would patch`);
      continue;
    }
    const { error: upErr } = await s.from("tutor_lessons").update({ content }).eq("id", lesson.id);
    if (upErr) console.error(`    ❌ ${upErr.message}`);
    else console.log(`    ✅ patched`);
  }

  console.log(APPLY ? "\nDone.\n" : "\n(dry run — pass --apply to write)\n");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
