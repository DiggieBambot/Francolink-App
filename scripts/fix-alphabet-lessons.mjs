#!/usr/bin/env node
// scripts/fix-alphabet-lessons.mjs
//
// Restores the alphabet lessons to GROUPED letter cards (A-G, H-N, …) — the
// original visual layout the user prefers. TTS pronunciation is fixed in
// Flashcard.tsx: when a card's term is a comma-separated letter list, the
// client speaks each letter in turn with a short pause, instead of sending
// the whole string to TTS at once.
//
// Usage:
//   node --env-file=.env.local scripts/fix-alphabet-lessons.mjs            # dry-run
//   node --env-file=.env.local scripts/fix-alphabet-lessons.mjs --apply    # write to DB

import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Per-letter pronunciation guides ────────────────────────────────────
const FR = {
  A:"ah", B:"bay", C:"say", D:"day", E:"uh", F:"eff", G:"zhay",
  H:"ahsh", I:"ee", J:"zhee", K:"kah", L:"el", M:"em", N:"en",
  O:"oh", P:"pay", Q:"kü", R:"air", S:"ess", T:"tay", U:"ü",
  V:"vay", W:"doo-bluh-vay", X:"eeks", Y:"ee-grek", Z:"zed",
};

const ES = {
  A:"ah", B:"bay", C:"say", D:"day", E:"ay", F:"eff-ay", G:"hay",
  H:"ah-chay", I:"ee", J:"ho-tah", K:"kah", L:"ell-ay", M:"em-ay",
  N:"en-ay", "Ñ":"en-yay", O:"oh", P:"pay", Q:"koo", R:"er-ay",
  S:"ess-ay", T:"tay", U:"oo", V:"oo-vay", W:"do-blay oo-vay",
  X:"ay-kees", Y:"ee gree-ay-gah", Z:"say-tah",
};

const DE = {
  A:"ah", B:"bay", C:"tsay", D:"day", E:"eh", F:"eff", G:"gay",
  H:"hah", I:"ee", J:"yot", K:"kah", L:"ell", M:"em", N:"en",
  O:"oh", P:"pay", Q:"koo", R:"air", S:"ess", T:"tay", U:"oo",
  V:"fau", W:"vay", X:"eeks", Y:"üpsilon", Z:"tsett",
  "Ä":"ah-umlaut", "Ö":"oh-umlaut", "Ü":"oo-umlaut", "ß":"ess-tset",
};

// ─── Letter groupings per language ──────────────────────────────────────
// French: 4 groups of ~7 covers 26.
const FR_GROUPS = [
  ["A","B","C","D","E","F","G"],
  ["H","I","J","K","L","M","N"],
  ["O","P","Q","R","S","T","U"],
  ["V","W","X","Y","Z"],
];
// Spanish: 4 groups (27 with Ñ).
const ES_GROUPS = [
  ["A","B","C","D","E","F","G"],
  ["H","I","J","K","L","M","N","Ñ"],
  ["O","P","Q","R","S","T","U"],
  ["V","W","X","Y","Z"],
];
// German: 5 groups (30 with Ä Ö Ü ß).
const DE_GROUPS = [
  ["A","B","C","D","E","F","G"],
  ["H","I","J","K","L","M","N"],
  ["O","P","Q","R","S","T","U"],
  ["V","W","X","Y","Z"],
  ["Ä","Ö","Ü","ß"],
];

// One memorable example word per language for the first letter of each group.
const FR_EXAMPLE = { A:"Amour", H:"Hôtel", O:"Orange", V:"Voyage" };
const ES_EXAMPLE = { A:"Amor", H:"Hola", O:"Oso", V:"Verde" };
const DE_EXAMPLE = { A:"Apfel", H:"Haus", O:"Onkel", V:"Vater", "Ä":"Äpfel" };

function buildVocabItem(letters, sounds, exampleWord, langName, exampleFormat, exampleTranslation) {
  const term = letters.join(", ");
  const pron = letters.map((l) => sounds[l]).join(", ");
  const first = letters[0];
  return {
    term,
    translation: `Letters ${letters[0]}–${letters[letters.length - 1]}`,
    definition: `The letters ${term} of the ${langName} alphabet.`,
    pronunciation: pron,
    partOfSpeech: "letter",
    exampleSentence: {
      original: exampleFormat(first, exampleWord),
      translation: exampleTranslation(first, exampleWord),
    },
    tip: `Tap the speaker to hear each letter pronounced in turn.`,
  };
}

function buildContent({ langName, intro, groups, sounds, exampleWords, exampleFormat, exampleTranslation, dialogueSpeakers, dialogueLines, culture }) {
  return {
    introduction: {
      text: intro,
      culturalNote: culture.note,
    },
    vocabulary: groups.map((letters) =>
      buildVocabItem(letters, sounds, exampleWords[letters[0]] || "—", langName, exampleFormat, exampleTranslation)
    ),
    grammar: [],
    dialogue: {
      title: "Spelling Your Name",
      context: "Two people meet and spell their names letter by letter.",
      speakers: dialogueSpeakers,
      lines: dialogueLines,
    },
    culture: {
      title: culture.title,
      text: culture.text,
      funFact: culture.funFact,
    },
    summary: {
      keyPoints: [
        `Every letter of the ${langName} alphabet sounds different from its English name.`,
        "Tap any card to hear its letters pronounced one by one.",
        "Use the example word to anchor the sound (e.g. 'A comme Amour').",
        "Practise spelling your own name and town daily.",
      ],
      nextSteps: "Once the letter sounds feel familiar, move on to greetings and common words.",
    },
  };
}

// ─── French content ─────────────────────────────────────────────────────
const FRENCH_CONTENT = buildContent({
  langName: "French",
  intro:
    "Listen to every letter of the French alphabet. Tap each card and you'll hear the letters pronounced one by one, with a clear pause between each.",
  groups: FR_GROUPS,
  sounds: FR,
  exampleWords: FR_EXAMPLE,
  exampleFormat: (l, w) => `${l} comme ${w}.`,
  exampleTranslation: (l, w) => `${l} as in ${w}.`,
  dialogueSpeakers: ["Sophie", "Marc"],
  dialogueLines: [
    { speaker: 0, text: "Bonjour, comment t'appelles-tu ?", translation: "Hello, what's your name?" },
    { speaker: 1, text: "Je m'appelle Marc. M-A-R-C.", translation: "I'm Marc. M-A-R-C." },
    { speaker: 0, text: "M comme Maison, A comme Amour, R comme Restaurant, C comme Café ?", translation: "M as in House, A as in Love, R as in Restaurant, C as in Coffee?" },
    { speaker: 1, text: "Exactement ! Et toi ?", translation: "Exactly! And you?" },
    { speaker: 0, text: "Sophie. S-O-P-H-I-E.", translation: "Sophie. S-O-P-H-I-E." },
    { speaker: 1, text: "Sophie, c'est un joli prénom.", translation: "Sophie, that's a nice name." },
    { speaker: 0, text: "Merci ! Sais-tu épeler ta ville ?", translation: "Thanks! Can you spell your city?" },
    { speaker: 1, text: "Oui, j'habite à Lyon. L-Y-O-N.", translation: "Yes, I live in Lyon. L-Y-O-N." },
  ],
  culture: {
    note: "On the phone, French speakers say 'X comme [word]' to spell things out. You'll hear it everywhere.",
    title: "Spelling Out Loud in French",
    text: "From customer support to airline check-in, the 'X comme [word]' formula is the everyday way to spell names. The letter W is rare in native French words and is called 'double vé'.",
    funFact: "France has its own official radio alphabet — Alpha, Bravo, Charlie — used by the military and emergency services.",
  },
});

// ─── Spanish content ────────────────────────────────────────────────────
const SPANISH_CONTENT = buildContent({
  langName: "Spanish",
  intro:
    "Listen to every letter of the Spanish alphabet, including Ñ. Tap each card and you'll hear the letters pronounced one by one.",
  groups: ES_GROUPS,
  sounds: ES,
  exampleWords: ES_EXAMPLE,
  exampleFormat: (l, w) => `${l} de ${w}.`,
  exampleTranslation: (l, w) => `${l} as in ${w}.`,
  dialogueSpeakers: ["María", "Juan"],
  dialogueLines: [
    { speaker: 0, text: "Hola, ¿cómo te llamas?", translation: "Hello, what's your name?" },
    { speaker: 1, text: "Me llamo Juan. J-U-A-N.", translation: "I'm Juan. J-U-A-N." },
    { speaker: 0, text: "J de Jueves, U de Uno, A de Amor, N de Noche, ¿verdad?", translation: "J as in Thursday, U as in One, A as in Love, N as in Night, right?" },
    { speaker: 1, text: "¡Exacto! ¿Y tú?", translation: "Exactly! And you?" },
    { speaker: 0, text: "Soy María. M-A-R-Í-A.", translation: "I'm María. M-A-R-Í-A." },
    { speaker: 1, text: "Con tilde en la I, ¿verdad?", translation: "With an accent on the I, right?" },
    { speaker: 0, text: "Sí. ¿De dónde eres?", translation: "Yes. Where are you from?" },
    { speaker: 1, text: "De Sevilla. S-E-V-I-L-L-A.", translation: "From Seville. S-E-V-I-L-L-A." },
  ],
  culture: {
    note: "Spanish has 27 letters — the 26 you know from English, plus Ñ.",
    title: "The Ñ — a Symbol of Spanish",
    text: "Ñ is iconic to Spanish (and a handful of other languages). Historically the sound was written as 'nn', and the squiggle above (the tilde) is a stylised second n.",
    funFact: "The Spanish word año means 'year', but ano (without the tilde) means 'anus'. The tilde really matters.",
  },
});

// ─── German content ─────────────────────────────────────────────────────
const GERMAN_CONTENT = buildContent({
  langName: "German",
  intro:
    "Listen to every letter of the German alphabet, plus Ä, Ö, Ü and ß. Tap each card and you'll hear the letters pronounced one by one.",
  groups: DE_GROUPS,
  sounds: DE,
  exampleWords: DE_EXAMPLE,
  exampleFormat: (l, w) => `${l} wie ${w}.`,
  exampleTranslation: (l, w) => `${l} as in ${w}.`,
  dialogueSpeakers: ["Anna", "Lukas"],
  dialogueLines: [
    { speaker: 0, text: "Hallo, wie heißt du?", translation: "Hello, what's your name?" },
    { speaker: 1, text: "Ich heiße Lukas. L-U-K-A-S.", translation: "I'm Lukas. L-U-K-A-S." },
    { speaker: 0, text: "L wie Liebe, U wie Uhr, K wie Kaffee, A wie Apfel, S wie Sonne?", translation: "L as in Love, U as in Clock, K as in Coffee, A as in Apple, S as in Sun?" },
    { speaker: 1, text: "Genau! Und du?", translation: "Exactly! And you?" },
    { speaker: 0, text: "Anna. A-N-N-A.", translation: "Anna. A-N-N-A." },
    { speaker: 1, text: "Wo wohnst du?", translation: "Where do you live?" },
    { speaker: 0, text: "In München. M-Ü-N-C-H-E-N. Mit Umlaut auf dem U.", translation: "In Munich. M-Ü-N-C-H-E-N. With an umlaut on the U." },
    { speaker: 1, text: "Schön! Ich komme aus Köln. K-Ö-L-N.", translation: "Nice! I'm from Cologne. K-Ö-L-N." },
  ],
  culture: {
    note: "German uses four extra characters beyond the 26: Ä, Ö, Ü and ß.",
    title: "Ä, Ö, Ü, ß — Beyond the 26 Letters",
    text: "The umlaut (two dots) on a vowel changes its sound completely. The ß (Eszett) represents a sharp S. Online, these can be spelled out as 'ae', 'oe', 'ue', 'ss' when needed.",
    funFact: "Switzerland abolished the ß in official spelling decades ago, but Germany and Austria still use it.",
  },
});

// ─── Targets ────────────────────────────────────────────────────────────
const TARGETS = [
  { slug: "the-alphabet",     title: "The Alphabet",                  content: FRENCH_CONTENT },
  { slug: "es-a1-alphabet",   title: "The Spanish Alphabet & Sounds", content: SPANISH_CONTENT },
  { slug: "de-a1-alphabet",   title: "The German Alphabet & Umlauts", content: GERMAN_CONTENT },
];

async function main() {
  console.log(`\n🔤 Alphabet lesson fix — ${APPLY ? "APPLY" : "DRY RUN"} (grouped cards)\n`);

  for (const t of TARGETS) {
    const { data: lesson } = await s.from("lessons").select("id, slug, title").eq("slug", t.slug).maybeSingle();
    if (!lesson) {
      console.log(`  ⚠️  ${t.slug} not found in DB — skipping`);
      continue;
    }
    console.log(`  ${t.slug} (${lesson.title})`);
    console.log(`    → ${t.content.vocabulary.length} grouped cards`);
    t.content.vocabulary.forEach((v) => console.log(`       • ${v.term}`));

    if (!APPLY) continue;
    const { error } = await s
      .from("lessons")
      .update({ title: t.title, content: t.content })
      .eq("id", lesson.id);
    if (error) console.error(`    ❌ ${error.message}`);
    else console.log(`    ✅ patched`);
  }

  console.log(APPLY ? "\nDone.\n" : "\n(dry run — pass --apply to write)\n");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
