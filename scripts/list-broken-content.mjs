// scripts/list-broken-content.mjs
// READ-ONLY. Lists lessons with missing grammar+dialogue, and vocab items missing term/translation.
// Usage: node scripts/list-broken-content.mjs

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function vocabFields(v) {
  return {
    term: v.term ?? v.word ?? v.french ?? null,
    translation: v.translation ?? v.definition ?? v.meaning ?? null,
  };
}

async function main() {
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select(`
      id, title, slug,
      content,
      unit:units (
        title,
        course:courses (title, slug, level)
      )
    `)
    .order("created_at");
  if (error) throw error;

  // 1. Lessons missing both grammar and dialogue
  console.log("─".repeat(72));
  console.log("LESSONS missing BOTH grammar AND dialogue:");
  console.log("─".repeat(72));
  const brokenLessons = [];
  for (const l of lessons) {
    const c = l.content || {};
    const noGrammar = !c.grammar || (Array.isArray(c.grammar) && c.grammar.length === 0);
    const noDialogue = !c.dialogue;
    if (noGrammar && noDialogue) {
      brokenLessons.push(l);
      const course = l.unit?.course;
      const vocab = Array.isArray(c.vocabulary) ? c.vocabulary.length : 0;
      const culture = c.culture ? "✓" : "✗";
      console.log(
        `  · [${course?.level ?? "??"}] ${course?.title ?? "?"}`
      );
      console.log(
        `    └─ "${l.title}" (slug: ${l.slug})`
      );
      console.log(
        `       vocab=${vocab}  grammar=✗  dialogue=✗  culture=${culture}  id=${l.id}`
      );
    }
  }
  console.log(`\nTotal broken lessons: ${brokenLessons.length}\n`);

  // 2. Vocab items missing term and/or translation
  console.log("─".repeat(72));
  console.log("VOCAB ITEMS missing term and/or translation:");
  console.log("─".repeat(72));
  let totalBroken = 0;
  const brokenByLesson = new Map();
  for (const l of lessons) {
    const c = l.content || {};
    const vocab = Array.isArray(c.vocabulary) ? c.vocabulary : [];
    const broken = [];
    vocab.forEach((v, idx) => {
      const f = vocabFields(v);
      if (!f.term || !f.translation) {
        broken.push({ idx, raw: v, missing: { term: !f.term, translation: !f.translation } });
      }
    });
    if (broken.length) {
      brokenByLesson.set(l, broken);
      totalBroken += broken.length;
    }
  }
  for (const [l, broken] of brokenByLesson) {
    const course = l.unit?.course;
    console.log(`\n  · [${course?.level ?? "??"}] "${l.title}" (slug: ${l.slug})`);
    for (const b of broken) {
      const missing = [
        b.missing.term ? "term" : "",
        b.missing.translation ? "translation" : "",
      ].filter(Boolean).join("+");
      const preview = JSON.stringify(b.raw).slice(0, 120);
      console.log(`     [${b.idx}] missing=${missing}  data=${preview}`);
    }
  }
  console.log(`\nTotal broken vocab items: ${totalBroken}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
