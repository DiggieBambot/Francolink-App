#!/usr/bin/env node
// scripts/fix-alphabet-lessons.mjs
//
// Replaces the alphabet lessons' content with a clean per-letter structure
// so that clicking the speaker on each card plays exactly ONE letter cleanly.
// Fixes:
//   - French "the-alphabet" had cards like "A, B, C, D, E, F, G" — TTS read
//     them as a run-on string with wrong pacing.
//   - Spanish and German "alphabet" lessons didn't teach the alphabet at all;
//     they shipped random vocab words instead.
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

// ─── French ─────────────────────────────────────────────────────────────
const FR_LETTERS = [
  ["A", "ah", "Amour", "love"],
  ["B", "bay", "Bébé", "baby"],
  ["C", "say", "Café", "coffee"],
  ["D", "day", "Dîner", "dinner"],
  ["E", "uh", "École", "school"],
  ["F", "eff", "Fromage", "cheese"],
  ["G", "zhay", "Gâteau", "cake"],
  ["H", "ahsh", "Hôtel", "hotel (the H is silent)"],
  ["I", "ee", "Île", "island"],
  ["J", "zhee", "Jardin", "garden"],
  ["K", "kah", "Kiwi", "kiwi"],
  ["L", "ell", "Livre", "book"],
  ["M", "em", "Maison", "house"],
  ["N", "en", "Nuit", "night"],
  ["O", "oh", "Orange", "orange"],
  ["P", "pay", "Pain", "bread"],
  ["Q", "kew", "Question", "question"],
  ["R", "air", "Restaurant", "restaurant (the R is guttural)"],
  ["S", "ess", "Soleil", "sun"],
  ["T", "tay", "Tarte", "tart"],
  ["U", "oo", "Université", "university (rounded lips)"],
  ["V", "vay", "Voyage", "journey"],
  ["W", "doo-bluh-vay", "Wifi", "wifi (rare in French)"],
  ["X", "eeks", "Xylophone", "xylophone"],
  ["Y", "ee-grek", "Yaourt", "yogurt"],
  ["Z", "zed", "Zèbre", "zebra"],
];

// ─── Spanish ────────────────────────────────────────────────────────────
const ES_LETTERS = [
  ["A", "ah", "Amor", "love"],
  ["B", "bay", "Banana", "banana"],
  ["C", "say (the-ay in Spain)", "Casa", "house"],
  ["D", "day", "Día", "day"],
  ["E", "ay", "Escuela", "school"],
  ["F", "eff-ay", "Familia", "family"],
  ["G", "hay (throaty)", "Gato", "cat"],
  ["H", "ah-chay", "Hola", "hello (the H is silent)"],
  ["I", "ee", "Iglesia", "church"],
  ["J", "ho-tah", "Jueves", "Thursday (J is like English H)"],
  ["K", "kah", "Kilo", "kilo (rare in Spanish)"],
  ["L", "ell-ay", "Luna", "moon"],
  ["M", "em-ay", "Madre", "mother"],
  ["N", "en-ay", "Noche", "night"],
  ["Ñ", "en-yay", "Niño", "child"],
  ["O", "oh", "Oso", "bear"],
  ["P", "pay", "Padre", "father"],
  ["Q", "koo", "Queso", "cheese"],
  ["R", "er-ay (rolled)", "Rojo", "red"],
  ["S", "ess-ay", "Sol", "sun"],
  ["T", "tay", "Tiempo", "time/weather"],
  ["U", "oo", "Uno", "one"],
  ["V", "oo-vay", "Verde", "green"],
  ["W", "do-blay oo-vay", "Wifi", "wifi (rare in Spanish)"],
  ["X", "ay-kees", "Xilófono", "xylophone"],
  ["Y", "ee gree-ay-gah (or 'ye')", "Yo", "I"],
  ["Z", "say-tah (theta in Spain)", "Zapato", "shoe"],
];

// ─── German ─────────────────────────────────────────────────────────────
const DE_LETTERS = [
  ["A", "ah", "Apfel", "apple"],
  ["B", "bay", "Brot", "bread"],
  ["C", "tsay", "Computer", "computer"],
  ["D", "day", "Danke", "thanks"],
  ["E", "eh", "Eis", "ice cream"],
  ["F", "eff", "Familie", "family"],
  ["G", "gay", "Garten", "garden"],
  ["H", "hah", "Haus", "house"],
  ["I", "ee", "Insel", "island"],
  ["J", "yot", "Junge", "boy (J sounds like Y)"],
  ["K", "kah", "Kaffee", "coffee"],
  ["L", "ell", "Liebe", "love"],
  ["M", "em", "Mutter", "mother"],
  ["N", "en", "Nacht", "night"],
  ["O", "oh", "Onkel", "uncle"],
  ["P", "pay", "Park", "park"],
  ["Q", "koo", "Quelle", "source"],
  ["R", "air (uvular)", "Rot", "red"],
  ["S", "ess", "Sonne", "sun"],
  ["T", "tay", "Tee", "tea"],
  ["U", "oo", "Uhr", "clock"],
  ["V", "fau", "Vater", "father (V sounds like F)"],
  ["W", "vay", "Wasser", "water (W sounds like V)"],
  ["X", "eeks", "Xylophon", "xylophone"],
  ["Y", "üpsilon", "Yacht", "yacht"],
  ["Z", "tsett", "Zucker", "sugar (Z sounds like 'ts')"],
  ["Ä", "ah-umlaut", "Äpfel", "apples"],
  ["Ö", "oh-umlaut", "Öl", "oil"],
  ["Ü", "oo-umlaut", "Über", "over/about"],
  ["ß", "ess-tset", "Straße", "street (sharp S)"],
];

function buildContent({ langName, intro, letters, exampleSentenceFormat, dialogueLines, dialogueSpeakers, culture }) {
  return {
    introduction: {
      text: intro,
      culturalNote: culture.note,
    },
    vocabulary: letters.map(([letter, pron, exampleWord, translation]) => ({
      term: letter,
      translation: `the letter ${letter}`,
      definition: `The letter ${letter}, pronounced “${pron}”.`,
      pronunciation: pron,
      partOfSpeech: "letter",
      exampleSentence: {
        original: exampleSentenceFormat(letter, exampleWord),
        translation: `${letter} as in ${exampleWord} (${translation}).`,
      },
      tip: `Tap the speaker to hear how the letter ${letter} is pronounced in ${langName}.`,
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
        "Tap any letter card to hear its sound.",
        "Use 'X comme [word]' / 'X as in [word]' to spell out loud.",
        "Practice spelling your own name and town daily.",
      ],
      nextSteps: "Once the letter sounds feel familiar, move on to common words and greetings.",
    },
  };
}

const FRENCH_CONTENT = buildContent({
  langName: "French",
  intro:
    "In this lesson you'll hear every letter of the French alphabet pronounced clearly. Tap each card to listen to the letter on its own — then practise spelling words you already know.",
  letters: FR_LETTERS,
  exampleSentenceFormat: (letter, word) => `${letter} comme ${word}.`,
  dialogueSpeakers: ["Sophie", "Marc"],
  dialogueLines: [
    { speaker: 0, text: "Bonjour, comment t'appelles-tu ?", translation: "Hello, what's your name?" },
    { speaker: 1, text: "Je m'appelle Marc. M-A-R-C.", translation: "I'm Marc. M-A-R-C." },
    { speaker: 0, text: "M comme Maison, A comme Amour, R comme Restaurant, C comme Café ?", translation: "M as in House, A as in Love, R as in Restaurant, C as in Coffee?" },
    { speaker: 1, text: "Exactement ! Et toi ?", translation: "Exactly! And you?" },
    { speaker: 0, text: "Sophie. S-O-P-H-I-E.", translation: "Sophie. S-O-P-H-I-E." },
    { speaker: 1, text: "Sophie, c'est un joli prénom.", translation: "Sophie, that's a nice name." },
    { speaker: 0, text: "Merci ! Sais-tu épeler ta ville ?", translation: "Thanks! Do you know how to spell your city?" },
    { speaker: 1, text: "Oui, j'habite à Lyon. L-Y-O-N.", translation: "Yes, I live in Lyon. L-Y-O-N." },
  ],
  culture: {
    title: "Spelling Out Loud in French",
    text: "On the phone or at a counter, French speakers very often spell names with 'X comme [word]' — a tradition you'll hear on TV and at the post office.",
    funFact: "The letter W is rare in native French words and is often called 'double vé'.",
  },
});

const SPANISH_CONTENT = buildContent({
  langName: "Spanish",
  intro:
    "Listen to every letter of the Spanish alphabet pronounced one by one. Tap each card to hear it clearly. Spanish has 27 letters — the 26 you know from English, plus Ñ.",
  letters: ES_LETTERS,
  exampleSentenceFormat: (letter, word) => `${letter} de ${word}.`,
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
    title: "The Ñ — a Symbol of Spanish",
    text: "Ñ is unique to Spanish (and a few other languages). Romance languages historically wrote it as 'nn', and the squiggle above (the tilde) is a stylised second n.",
    funFact: "The Spanish word for 'year' (año) without the tilde becomes ano — which means 'anus'. The tilde really matters.",
  },
});

const GERMAN_CONTENT = buildContent({
  langName: "German",
  intro:
    "Listen to every letter of the German alphabet, plus the four extra characters: Ä, Ö, Ü and ß. Tap each card to hear it pronounced clearly.",
  letters: DE_LETTERS,
  exampleSentenceFormat: (letter, word) => `${letter} wie ${word}.`,
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
    title: "Ä, Ö, Ü, ß — Beyond the 26 Letters",
    text: "German uses four extra characters. The umlaut (two dots) on a vowel changes its sound completely, and the ß (Eszett) represents a sharp S sound. Online, these can be spelled out as 'ae', 'oe', 'ue', 'ss'.",
    funFact: "Switzerland abolished the ß in official spelling decades ago, but Germany and Austria still use it.",
  },
});

// ─── Targets ────────────────────────────────────────────────────────────
const TARGETS = [
  { slug: "the-alphabet", title: "The Alphabet (French)", content: FRENCH_CONTENT },
  { slug: "es-a1-alphabet", title: "The Spanish Alphabet & Sounds", content: SPANISH_CONTENT },
  { slug: "de-a1-alphabet", title: "The German Alphabet, Umlauts & ß", content: GERMAN_CONTENT },
];

async function main() {
  console.log(`\n🔤 Alphabet lesson fix — ${APPLY ? "APPLY" : "DRY RUN"}\n`);

  for (const t of TARGETS) {
    const { data: lesson } = await s.from("lessons").select("id, slug, title").eq("slug", t.slug).maybeSingle();
    if (!lesson) {
      console.log(`  ⚠️  ${t.slug} not found in DB — skipping`);
      continue;
    }
    console.log(`  ${t.slug} (${lesson.title})`);
    console.log(`    → ${t.content.vocabulary.length} letter cards, ${t.content.dialogue.lines.length} dialogue lines`);
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
