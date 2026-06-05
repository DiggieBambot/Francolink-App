// Enrich a country lesson: monument hero (Pexels) + flag tag + an AI-written
// French history/culture reading passage (with English translation).
//
//   node scripts/enrich-country-lesson.mjs <slug> [--apply]
//
// Without --apply it does a DRY RUN (prints what it would do, no DB write).
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const BUCKET = "lesson-images";
const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Country config: flag, a monument-focused Pexels query, and an ACCURATE caption.
const COUNTRIES = {
  angleterre: { name: "Angleterre", en: "England", code: "GB", flag: "🇬🇧", query: "Big Ben London Westminster", topic: "England (its history, culture and landmarks)", caption: "Big Ben et le palais de Westminster, à Londres." },
  australie: { name: "Australie", en: "Australia", code: "AU", flag: "🇦🇺", query: "Sydney Opera House Australia", topic: "Australia (its history, culture and landmarks)", caption: "L'Opéra de Sydney, en Australie." },
  irlande: { name: "Irlande", en: "Ireland", code: "IE", flag: "🇮🇪", query: "Cliffs of Moher Ireland", topic: "Ireland (its history, culture and landmarks)", caption: "Les falaises de Moher, en Irlande." },
  canada: { name: "Canada", en: "Canada", code: "CA", flag: "🇨🇦", query: "Banff Canada mountains lake", topic: "Canada (its history, culture and landmarks)", caption: "Le parc national de Banff, au Canada." },
  "nouvelle-zelande": { name: "Nouvelle-Zélande", en: "New Zealand", code: "NZ", flag: "🇳🇿", query: "New Zealand mountains landscape", topic: "New Zealand (its history, culture and landmarks)", caption: "Les paysages de Nouvelle-Zélande." },
  "rio-de-janeiro-une-destination-incontournable": { name: "Brésil", en: "Brazil", code: "BR", flag: "🇧🇷", query: "Christ the Redeemer Rio de Janeiro", topic: "Rio de Janeiro and Brazil (history, culture and landmarks)", caption: "Le Christ Rédempteur, à Rio de Janeiro." },
  "top-5-des-endroits-a-visiter-en-australie": { name: "Australie", en: "Australia", code: "AU", flag: "🇦🇺", query: "Sydney Opera House Australia", topic: "the top places to visit in Australia (and its culture)", caption: "L'Opéra de Sydney, en Australie." },
  "top-5-des-endroits-a-visiter-en-nouvelle-zelande": { name: "Nouvelle-Zélande", en: "New Zealand", code: "NZ", flag: "🇳🇿", query: "New Zealand mountains landscape", topic: "the top places to visit in New Zealand (and its culture)", caption: "Les paysages de Nouvelle-Zélande." },
  "5-attractions-touristiques-incroyables-en-irlande": { name: "Irlande", en: "Ireland", code: "IE", flag: "🇮🇪", query: "Cliffs of Moher Ireland", topic: "amazing tourist attractions in Ireland (and its culture)", caption: "Les falaises de Moher, en Irlande." },
};

// Passage length + complexity scaled to the CEFR level of the lesson.
const LEVEL_SPEC = {
  A1: { words: 130, paras: 4, style: "very simple vocabulary, short sentences, mostly present tense" },
  A2: { words: 170, paras: 4, style: "simple everyday vocabulary, present and passé composé" },
  B1: { words: 240, paras: 5, style: "varied vocabulary and some complex sentences" },
  B2: { words: 310, paras: 5, style: "rich vocabulary, varied tenses and connectors" },
  C1: { words: 390, paras: 6, style: "sophisticated, nuanced, idiomatic vocabulary" },
  C2: { words: 460, paras: 6, style: "highly sophisticated, literary, complex argumentation" },
};

async function pexelsHero(query) {
  const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5`, {
    headers: { Authorization: process.env.PEXELS_API_KEY },
  });
  if (!res.ok) throw new Error("pexels " + res.status);
  const json = await res.json();
  const p = json.photos?.[0];
  return p ? { url: p.src.large2x || p.src.landscape || p.src.large, credit: p.photographer } : null;
}

async function uploadHero(srcUrl, slug) {
  const img = await fetch(srcUrl);
  const buf = Buffer.from(await img.arrayBuffer());
  const path = `country-heroes/${slug}.jpg`;
  const { error } = await supa.storage.from(BUCKET).upload(path, buf, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error("upload " + error.message);
  return supa.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function writePassage(country, level, vocab) {
  const spec = LEVEL_SPEC[level] || LEVEL_SPEC.B1;
  const vocabLine = vocab.length
    ? `\n- Naturally weave in as many of THESE lesson vocabulary words as you can, and wrap EACH one in **double asterisks** the first time it appears: ${vocab.join(", ")}.`
    : "";
  const sys = "You are a French curriculum writer. You write engaging, factual reading passages in French for language learners, and accurate comprehension questions. Output ONLY valid JSON. Be factually accurate about history, geography and current facts.";
  const user = `Write a READING-COMPREHENSION passage in FRENCH about ${country.topic}, for a ${level} (CEFR) French learner.

Requirements:
- The passage must clearly match the ${level} level: ${spec.style}.
- Length: about ${spec.words} words across ${spec.paras} well-developed paragraphs (separated by a blank line). Do NOT write something short — make it a substantial, genuinely interesting read covering history, culture, famous landmarks, and daily life.
- Be factually accurate (correct landmarks, correct current facts — e.g. the UK's current monarch is King Charles III).${vocabLine}
- Then write 5 reading-comprehension questions in French whose answers are found in the passage, each with a short correct answer.

Return JSON:
{
 "title": "<short French title>",
 "passage": "<the ${spec.paras}-paragraph French text, paragraphs separated by \\n\\n>",
 "passage_translation": "<faithful English translation of the whole passage>",
 "questions": [ { "question": "<French question>", "answer": "<short French answer>" }, ... 5 total ]
}`;
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
    temperature: 0.7,
  });
  return JSON.parse(resp.choices[0].message.content);
}

(async () => {
  const slug = process.argv[2];
  const apply = process.argv.includes("--apply");
  const cfg = COUNTRIES[slug];
  if (!cfg) {
    console.error("Unknown country slug. Known:", Object.keys(COUNTRIES).join(", "));
    process.exit(1);
  }

  const { data: lesson } = await supa.from("tutor_lessons").select("id,slug,title,level,content").eq("slug", slug).maybeSingle();
  if (!lesson) { console.error("Lesson not found:", slug); process.exit(1); }
  const content = lesson.content || {};
  const secs = content.sections || [];
  console.log(`\n=== ${lesson.title} (${lesson.level}) — ${secs.length} sections ===`);

  // Collect lesson vocabulary so the passage can reuse + bold it.
  const vocab = [];
  for (const sec of secs) {
    if (sec.kind === "warmup_vocabulary" || sec.kind === "vocabulary_with_examples") {
      for (const it of sec.items || []) if (it.term) vocab.push(it.term);
    }
  }

  // 1. Passage
  console.log("Writing passage via OpenAI…");
  const p = await writePassage(cfg, lesson.level, vocab.slice(0, 14));
  const wordCount = p.passage.split(/\s+/).filter(Boolean).length;
  console.log("  title:", p.title);
  console.log(`  length: ${wordCount} words, ${p.passage.split("\n\n").length} paragraphs, ${p.questions?.length || 0} questions`);
  console.log("  passage[0]:", p.passage.split("\n\n")[0].slice(0, 110) + "…");

  // 2. Monument hero
  console.log("Fetching monument photo via Pexels:", cfg.query);
  const hero = await pexelsHero(cfg.query);
  console.log("  photo:", hero ? hero.url.slice(0, 70) + "…" : "(none)");

  if (!apply) {
    console.log("\nDRY RUN — re-run with --apply to write changes.");
    return;
  }

  const heroUrl = hero ? await uploadHero(hero.url, slug) : content.hero_image_url;

  const readingSection = {
    kind: "reading_comprehension",
    title: p.title,
    number: 0,
    passage: p.passage,
    passage_translation: p.passage_translation,
    questions: Array.isArray(p.questions) ? p.questions : [],
    image_url: heroUrl,
    image_hint: cfg.caption,
    student_instruction:
      "Lisez le texte à voix haute et répétez chaque paragraphe après votre tuteur. Les mots de vocabulaire sont en gras. Ensuite, répondez aux questions de compréhension ci-dessous.",
    tutor_instruction:
      "Read the passage with the student paragraph by paragraph — model pronunciation and have them repeat. Explain the bold vocabulary in context, then ask the comprehension questions below and confirm the answers together.",
    source: "country-enrichment",
  };

  // Replace a previously-enriched passage if present; otherwise insert after the
  // first section. Native (hand-written) reading sections are left untouched.
  const isOurs = (s) =>
    s.kind === "reading_comprehension" &&
    (s.source === "country-enrichment" || s.student_instruction === "Lisez le texte, puis discutez-en avec votre tuteur.");
  const cleaned = secs.filter((s) => !isOurs(s));
  // Insert AFTER the last vocabulary section (so students learn the words first).
  let insertAfter = 0;
  cleaned.forEach((s, i) => {
    if (s.kind === "warmup_vocabulary" || s.kind === "vocabulary_with_examples") insertAfter = i;
  });
  let newSecs = [...cleaned.slice(0, insertAfter + 1), readingSection, ...cleaned.slice(insertAfter + 1)];
  newSecs = newSecs.map((s, i) => ({ ...s, number: i + 1 }));

  const newContent = {
    ...content,
    hero_image_url: heroUrl,
    country: { name: cfg.name, name_en: cfg.en, code: cfg.code, flag: cfg.flag },
    sections: newSecs,
  };

  const { error } = await supa.from("tutor_lessons").update({ content: newContent }).eq("id", lesson.id);
  if (error) { console.error("DB update failed:", error.message); process.exit(1); }
  console.log(`\n✅ Applied. Hero + flag set, passage (${wordCount} words, ${readingSection.questions.length} questions). Sections: ${newSecs.length}`);
})().catch((e) => { console.error("💥", e.message); process.exit(1); });
