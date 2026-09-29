// scripts/review-language-accuracy.mjs
//
// Native-speaker accuracy review of the self-study courses.
//
// The German and Spanish courses were generated and published without a
// language check. de-b2-idioms taught "das Kind beim Schopf packen" (the idiom
// is "die Gelegenheit beim Schopf packen") and used "nicht alle Tassen im
// Schrank haben" backwards — errors no structural audit can see. Each lesson,
// with its exercises, goes to a model acting as an editor, which returns
// concrete errors as exact old → new replacements.
//
//   node --env-file=.env.local scripts/review-language-accuracy.mjs --lang=de           # report only
//   node --env-file=.env.local scripts/review-language-accuracy.mjs --lang=de --apply   # apply the report
//
// --apply does not call the model again: it applies the saved report, and only
// where the stored text still equals `old` exactly, so a stale report or a
// hand edit is never overwritten. Only severity "error" is applied; "minor"
// findings stay in the report for a human.
//
// The model is wrong often enough to matter (it "corrected" a correct "Lieber
// Lukas," to "Sehr geehrter Lukas,"), so read the errors before applying and
// set "rejected": true on any that should not go in.
//
// Report: scripts/output/accuracy-<lang>.json

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import fs from "node:fs";

const argv = process.argv.slice(2);
const flag = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const LANG = flag("lang");
const APPLY = argv.includes("--apply");
const MODEL = flag("model") ?? "gpt-4o";
const LIMIT = Number(flag("limit") ?? Infinity);
const SLUGS = flag("slugs")?.split(",");
const CONCURRENCY = 2; // ~4k tokens per lesson against a 30k tokens/min limit
const OUT = `scripts/output/accuracy-${LANG}.json`;

const LANG_NAMES = { fr: "French", es: "Spanish", de: "German", en: "English" };
if (!LANG_NAMES[LANG]) {
  console.error("--lang=fr|es|de|en is required");
  process.exit(1);
}

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 10 });

async function page(table, cols, filter) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let q = s.from(table).select(cols).order("id").range(from, from + 999);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

/** Follow a dotted path ("dialogue.lines.3.text") into an object. */
function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const parent = keys.reduce((o, k) => (o == null ? undefined : o[k]), obj);
  if (parent == null || !(last in parent)) return false;
  parent[last] = value;
  return true;
}

/** Every string leaf with its path, so the model can cite exact locations. */
function leaves(obj, prefix, out = []) {
  if (typeof obj === "string") {
    if (obj.trim()) out.push(`${prefix} = ${JSON.stringify(obj)}`);
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => leaves(v, `${prefix}.${i}`, out));
  } else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) leaves(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

async function review(lesson, level, exercises) {
  const lines = [
    ...leaves(lesson.content, "lesson"),
    ...exercises.flatMap((e) => [
      ...(e.question ? [`ex:${e.id}.question = ${JSON.stringify(e.question)}`] : []),
      ...(e.explanation ? [`ex:${e.id}.explanation = ${JSON.stringify(e.explanation)}`] : []),
      ...leaves(e.content, `ex:${e.id}.content`),
    ]),
  ];

  const prompt = `You are a native ${LANG_NAMES[LANG]} speaker and experienced language teacher, proofreading a ${level} lesson for English-speaking learners.

Lesson: "${lesson.title}" (${lesson.slug})

Every text field is listed as  path = "value". Pronunciation fields are English-style respellings; ignore them.

${lines.join("\n")}

Find real ERRORS only:
- ${LANG_NAMES[LANG]} that is ungrammatical, misspelled, unidiomatic, or a wrong/invented idiom
- English translations or meanings that are wrong (not merely literal)
- grammar explanations or tables that state something false
- exercises whose marked answer is wrong, or where another option is equally correct
Do NOT report style preferences, regional variants, missing accents in English-style pronunciation, or things that are fine.

For each error give an exact replacement of ONE field. "old" must be the field's full current value, copied exactly; "new" the full corrected value. For exercise fields use the ex:<id>... path as shown. Keep corrections minimal and at the lesson's level. If a fix would require changing several fields together (e.g. an option and correctIndex), list each field separately.

Return JSON: {"issues":[{"path":"...","severity":"error"|"minor","problem":"short English explanation","old":"...","new":"..."}]}  — or {"issues":[]} if the lesson is correct.`;

  const r = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });
  const out = JSON.parse(r.choices[0].message.content);
  return Array.isArray(out.issues) ? out.issues : [];
}

async function load() {
  const [langs, courses, units, lessons] = await Promise.all([
    page("languages", "id,code"),
    page("courses", "id,language_id,level"),
    page("units", "id,course_id"),
    page("lessons", "id,slug,title,unit_id,content,is_active"),
  ]);
  const langId = langs.find((l) => l.code === LANG)?.id;
  const courseLevel = Object.fromEntries(courses.filter((c) => c.language_id === langId).map((c) => [c.id, c.level]));
  const unitLevel = Object.fromEntries(units.filter((u) => courseLevel[u.course_id]).map((u) => [u.id, courseLevel[u.course_id]]));
  return lessons
    .filter((l) => unitLevel[l.unit_id] && l.is_active !== false)
    .filter((l) => !SLUGS || SLUGS.includes(l.slug))
    .map((l) => ({ ...l, level: unitLevel[l.unit_id] }));
}

async function runReview() {
  const lessons = (await load()).slice(0, LIMIT);
  const exercises = await page("exercises", "id,lesson_id,question,explanation,content");
  const exByLesson = {};
  for (const e of exercises) (exByLesson[e.lesson_id] ??= []).push(e);

  console.log(`Reviewing ${lessons.length} ${LANG_NAMES[LANG]} lessons with ${MODEL} (report only)\n`);
  const results = [];
  let next = 0;
  async function worker() {
    while (next < lessons.length) {
      const l = lessons[next++];
      try {
        const issues = await review(l, l.level, exByLesson[l.id] ?? []);
        results.push({ slug: l.slug, lessonId: l.id, level: l.level, issues });
        const errs = issues.filter((i) => i.severity === "error").length;
        console.log(`${l.slug.padEnd(38)} ${errs} errors, ${issues.length - errs} minor`);
      } catch (e) {
        results.push({ slug: l.slug, lessonId: l.id, error: String(e.message ?? e) });
        console.log(`${l.slug.padEnd(38)} ERROR ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  fs.mkdirSync("scripts/output", { recursive: true });
  const prior = SLUGS && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")).filter((r) => !SLUGS.includes(r.slug)) : [];
  fs.writeFileSync(OUT, JSON.stringify([...prior, ...results], null, 1));

  const all = results.flatMap((r) => r.issues ?? []);
  console.log(`\n─── Summary ───`);
  console.log(`lessons ${results.length}, errors ${all.filter((i) => i.severity === "error").length}, minor ${all.filter((i) => i.severity !== "error").length}, failed ${results.filter((r) => r.error).length}`);
  console.log(`report: ${OUT}`);
}

async function runApply() {
  const report = JSON.parse(fs.readFileSync(OUT, "utf8"));
  let applied = 0, stale = 0;
  for (const r of report) {
    const fixes = (r.issues ?? []).filter(
      (i) => i.severity === "error" && !i.rejected && typeof i.old === "string" && typeof i.new === "string" && i.old !== i.new,
    );
    if (!fixes.length) continue;

    const { data: lesson } = await s.from("lessons").select("id,content").eq("id", r.lessonId).single();
    const content = structuredClone(lesson.content);
    const exEdits = {};
    let lessonChanged = false;

    for (const f of fixes) {
      const m = f.path.match(/^ex:([0-9a-f-]{36})\.(.+)$/);
      if (m) {
        const [, id, rest] = m;
        if (!exEdits[id]) {
          const { data } = await s.from("exercises").select("id,question,explanation,content").eq("id", id).single();
          exEdits[id] = { row: data, changed: false };
        }
        const row = exEdits[id].row;
        if (getPath(row, rest) === f.old && setPath(row, rest, f.new)) { exEdits[id].changed = true; applied++; }
        else { stale++; console.log(`stale  ${r.slug} ${f.path}`); }
      } else {
        const path = f.path.replace(/^lesson\./, "");
        if (getPath(content, path) === f.old && setPath(content, path, f.new)) { lessonChanged = true; applied++; }
        else { stale++; console.log(`stale  ${r.slug} ${f.path}`); }
      }
    }

    if (lessonChanged) {
      const { error } = await s.from("lessons").update({ content }).eq("id", r.lessonId);
      if (error) console.log(`FAIL   ${r.slug}: ${error.message}`);
    }
    for (const [id, { row, changed }] of Object.entries(exEdits)) {
      if (!changed) continue;
      const { error } = await s.from("exercises").update({ question: row.question, explanation: row.explanation, content: row.content }).eq("id", id);
      if (error) console.log(`FAIL   ${r.slug} ex ${id}: ${error.message}`);
    }
    console.log(`fixed  ${r.slug} (${fixes.length})`);
  }
  console.log(`\napplied ${applied} fixes, ${stale} skipped as stale`);
}

(APPLY ? runApply() : runReview()).catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
