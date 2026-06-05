// Lesson doctor: detect gaps in a lesson and fill them via OpenAI, in the exact
// schema each section uses. Dry-run by default.
//
//   node scripts/lesson-doctor.mjs <slug|--all> [--levels B1,B2,C1,C2]
//        [--fix reading,vocab,speaking,practice] [--apply] [--limit N]
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LEVEL_SPEC = {
  A1: { words: 130, paras: 4 }, A2: { words: 170, paras: 4 },
  B1: { words: 240, paras: 5 }, B2: { words: 310, paras: 5 },
  C1: { words: 390, paras: 6 }, C2: { words: 460, paras: 6 },
};
const VOCAB = ["warmup_vocabulary", "vocabulary_with_examples"];
const PRACTICE = ["fill_in_blank_dialogue", "fill_in_blank_dialogue_extended", "word_order", "matching_qa", "image_question_prompts"];
const SPEAK = ["discussion", "free_response", "conversation", "debate", "role_play", "presentation"];

async function ai(messages) {
  const r = await openai.chat.completions.create({ model: "gpt-4o-mini", response_format: { type: "json_object" }, temperature: 0.7, messages });
  return JSON.parse(r.choices[0].message.content);
}

function vocabTerms(secs) {
  const t = [];
  for (const s of secs) if (VOCAB.includes(s.kind)) for (const it of s.items || []) if (it.term) t.push(it.term);
  return t;
}
function lastVocabIdx(secs) {
  let idx = 0;
  secs.forEach((s, i) => { if (VOCAB.includes(s.kind)) idx = i; });
  return idx;
}

// ---- Fixers: each returns a NEW sections array (or null if nothing to do) ----

async function fixReading(lesson, content, secs) {
  if (secs.some((s) => s.kind === "reading_comprehension")) return null;
  const spec = LEVEL_SPEC[lesson.level] || LEVEL_SPEC.B1;
  const vocab = vocabTerms(secs).slice(0, 14);
  const vline = vocab.length ? `\n- Weave in as many of these lesson words as you can, wrapping EACH in **double asterisks**: ${vocab.join(", ")}.` : "";
  const p = await ai([
    { role: "system", content: "You are a French curriculum writer. Output ONLY valid JSON. Be factually accurate." },
    { role: "user", content: `Write a READING-COMPREHENSION passage in FRENCH on the topic of this lesson: "${lesson.title}". For a ${lesson.level} (CEFR) learner.
- About ${spec.words} words across ${spec.paras} well-developed, genuinely interesting paragraphs (separated by a blank line). Match the ${lesson.level} level.${vline}
- Then 5 comprehension questions in French whose answers are in the passage, each with a short answer.
Return JSON: { "title": "...", "passage": "...(\\n\\n between paragraphs)...", "passage_translation": "...", "questions": [{"question":"...","answer":"..."}] }` },
  ]);
  const section = {
    kind: "reading_comprehension", title: p.title, number: 0,
    passage: p.passage, passage_translation: p.passage_translation,
    questions: Array.isArray(p.questions) ? p.questions : [],
    image_url: content.hero_image_url || undefined,
    image_hint: undefined,
    student_instruction: "Lisez le texte à voix haute et répétez chaque paragraphe après votre tuteur. Les mots de vocabulaire sont en gras. Ensuite, répondez aux questions de compréhension ci-dessous.",
    tutor_instruction: "Read the passage with the student paragraph by paragraph — model pronunciation and have them repeat. Explain the bold vocabulary, then ask the comprehension questions and confirm answers.",
    source: "lesson-doctor",
  };
  const at = lastVocabIdx(secs);
  return [...secs.slice(0, at + 1), section, ...secs.slice(at + 1)];
}

async function fixVocab(lesson, content, secs) {
  const idx = secs.findIndex((s) => s.kind === "warmup_vocabulary" && (s.items || []).length < 4);
  if (idx < 0) return null;
  const have = (secs[idx].items || []).map((i) => i.term);
  const need = Math.max(0, 6 - have.length);
  if (need === 0) return null;
  const p = await ai([
    { role: "system", content: "You write French vocabulary items for learners. Output ONLY valid JSON." },
    { role: "user", content: `Give ${need} useful FRENCH vocabulary items for a ${lesson.level} lesson titled "${lesson.title}". Avoid: ${have.join(", ") || "(none)"}.
Each item: { "term": "<French>", "translation": "<English>", "part_of_speech": "noun|verb|adjective|...", "pronunciation": "<IPA>", "gender": "m|f|-", "example": "<French sentence>", "example_translation": "<English>" }.
Return JSON: { "items": [ ... ] }` },
  ]);
  const items = (p.items || []).map((it) => ({ ...it, gender: it.gender === "-" ? undefined : it.gender }));
  const next = secs.slice();
  next[idx] = { ...next[idx], items: [...(next[idx].items || []), ...items] };
  return next;
}

async function fixSpeaking(lesson, content, secs) {
  if (secs.some((s) => SPEAK.includes(s.kind))) return null;
  const p = await ai([
    { role: "system", content: "You write French discussion questions for learners. Output ONLY valid JSON." },
    { role: "user", content: `Write 5 open discussion questions in FRENCH about the topic "${lesson.title}" for a ${lesson.level} learner, each with an English translation.
Return JSON: { "items": [ { "question": "<French>", "question_translation": "<English>", "answer": "", "answer_translation": "" } ] }` },
  ]);
  const section = {
    kind: "discussion", title: "Discussion", number: 0,
    items: Array.isArray(p.items) ? p.items : [],
    student_instruction: "Discutez de ces questions avec votre tuteur. Donnez des réponses complètes.",
    tutor_instruction: "Encourage full answers; correct gently and expand vocabulary.",
    source: "lesson-doctor",
  };
  return [...secs, section];
}

async function fixPractice(lesson, content, secs) {
  if (secs.some((s) => PRACTICE.includes(s.kind))) return null;
  const vocab = vocabTerms(secs).slice(0, 6);
  if (vocab.length < 3) return null;
  const p = await ai([
    { role: "system", content: "You write French fill-in-the-blank practice. Output ONLY valid JSON." },
    { role: "user", content: `Using these French words: ${vocab.join(", ")}.
Write 5 French sentences for a ${lesson.level} learner, each MISSING exactly one of the words (replace it with ________).
Return JSON: { "exchanges": [ { "speaker": "<sentence with ________>", "text": "<the missing word>", "translation": "<English of the sentence>", "speaker_role": "student", "blank": true } ], "answer_pool": ["<the 5 words, shuffled>"] }` },
  ]);
  const section = {
    kind: "fill_in_blank_dialogue", title: "Complétez les phrases", number: 0,
    exchanges: Array.isArray(p.exchanges) ? p.exchanges : [],
    answer_pool: Array.isArray(p.answer_pool) ? p.answer_pool : [],
    student_instruction: "Glissez le bon mot dans chaque espace (ou touchez-le).",
    tutor_instruction: "Have the student justify each choice; review pronunciation.",
    source: "lesson-doctor",
  };
  const at = lastVocabIdx(secs);
  return [...secs.slice(0, at + 1), section, ...secs.slice(at + 1)];
}

const FIXERS = { reading: fixReading, vocab: fixVocab, speaking: fixSpeaking, practice: fixPractice };

(async () => {
  const arg = process.argv[2];
  const apply = process.argv.includes("--apply");
  const fixArg = (process.argv.find((a) => a.startsWith("--fix"))?.split("=")[1]) ||
    (process.argv.includes("--fix") ? process.argv[process.argv.indexOf("--fix") + 1] : "reading,vocab,speaking,practice");
  const fixes = fixArg.split(",").map((s) => s.trim()).filter((f) => FIXERS[f]);
  const levelsArg = process.argv.includes("--levels") ? process.argv[process.argv.indexOf("--levels") + 1] : "";
  const levels = levelsArg ? levelsArg.split(",").map((s) => s.trim().toUpperCase()) : null;
  const limitArg = process.argv.includes("--limit") ? parseInt(process.argv[process.argv.indexOf("--limit") + 1], 10) : Infinity;

  let q = supa.from("tutor_lessons").select("id,slug,title,level,content").eq("status", "published");
  if (arg && arg !== "--all") q = q.eq("slug", arg);
  const { data: lessons } = await q;
  let targets = lessons || [];
  if (levels) targets = targets.filter((l) => levels.includes((l.level || "").toUpperCase()));
  targets = targets.slice(0, limitArg);

  console.log(`Doctor: ${targets.length} lesson(s) | fixes: ${fixes.join(",")} | ${apply ? "APPLY" : "DRY RUN"}\n`);
  let changed = 0;
  for (const lesson of targets) {
    const content = lesson.content || {};
    let secs = content.sections || [];
    const applied = [];
    for (const f of fixes) {
      try {
        const next = await FIXERS[f](lesson, content, secs);
        if (next) { secs = next; applied.push(f); }
      } catch (e) { console.log(`  ! ${lesson.slug} ${f}: ${e.message}`); }
    }
    if (applied.length === 0) continue;
    changed++;
    secs = secs.map((s, i) => ({ ...s, number: i + 1 }));
    console.log(`${apply ? "✏️" : "•"} ${lesson.level} ${lesson.slug} → +[${applied.join(", ")}] (${secs.length} sections)`);
    if (apply) {
      const { error } = await supa.from("tutor_lessons").update({ content: { ...content, sections: secs } }).eq("id", lesson.id);
      if (error) console.log("   DB error:", error.message);
    }
  }
  console.log(`\n${apply ? "Applied to" : "Would change"} ${changed} lesson(s).`);
})().catch((e) => { console.error("💥", e.message); process.exit(1); });
