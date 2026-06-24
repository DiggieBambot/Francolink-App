#!/usr/bin/env node
// scripts/fix-alphabet-lessons.mjs
//
// Rebuilds the French / Spanish / German alphabet lessons as ONE card per
// letter. Each card sends a single spelled-out native letter name to TTS
// (e.g. "Ache" for H, "Double Vé" for W) — so there is nothing to mispace
// and no list-smushing. The displayed term is just the bare letter ("A").
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

// ─── Per-letter data: [letter, phonetic guide for display, native letter
// name for TTS, example word, English meaning of example] ──────────────
const FR_LETTERS = [
  ["A", "ah",          "A",          "Amour",     "love"],
  ["B", "bay",         "Bé",         "Bébé",      "baby"],
  ["C", "say",         "Cé",         "Café",      "coffee"],
  ["D", "day",         "Dé",         "Dîner",     "dinner"],
  ["E", "uh",          "E",          "École",     "school"],
  ["F", "eff",         "Effe",       "Fromage",   "cheese"],
  ["G", "zhay",        "Gé",         "Gâteau",    "cake"],
  ["H", "ahsh",        "Ache",       "Hôtel",     "hotel (silent H)"],
  ["I", "ee",          "I",          "Île",       "island"],
  ["J", "zhee",        "Ji",         "Jardin",    "garden"],
  ["K", "kah",         "Ka",         "Kiwi",      "kiwi"],
  ["L", "el",          "Elle",       "Livre",     "book"],
  ["M", "em",          "Emme",       "Maison",    "house"],
  ["N", "en",          "Enne",       "Nuit",      "night"],
  ["O", "oh",          "O",          "Orange",    "orange"],
  ["P", "pay",         "Pé",         "Pain",      "bread"],
  ["Q", "kü",          "Ku",         "Question",  "question"],
  ["R", "air",         "Erre",       "Restaurant","restaurant (guttural R)"],
  ["S", "ess",         "Esse",       "Soleil",    "sun"],
  ["T", "tay",         "Té",         "Tarte",     "tart"],
  ["U", "ü",           "U",          "Université","university (rounded lips)"],
  ["V", "vay",         "Vé",         "Voyage",    "journey"],
  ["W", "doo-bluh-vay","Double Vé",  "Wifi",      "wifi"],
  ["X", "eeks",        "Ixe",        "Xylophone", "xylophone"],
  ["Y", "ee-grek",     "I grec",     "Yaourt",    "yogurt"],
  ["Z", "zed",         "Zède",       "Zèbre",     "zebra"],
];

const ES_LETTERS = [
  ["A",  "ah",            "a",        "Amor",     "love"],
  ["B",  "bay",           "be",       "Banana",   "banana"],
  ["C",  "say",           "ce",       "Casa",     "house"],
  ["D",  "day",           "de",       "Día",      "day"],
  ["E",  "ay",            "e",        "Escuela",  "school"],
  ["F",  "eff-ay",        "efe",      "Familia",  "family"],
  ["G",  "hay",           "ge",       "Gato",     "cat"],
  ["H",  "ah-chay",       "hache",    "Hola",     "hello (silent H)"],
  ["I",  "ee",            "i",        "Iglesia",  "church"],
  ["J",  "ho-tah",        "jota",     "Jueves",   "Thursday"],
  ["K",  "kah",           "ka",       "Kilo",     "kilo"],
  ["L",  "ell-ay",        "ele",      "Luna",     "moon"],
  ["M",  "em-ay",         "eme",      "Madre",    "mother"],
  ["N",  "en-ay",         "ene",      "Noche",    "night"],
  ["Ñ",  "en-yay",        "eñe",      "Niño",     "child"],
  ["O",  "oh",            "o",        "Oso",      "bear"],
  ["P",  "pay",           "pe",       "Padre",    "father"],
  ["Q",  "koo",           "cu",       "Queso",    "cheese"],
  ["R",  "er-ay",         "erre",     "Rojo",     "red"],
  ["S",  "ess-ay",        "ese",      "Sol",      "sun"],
  ["T",  "tay",           "te",       "Tiempo",   "time/weather"],
  ["U",  "oo",            "u",        "Uno",      "one"],
  ["V",  "oo-vay",        "uve",      "Verde",    "green"],
  ["W",  "do-blay oo-vay","uve doble","Wifi",     "wifi"],
  ["X",  "ay-kees",       "equis",    "Xilófono", "xylophone"],
  ["Y",  "ee gree-ay-gah","ye",       "Yo",       "I"],
  ["Z",  "say-tah",       "zeta",     "Zapato",   "shoe"],
];

const DE_LETTERS = [
  ["A",  "ah",           "A",        "Apfel",    "apple"],
  ["B",  "bay",          "Be",       "Brot",     "bread"],
  ["C",  "tsay",         "Ce",       "Computer", "computer"],
  ["D",  "day",          "De",       "Danke",    "thanks"],
  ["E",  "eh",           "E",        "Eis",      "ice cream"],
  ["F",  "eff",          "Ef",       "Familie",  "family"],
  ["G",  "gay",          "Ge",       "Garten",   "garden"],
  ["H",  "hah",          "Ha",       "Haus",     "house"],
  ["I",  "ee",           "I",        "Insel",    "island"],
  ["J",  "yot",          "Jot",      "Junge",    "boy"],
  ["K",  "kah",          "Ka",       "Kaffee",   "coffee"],
  ["L",  "ell",          "El",       "Liebe",    "love"],
  ["M",  "em",           "Em",       "Mutter",   "mother"],
  ["N",  "en",           "En",       "Nacht",    "night"],
  ["O",  "oh",           "O",        "Onkel",    "uncle"],
  ["P",  "pay",          "Pe",       "Park",     "park"],
  ["Q",  "koo",          "Ku",       "Quelle",   "source"],
  ["R",  "air",          "Er",       "Rot",      "red"],
  ["S",  "ess",          "Es",       "Sonne",    "sun"],
  ["T",  "tay",          "Te",       "Tee",      "tea"],
  ["U",  "oo",           "U",        "Uhr",      "clock"],
  ["V",  "fau",          "Vau",      "Vater",    "father"],
  ["W",  "vay",          "We",       "Wasser",   "water"],
  ["X",  "eeks",         "Ix",       "Xylophon", "xylophone"],
  ["Y",  "üpsilon",      "Ypsilon",  "Yacht",    "yacht"],
  ["Z",  "tsett",        "Zett",     "Zucker",   "sugar"],
  ["Ä",  "ah-umlaut",    "Ä",        "Äpfel",    "apples"],
  ["Ö",  "oh-umlaut",    "Ö",        "Öl",       "oil"],
  ["Ü",  "oo-umlaut",    "Ü",        "Über",     "over/about"],
  ["ß",  "ess-tset",     "Eszett",   "Straße",   "street"],
];

function buildContent({ langName, intro, letters, exampleFormat, exampleTranslation, dialogueSpeakers, dialogueLines, culture }) {
  return {
    introduction: {
      text: intro,
      culturalNote: culture.note,
    },
    vocabulary: letters.map(([letter, pron, name, exampleWord, exampleMeaning]) => ({
      term: letter,
      // ttsText is just the native letter name — a single word the TTS engine
      // already knows. No lists, no run-ons, no pacing problems.
      ttsText: name,
      translation: `the letter ${letter}`,
      definition: `The letter ${letter} of the ${langName} alphabet.`,
      pronunciation: pron,
      partOfSpeech: "letter",
      exampleSentence: {
        original: exampleFormat(letter, exampleWord),
        translation: `${letter} as in ${exampleWord} (${exampleMeaning}).`,
      },
      tip: `Tap the speaker to hear the letter ${letter}.`,
    })),
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
        "Tap any card to hear the letter pronounced.",
        "Use the example word to anchor the sound.",
        "Practise spelling your own name and town daily.",
      ],
      nextSteps: "Once the letter sounds feel familiar, move on to greetings and common words.",
    },
  };
}

// ─── French ─────────────────────────────────────────────────────────────
const FRENCH_CONTENT = buildContent({
  langName: "French",
  intro: "Listen to every letter of the French alphabet, one at a time. Tap a card to hear that letter — and pair it with its example word to anchor the sound.",
  letters: FR_LETTERS,
  exampleFormat: (l, w) => `${l} comme ${w}.`,
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
    text: "From customer support to airline check-in, 'X comme [word]' is the everyday way to spell a name. The letter W is rare in native French words and is called 'double vé'.",
    funFact: "France's own radio alphabet (Alpha, Bravo, Charlie) is used by the military and emergency services, just like NATO's.",
  },
});

// ─── Spanish ────────────────────────────────────────────────────────────
const SPANISH_CONTENT = buildContent({
  langName: "Spanish",
  intro: "Listen to every letter of the Spanish alphabet (including Ñ), one at a time. Tap a card to hear that letter.",
  letters: ES_LETTERS,
  exampleFormat: (l, w) => `${l} de ${w}.`,
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
    text: "Ñ is iconic to Spanish (and a handful of other languages). Historically the sound was written as 'nn', and the squiggle (the tilde) is a stylised second n.",
    funFact: "The Spanish word año means 'year', but ano (without the tilde) means 'anus'. The tilde really matters.",
  },
});

// ─── German ─────────────────────────────────────────────────────────────
const GERMAN_CONTENT = buildContent({
  langName: "German",
  intro: "Listen to every letter of the German alphabet, plus Ä, Ö, Ü and ß. Tap a card to hear that letter.",
  letters: DE_LETTERS,
  exampleFormat: (l, w) => `${l} wie ${w}.`,
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
    text: "The umlaut (two dots) on a vowel changes the sound. The ß (Eszett) represents a sharp S. Online, these can be spelled as 'ae', 'oe', 'ue', 'ss' when needed.",
    funFact: "Switzerland abolished the ß in official spelling decades ago, but Germany and Austria still use it.",
  },
});

// ─── Targets ────────────────────────────────────────────────────────────
const TARGETS = [
  { slug: "the-alphabet",   title: "The Alphabet",                  content: FRENCH_CONTENT },
  { slug: "es-a1-alphabet", title: "The Spanish Alphabet & Sounds", content: SPANISH_CONTENT },
  { slug: "de-a1-alphabet", title: "The German Alphabet & Umlauts", content: GERMAN_CONTENT },
];

async function main() {
  console.log(`\n🔤 Alphabet lesson fix — ${APPLY ? "APPLY" : "DRY RUN"} (per-letter cards)\n`);

  for (const t of TARGETS) {
    const { data: lesson } = await s.from("lessons").select("id, slug, title").eq("slug", t.slug).maybeSingle();
    if (!lesson) {
      console.log(`  ⚠️  ${t.slug} not found in DB — skipping`);
      continue;
    }
    console.log(`  ${t.slug} (${lesson.title})`);
    console.log(`    → ${t.content.vocabulary.length} per-letter cards`);
    console.log(`    sample ttsText: term="${t.content.vocabulary[0].term}" → "${t.content.vocabulary[0].ttsText}"`);
    console.log(`                    term="${t.content.vocabulary[7].term}" → "${t.content.vocabulary[7].ttsText}"`);

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
