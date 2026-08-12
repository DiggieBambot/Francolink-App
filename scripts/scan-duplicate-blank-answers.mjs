// scripts/scan-duplicate-blank-answers.mjs
// READ-ONLY. Finds the "misplaced blank" content bug: a blank's correct answer
// word/phrase already appears literally elsewhere in the same line's text —
// e.g. "(2) mes amis s'appellent Eli et Sophie." with answer "s'appellent"
// duplicates the word once filled. This means the blank marker sits in the
// wrong position (usually mis-generated at the sentence start instead of where
// the word actually belongs).
//
// Reports every match with an unambiguous single duplicate occurrence (safe to
// auto-fix by relocating the marker) vs. ambiguous cases (skip, needs a human).
//
// Usage: node scripts/scan-duplicate-blank-answers.mjs

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function wordRegex(answer) {
  const escaped = answer.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}'])${escaped}(?![\\p{L}'])`, "giu");
}

function die(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    die("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  }
  const { data: lessons, error } = await supa.from("tutor_lessons").select("id, title, content");
  if (error) die(error.message);

  let unambiguous = 0;
  let ambiguous = 0;
  const rows = [];

  for (const lesson of lessons || []) {
    for (const section of lesson.content?.sections || []) {
      if (section.kind !== "fill_in_blank_dialogue" && section.kind !== "fill_in_blank_dialogue_extended") continue;
      const validByBlank = section.valid_answers_by_blank || {};
      for (const ex of section.exchanges || []) {
        const text = ex.text || "";
        const markers = Array.from(text.matchAll(/\((\d+)\)/g), (m) => parseInt(m[1], 10));
        for (const num of markers) {
          const answers = validByBlank[String(num)] || [];
          const answer = answers[0];
          if (!answer) continue;
          // Remove the marker itself before searching for the word so the
          // marker's digits/parens can't accidentally match.
          const withoutMarker = text.replace(`(${num})`, "");
          const hits = [...withoutMarker.matchAll(wordRegex(answer))];
          if (hits.length === 0) continue;
          const row = {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            sectionTitle: section.title,
            blank: num,
            answer,
            text,
            hits: hits.length,
          };
          if (hits.length === 1) {
            unambiguous++;
            row.status = "unambiguous (auto-fixable)";
          } else {
            ambiguous++;
            row.status = `ambiguous (${hits.length} occurrences — needs review)`;
          }
          rows.push(row);
        }
      }
    }
  }

  console.log(`Found ${rows.length} duplicate-answer blanks — ${unambiguous} unambiguous, ${ambiguous} ambiguous.\n`);
  for (const r of rows) {
    console.log(`[${r.status}] "${r.lessonTitle}" → ${r.sectionTitle} → blank(${r.blank})="${r.answer}"`);
    console.log(`    "${r.text}"`);
  }
}

main().catch((e) => die(e.message || String(e)));
