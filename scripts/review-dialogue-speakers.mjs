// scripts/review-dialogue-speakers.mjs
//
// Checks that every self-study dialogue line is attributed to the right
// speaker, and fixes the attribution where it has drifted.
//
// The course generators asked the model for speaker *indices* (0/1), and it
// routinely got them wrong while the text itself was fine — es-a1-introductions
// had Carlos say "Me llamo Sofia" and Sofia answer "Mucho gusto, Sofia". A
// regex catches the name cases only; a customer reading the waiter's line needs
// something that follows the conversation, so each dialogue goes to a model.
//
// Only the `speaker` field is ever changed. Text and translations are left
// alone, which also keeps the TTS cache valid (it is keyed by text).
//
//   node --env-file=.env.local scripts/review-dialogue-speakers.mjs             # report only
//   node --env-file=.env.local scripts/review-dialogue-speakers.mjs --lang=es
//   node --env-file=.env.local scripts/review-dialogue-speakers.mjs --apply     # write high-confidence fixes
//   node --env-file=.env.local scripts/review-dialogue-speakers.mjs --slugs=a,b # only these lessons
//
// Writes scripts/output/dialogue-review.json with every verdict, including
// text-level problems the model noticed, which are reported but never auto-fixed.

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import fs from "node:fs";

const argv = process.argv.slice(2);
const flag = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const APPLY = argv.includes("--apply");
const LANG = flag("lang");
const MODEL = flag("model") ?? "gpt-4o";
const LIMIT = Number(flag("limit") ?? Infinity);
const SLUGS = flag("slugs")?.split(",");
// A new OpenAI org starts at 30k tokens/min for gpt-4o; each review is ~600.
const CONCURRENCY = 3;
const OUT = flag("out") ?? "scripts/output/dialogue-review.json";

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// The SDK backs off on 429s and honours retry-after, so rate limits slow the
// run down instead of dropping lessons from it.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 10 });

const LANG_NAMES = { fr: "French", es: "Spanish", de: "German", en: "English" };

async function page(table, cols) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await s.from(table).select(cols).order("id").range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

/** Speaker as a name, whether stored as a name or as an index into `speakers`. */
function speakerName(raw, speakers) {
  if (typeof raw === "number" || /^\d+$/.test(String(raw ?? ""))) return speakers[Number(raw)] ?? String(raw);
  return String(raw ?? "");
}

async function review(lesson, lang) {
  const d = lesson.content.dialogue;
  const names = [...new Set([...(d.speakers ?? []), ...d.lines.map((l) => speakerName(l.speaker, d.speakers ?? []))])].filter(Boolean);
  const current = d.lines.map((l) => speakerName(l.speaker, d.speakers ?? []));

  const prompt = `You are checking a ${LANG_NAMES[lang]} learning dialogue for SPEAKER ATTRIBUTION errors only.
The text of each line is correct. The question is whether each line is labelled with the right speaker.

Lesson: ${lesson.title}
Context: ${d.context ?? "(none)"}
Allowed speaker labels (use these exact strings): ${JSON.stringify(names)}

Lines (index | current speaker | text | translation):
${d.lines.map((l, i) => `${i} | ${current[i]} | ${l.text} | ${l.translation ?? ""}`).join("\n")}

Rules:
- A speaker never introduces themselves with another speaker's name, and never addresses themselves by name.
- Questions are normally answered by the other person; follow roles (customer/waiter, doctor/patient, etc.).
- The same speaker CAN say two lines in a row; do not force strict alternation.
- Spelling out one's own name, or signing an email with it, is fine.
- If the current labels are plausible, keep them. Only change what is clearly wrong.

Return JSON: {"speakers": [one label per line, same length as lines], "confidence": "high"|"medium"|"low", "reason": "short explanation of what was wrong, or 'ok'", "text_issue": "describe any problem with the TEXT itself (wrong language, nonsense, translation not matching), or empty string"}`;

  const r = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });
  const out = JSON.parse(r.choices[0].message.content);
  const proposed = Array.isArray(out.speakers) ? out.speakers.map(String) : [];
  const valid = proposed.length === d.lines.length && proposed.every((p) => names.includes(p));
  const changed = valid ? proposed.map((p, i) => (p !== current[i] ? i : -1)).filter((i) => i >= 0) : [];
  return {
    slug: lesson.slug,
    lang,
    lines: d.lines.length,
    valid,
    changed,
    confidence: out.confidence,
    reason: out.reason,
    text_issue: out.text_issue || "",
    current,
    proposed: valid ? proposed : null,
    diff: changed.map((i) => `L${i} "${d.lines[i].text}": ${current[i]} → ${proposed[i]}`),
  };
}

async function main() {
  const [langs, courses, units, lessons] = await Promise.all([
    page("languages", "id,code"),
    page("courses", "id,language_id"),
    page("units", "id,course_id"),
    page("lessons", "id,slug,title,unit_id,content,is_active"),
  ]);
  const langOf = Object.fromEntries(langs.map((l) => [l.id, l.code]));
  const courseLang = Object.fromEntries(courses.map((c) => [c.id, langOf[c.language_id]]));
  const unitLang = Object.fromEntries(units.map((u) => [u.id, courseLang[u.course_id]]));

  const todo = lessons
    .filter((l) => l.is_active !== false && l.content?.dialogue?.lines?.length >= 2)
    .map((l) => ({ lesson: l, lang: unitLang[l.unit_id] }))
    .filter((x) => !LANG || x.lang === LANG)
    .filter((x) => !SLUGS || SLUGS.includes(x.lesson.slug))
    .slice(0, LIMIT);

  console.log(`Reviewing ${todo.length} dialogues with ${MODEL}${APPLY ? " (APPLY high-confidence fixes)" : " (report only)"}\n`);

  const results = [];
  let next = 0;
  async function worker() {
    while (next < todo.length) {
      const { lesson, lang } = todo[next++];
      try {
        const res = await review(lesson, lang);
        results.push(res);
        if (res.changed.length || res.text_issue) {
          console.log(`[${lang}] ${res.slug} (${res.confidence})${res.valid ? "" : " INVALID RESPONSE"}`);
          res.diff.forEach((x) => console.log(`   ${x}`));
          if (res.text_issue) console.log(`   text: ${res.text_issue}`);
        }
        if (APPLY && res.valid && res.changed.length && res.confidence === "high") {
          const content = structuredClone(lesson.content);
          content.dialogue.lines.forEach((l, i) => (l.speaker = res.proposed[i]));
          const { error } = await s.from("lessons").update({ content }).eq("id", lesson.id);
          res.applied = !error;
          console.log(error ? `   ⚠️  update failed: ${error.message}` : "   ✅ applied");
        }
      } catch (e) {
        results.push({ slug: lesson.slug, lang, error: String(e.message ?? e) });
        console.log(`[${lang}] ${lesson.slug} ERROR ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  fs.mkdirSync("scripts/output", { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));

  const flagged = results.filter((r) => r.changed?.length);
  const by = (k) => flagged.filter((r) => r.confidence === k).length;
  console.log(`\n─── Summary ───`);
  console.log(`reviewed ${results.length}, speaker fixes proposed ${flagged.length} (high ${by("high")}, medium ${by("medium")}, low ${by("low")})`);
  console.log(`text issues noted ${results.filter((r) => r.text_issue).length}, errors ${results.filter((r) => r.error).length}`);
  if (APPLY) console.log(`applied ${results.filter((r) => r.applied).length}`);
  console.log(`full report: ${OUT}`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
