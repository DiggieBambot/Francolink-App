/**
 * Generate 279 English tutor lessons with VARIED section templates.
 * Mirrors the French lessons' section diversity:
 *   - warmup_vocabulary, vocabulary_with_examples
 *   - fill_in_blank_dialogue, fill_in_blank_dialogue_extended
 *   - dialogue_read_aloud
 *   - matching_qa
 *   - word_order
 *   - image_question_prompts
 *   - free_response, discussion
 *   - reading_comprehension
 *
 * Level distribution: A1:66, A2:18, B1:161, B2:26, C1:8
 * Usage: npx tsx scripts/generate-english-lessons.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://biwacllbpdxzdxtmqtpw.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpd2FjbGxicGR4emR4dG1xdHB3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5OTUyMSwiZXhwIjoyMDg2MDc1NTIxfQ.5wCIs9XmsWykIg-AiZWaFg2koN0GKn_tXrZbXPXRakg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Seeded random for reproducibility ───────────────────────────────────────
let seed = 42;
function rand(): number {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Section templates (varied patterns mimicking French lessons) ─────────────
// Each pattern is an ordered array of section kinds for a lesson.
const TEMPLATES_A1 = [
  // Pattern 1: Simple (4 sections)
  ["warmup_vocabulary", "fill_in_blank_dialogue", "dialogue_read_aloud", "free_response"],
  // Pattern 2: With matching (5 sections)
  ["warmup_vocabulary", "fill_in_blank_dialogue", "dialogue_read_aloud", "matching_qa", "free_response"],
  // Pattern 3: Word order focus (5 sections)
  ["warmup_vocabulary", "dialogue_read_aloud", "fill_in_blank_dialogue", "word_order", "free_response"],
  // Pattern 4: Extended dialogue (6 sections)
  ["warmup_vocabulary", "vocabulary_with_examples", "fill_in_blank_dialogue", "dialogue_read_aloud", "word_order", "free_response"],
  // Pattern 5: Image prompts (5 sections)
  ["warmup_vocabulary", "fill_in_blank_dialogue", "dialogue_read_aloud", "image_question_prompts", "free_response"],
  // Pattern 6: Double vocab (6 sections)
  ["warmup_vocabulary", "fill_in_blank_dialogue", "warmup_vocabulary", "fill_in_blank_dialogue", "dialogue_read_aloud", "free_response"],
  // Pattern 7: Reading + discussion
  ["warmup_vocabulary", "reading_comprehension", "matching_qa", "free_response"],
];

const TEMPLATES_A2 = [
  ["warmup_vocabulary", "vocabulary_with_examples", "fill_in_blank_dialogue", "dialogue_read_aloud", "matching_qa", "free_response"],
  ["warmup_vocabulary", "fill_in_blank_dialogue", "dialogue_read_aloud", "fill_in_blank_dialogue_extended", "word_order", "free_response"],
  ["warmup_vocabulary", "reading_comprehension", "fill_in_blank_dialogue", "matching_qa", "discussion"],
  ["warmup_vocabulary", "fill_in_blank_dialogue", "vocabulary_with_examples", "dialogue_read_aloud", "image_question_prompts", "free_response"],
];

const TEMPLATES_B1 = [
  // Rich patterns (7-9 sections)
  ["warmup_vocabulary", "vocabulary_with_examples", "fill_in_blank_dialogue", "dialogue_read_aloud", "matching_qa", "fill_in_blank_dialogue_extended", "word_order", "image_question_prompts", "free_response"],
  ["warmup_vocabulary", "fill_in_blank_dialogue", "vocabulary_with_examples", "fill_in_blank_dialogue", "dialogue_read_aloud", "matching_qa", "word_order", "free_response"],
  ["warmup_vocabulary", "reading_comprehension", "vocabulary_with_examples", "fill_in_blank_dialogue", "fill_in_blank_dialogue_extended", "word_order", "free_response"],
  ["warmup_vocabulary", "vocabulary_with_examples", "fill_in_blank_dialogue", "dialogue_read_aloud", "fill_in_blank_dialogue_extended", "image_question_prompts", "discussion"],
  ["warmup_vocabulary", "fill_in_blank_dialogue", "dialogue_read_aloud", "fill_in_blank_dialogue_extended", "matching_qa", "word_order", "free_response"],
  ["warmup_vocabulary", "vocabulary_with_examples", "reading_comprehension", "fill_in_blank_dialogue", "dialogue_read_aloud", "matching_qa", "free_response"],
  ["warmup_vocabulary", "fill_in_blank_dialogue", "fill_in_blank_dialogue", "dialogue_read_aloud", "word_order", "image_question_prompts", "free_response"],
];

const TEMPLATES_B2 = [
  ["warmup_vocabulary", "vocabulary_with_examples", "reading_comprehension", "fill_in_blank_dialogue", "dialogue_read_aloud", "matching_qa", "fill_in_blank_dialogue_extended", "word_order", "image_question_prompts", "free_response"],
  ["warmup_vocabulary", "vocabulary_with_examples", "fill_in_blank_dialogue", "reading_comprehension", "dialogue_read_aloud", "fill_in_blank_dialogue_extended", "discussion"],
  ["warmup_vocabulary", "reading_comprehension", "vocabulary_with_examples", "fill_in_blank_dialogue", "matching_qa", "word_order", "free_response"],
];

const TEMPLATES_C1 = [
  ["warmup_vocabulary", "vocabulary_with_examples", "reading_comprehension", "fill_in_blank_dialogue", "dialogue_read_aloud", "fill_in_blank_dialogue_extended", "matching_qa", "word_order", "discussion"],
  ["warmup_vocabulary", "vocabulary_with_examples", "reading_comprehension", "fill_in_blank_dialogue_extended", "dialogue_read_aloud", "image_question_prompts", "free_response"],
];

function getTemplate(level: string): string[] {
  switch (level) {
    case "A1": return pick(TEMPLATES_A1);
    case "A2": return pick(TEMPLATES_A2);
    case "B1": return pick(TEMPLATES_B1);
    case "B2": return pick(TEMPLATES_B2);
    case "C1": return pick(TEMPLATES_C1);
    default: return pick(TEMPLATES_B1);
  }
}

// ─── Vocab banks (rich, topical) ─────────────────────────────────────────────

interface VocabItem {
  term: string;
  definition: string;
  pronunciation: string;
  part_of_speech: string;
  image_query: string;
}

const VOCAB_BANKS: Record<string, VocabItem[]> = {
  "Greetings and Introductions": [
    { term: "hello", definition: "a common greeting used when meeting someone", pronunciation: "/həˈləʊ/", part_of_speech: "interjection", image_query: "people greeting each other" },
    { term: "goodbye", definition: "a word used when leaving or parting", pronunciation: "/ɡʊdˈbaɪ/", part_of_speech: "interjection", image_query: "person waving goodbye" },
    { term: "name", definition: "what a person is called", pronunciation: "/neɪm/", part_of_speech: "noun", image_query: "name tag on person" },
    { term: "pleased", definition: "feeling happy about something", pronunciation: "/pliːzd/", part_of_speech: "adjective", image_query: "person smiling happily" },
    { term: "introduce", definition: "to tell someone another person's name for the first time", pronunciation: "/ˌɪntrəˈdjuːs/", part_of_speech: "verb", image_query: "people being introduced" },
    { term: "handshake", definition: "gripping and shaking someone's hand as a greeting", pronunciation: "/ˈhændʃeɪk/", part_of_speech: "noun", image_query: "two people shaking hands" },
  ],
  "Numbers and Counting": [
    { term: "number", definition: "a symbol or word representing a quantity", pronunciation: "/ˈnʌmbər/", part_of_speech: "noun", image_query: "numbers on a board" },
    { term: "count", definition: "to say numbers in order", pronunciation: "/kaʊnt/", part_of_speech: "verb", image_query: "child counting on fingers" },
    { term: "dozen", definition: "a group of twelve items", pronunciation: "/ˈdʌzn/", part_of_speech: "noun", image_query: "dozen eggs in carton" },
    { term: "total", definition: "the complete amount when everything is added up", pronunciation: "/ˈtəʊtl/", part_of_speech: "noun", image_query: "calculator showing total" },
    { term: "add", definition: "to put numbers together to get a bigger number", pronunciation: "/æd/", part_of_speech: "verb", image_query: "addition math symbols" },
  ],
  "Family Members": [
    { term: "mother", definition: "a female parent", pronunciation: "/ˈmʌðər/", part_of_speech: "noun", image_query: "mother with child" },
    { term: "father", definition: "a male parent", pronunciation: "/ˈfɑːðər/", part_of_speech: "noun", image_query: "father with child" },
    { term: "sibling", definition: "a brother or sister", pronunciation: "/ˈsɪblɪŋ/", part_of_speech: "noun", image_query: "brothers and sisters together" },
    { term: "grandparent", definition: "the parent of your mother or father", pronunciation: "/ˈɡrænpeərənt/", part_of_speech: "noun", image_query: "grandparents with grandchildren" },
    { term: "uncle", definition: "the brother of your mother or father", pronunciation: "/ˈʌŋkl/", part_of_speech: "noun", image_query: "uncle with family" },
    { term: "cousin", definition: "the child of your aunt or uncle", pronunciation: "/ˈkʌzn/", part_of_speech: "noun", image_query: "cousins playing together" },
  ],
  "Food and Drinks": [
    { term: "breakfast", definition: "the first meal of the day, eaten in the morning", pronunciation: "/ˈbrekfəst/", part_of_speech: "noun", image_query: "breakfast on table" },
    { term: "lunch", definition: "a meal eaten in the middle of the day", pronunciation: "/lʌntʃ/", part_of_speech: "noun", image_query: "lunch meal" },
    { term: "dinner", definition: "the main meal of the day, usually in the evening", pronunciation: "/ˈdɪnər/", part_of_speech: "noun", image_query: "family dinner table" },
    { term: "hungry", definition: "wanting or needing food", pronunciation: "/ˈhʌŋɡri/", part_of_speech: "adjective", image_query: "person feeling hungry" },
    { term: "delicious", definition: "tasting very good", pronunciation: "/dɪˈlɪʃəs/", part_of_speech: "adjective", image_query: "delicious food plate" },
    { term: "recipe", definition: "instructions for cooking a particular dish", pronunciation: "/ˈresɪpi/", part_of_speech: "noun", image_query: "recipe book open" },
  ],
  "Weather Talk": [
    { term: "sunny", definition: "when the sun is shining and the sky is clear", pronunciation: "/ˈsʌni/", part_of_speech: "adjective", image_query: "sunny clear sky" },
    { term: "rainy", definition: "when water falls from clouds", pronunciation: "/ˈreɪni/", part_of_speech: "adjective", image_query: "rain falling" },
    { term: "cloudy", definition: "when the sky is covered with clouds", pronunciation: "/ˈklaʊdi/", part_of_speech: "adjective", image_query: "cloudy sky" },
    { term: "temperature", definition: "how hot or cold something is", pronunciation: "/ˈtemprətʃər/", part_of_speech: "noun", image_query: "thermometer showing temperature" },
    { term: "forecast", definition: "a prediction of what the weather will be", pronunciation: "/ˈfɔːkɑːst/", part_of_speech: "noun", image_query: "weather forecast on screen" },
  ],
  "At the Restaurant": [
    { term: "menu", definition: "a list of food and drinks available at a restaurant", pronunciation: "/ˈmenjuː/", part_of_speech: "noun", image_query: "restaurant menu" },
    { term: "waiter", definition: "a person who serves food in a restaurant", pronunciation: "/ˈweɪtər/", part_of_speech: "noun", image_query: "waiter serving food" },
    { term: "order", definition: "to ask for food or drink in a restaurant", pronunciation: "/ˈɔːdər/", part_of_speech: "verb", image_query: "person ordering food" },
    { term: "bill", definition: "the paper showing how much you need to pay", pronunciation: "/bɪl/", part_of_speech: "noun", image_query: "restaurant bill on table" },
    { term: "tip", definition: "extra money given to a waiter for good service", pronunciation: "/tɪp/", part_of_speech: "noun", image_query: "tip money on table" },
    { term: "reservation", definition: "an arrangement to have a table kept for you", pronunciation: "/ˌrezəˈveɪʃn/", part_of_speech: "noun", image_query: "reserved table sign" },
  ],
  "Job Interviews": [
    { term: "interview", definition: "a formal meeting to assess a candidate for a job", pronunciation: "/ˈɪntəvjuː/", part_of_speech: "noun", image_query: "job interview setting" },
    { term: "resume", definition: "a document listing your work experience and skills", pronunciation: "/ˈrezjumeɪ/", part_of_speech: "noun", image_query: "resume document" },
    { term: "qualification", definition: "a skill or experience that makes you suitable for a job", pronunciation: "/ˌkwɒlɪfɪˈkeɪʃn/", part_of_speech: "noun", image_query: "certificates and diplomas" },
    { term: "strength", definition: "a good quality or ability that you have", pronunciation: "/streŋθ/", part_of_speech: "noun", image_query: "person showing confidence" },
    { term: "weakness", definition: "something you are not very good at", pronunciation: "/ˈwiːknəs/", part_of_speech: "noun", image_query: "person thinking about improvement" },
    { term: "hire", definition: "to give someone a job", pronunciation: "/haɪər/", part_of_speech: "verb", image_query: "handshake after hiring" },
  ],
  "Artificial Intelligence": [
    { term: "algorithm", definition: "a set of rules a computer follows to solve a problem", pronunciation: "/ˈælɡərɪðəm/", part_of_speech: "noun", image_query: "computer algorithm flowchart" },
    { term: "automation", definition: "using machines or computers to do work without human help", pronunciation: "/ˌɔːtəˈmeɪʃn/", part_of_speech: "noun", image_query: "automated factory robots" },
    { term: "data", definition: "information collected for analysis", pronunciation: "/ˈdeɪtə/", part_of_speech: "noun", image_query: "data visualization" },
    { term: "neural network", definition: "a computer system designed to work like the human brain", pronunciation: "/ˈnjʊərəl ˈnetwɜːk/", part_of_speech: "noun", image_query: "neural network diagram" },
    { term: "bias", definition: "unfair preference for or against something", pronunciation: "/ˈbaɪəs/", part_of_speech: "noun", image_query: "unbalanced scale" },
    { term: "ethical", definition: "relating to what is morally right or wrong", pronunciation: "/ˈeθɪkl/", part_of_speech: "adjective", image_query: "ethics concept" },
  ],
};

// Generic vocab generation for topics not in the bank
function generateTopicVocab(title: string, level: string): VocabItem[] {
  const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const complexity = level === "A1" || level === "A2" ? "simple" : "advanced";

  // Common verbs/nouns by theme
  const themeWords: Record<string, VocabItem[]> = {
    travel: [
      { term: "journey", definition: "travelling from one place to another", pronunciation: "/ˈdʒɜːni/", part_of_speech: "noun", image_query: "person on journey" },
      { term: "destination", definition: "the place you are going to", pronunciation: "/ˌdestɪˈneɪʃn/", part_of_speech: "noun", image_query: "travel destination" },
      { term: "luggage", definition: "bags and suitcases you take when travelling", pronunciation: "/ˈlʌɡɪdʒ/", part_of_speech: "noun", image_query: "luggage suitcases" },
      { term: "explore", definition: "to travel around a place to learn about it", pronunciation: "/ɪkˈsplɔːr/", part_of_speech: "verb", image_query: "person exploring new place" },
    ],
    business: [
      { term: "colleague", definition: "a person you work with", pronunciation: "/ˈkɒliːɡ/", part_of_speech: "noun", image_query: "colleagues working together" },
      { term: "deadline", definition: "the time by which something must be finished", pronunciation: "/ˈdedlaɪn/", part_of_speech: "noun", image_query: "calendar deadline" },
      { term: "negotiate", definition: "to discuss something to reach an agreement", pronunciation: "/nɪˈɡəʊʃieɪt/", part_of_speech: "verb", image_query: "people negotiating" },
      { term: "proposal", definition: "a formal suggestion or plan", pronunciation: "/prəˈpəʊzl/", part_of_speech: "noun", image_query: "business proposal document" },
    ],
    culture: [
      { term: "tradition", definition: "a custom or belief passed down through generations", pronunciation: "/trəˈdɪʃn/", part_of_speech: "noun", image_query: "cultural tradition" },
      { term: "heritage", definition: "the history and traditions of a country or society", pronunciation: "/ˈherɪtɪdʒ/", part_of_speech: "noun", image_query: "historical heritage site" },
      { term: "diverse", definition: "including many different types of people or things", pronunciation: "/daɪˈvɜːs/", part_of_speech: "adjective", image_query: "diverse group of people" },
      { term: "ceremony", definition: "a formal event with special rituals", pronunciation: "/ˈserəməni/", part_of_speech: "noun", image_query: "ceremony event" },
    ],
    daily: [
      { term: "routine", definition: "a regular way of doing things in a particular order", pronunciation: "/ruːˈtiːn/", part_of_speech: "noun", image_query: "daily routine schedule" },
      { term: "schedule", definition: "a plan of activities and times", pronunciation: "/ˈʃedjuːl/", part_of_speech: "noun", image_query: "weekly schedule planner" },
      { term: "habit", definition: "something you do regularly, often without thinking", pronunciation: "/ˈhæbɪt/", part_of_speech: "noun", image_query: "person with daily habits" },
      { term: "manage", definition: "to succeed in doing something difficult", pronunciation: "/ˈmænɪdʒ/", part_of_speech: "verb", image_query: "person managing tasks" },
    ],
  };

  // Match theme from title
  const titleLower = title.toLowerCase();
  let baseVocab: VocabItem[] = [];
  if (/travel|airport|hotel|touris|holiday|abroad|backpack/.test(titleLower)) baseVocab = themeWords.travel;
  else if (/business|meeting|interview|office|email|network|sales|client/.test(titleLower)) baseVocab = themeWords.business;
  else if (/culture|tradition|festival|heritage|history/.test(titleLower)) baseVocab = themeWords.culture;
  else baseVocab = themeWords.daily;

  // Add topic-specific words
  const topicSpecific: VocabItem[] = [
    { term: words[0] || "topic", definition: `relating to ${title.toLowerCase()}`, pronunciation: `/${words[0] || "topic"}/`, part_of_speech: "noun", image_query: `${title.toLowerCase()} illustration` },
    { term: "discuss", definition: "to talk about something with another person", pronunciation: "/dɪˈskʌs/", part_of_speech: "verb", image_query: "people having discussion" },
  ];

  return [...baseVocab, ...topicSpecific].slice(0, level === "A1" ? 4 : level === "A2" ? 5 : 6);
}

function getVocab(title: string, level: string): VocabItem[] {
  if (VOCAB_BANKS[title]) return VOCAB_BANKS[title].slice(0, level === "A1" ? 4 : level === "A2" ? 5 : 6);
  return generateTopicVocab(title, level);
}

// ─── Section builders ────────────────────────────────────────────────────────

function buildWarmupVocab(title: string, level: string, sectionNum: number): any {
  const vocab = getVocab(title, level);
  return {
    kind: "warmup_vocabulary",
    number: sectionNum,
    title: "Vocabulary",
    tutor_instruction: "Introduce the vocabulary. Have students repeat each word aloud.",
    student_instruction: "Learn the following words and repeat after your tutor.",
    items: vocab.map(v => ({
      term: v.term,
      definition: v.definition,
      pronunciation: v.pronunciation,
      part_of_speech: v.part_of_speech,
      image_query: v.image_query,
      image_url: null,
      note: null,
    })),
  };
}

function buildVocabWithExamples(title: string, level: string, sectionNum: number): any {
  const vocab = getVocab(title, level);
  return {
    kind: "vocabulary_with_examples",
    number: sectionNum,
    title: "Vocabulary in Context",
    tutor_instruction: "Go through each word with the example sentence. Ask students to make their own sentences.",
    student_instruction: "Study each word and its example. Try to use it in your own sentence.",
    items: vocab.map(v => ({
      term: v.term,
      definition: v.definition,
      pronunciation: v.pronunciation,
      part_of_speech: v.part_of_speech,
      image_query: v.image_query,
      image_url: null,
      example_sentence: {
        original: `I ${v.part_of_speech === "verb" ? v.term : `use the word "${v.term}"`} every day.`,
        simplified: `Example using "${v.term}" in a sentence.`,
      },
    })),
  };
}

function buildFillInBlankDialogue(title: string, level: string, sectionNum: number): any {
  const topicLower = title.toLowerCase();
  const exchanges = [
    { text: `Let's talk about ${topicLower}. What do you think?`, speaker: "Teacher", speaker_role: "tutor", avatar_seed: "Teacher", blank: false, translation: null },
    { text: `I think ${topicLower} is very interesting.`, speaker: "Student", speaker_role: "student", avatar_seed: "Student", blank: true, translation: null },
    { text: `Can you tell me more? Give me an example.`, speaker: "Teacher", speaker_role: "tutor", avatar_seed: "Teacher", blank: false, translation: null },
    { text: `For example, I often...`, speaker: "Student", speaker_role: "student", avatar_seed: "Student", blank: true, translation: null },
    { text: `That's great! How about in your daily life?`, speaker: "Teacher", speaker_role: "tutor", avatar_seed: "Teacher", blank: false, translation: null },
    { text: `In my daily life, I...`, speaker: "Student", speaker_role: "student", avatar_seed: "Student", blank: true, translation: null },
  ];

  return {
    kind: "fill_in_blank_dialogue",
    number: sectionNum,
    title: "Practice Conversation",
    tutor_instruction: "Read the teacher lines. Let students fill in their responses freely.",
    student_instruction: "Complete the dialogue with your own answers.",
    exchanges: level === "A1" ? exchanges.slice(0, 4) : exchanges,
    answer_pool: [],
    valid_answers_by_blank: {},
  };
}

function buildFillInBlankDialogueExtended(title: string, level: string, sectionNum: number): any {
  const topicLower = title.toLowerCase();
  return {
    kind: "fill_in_blank_dialogue_extended",
    number: sectionNum,
    title: "Extended Practice",
    tutor_instruction: "This is a longer dialogue. Guide the student through each blank.",
    student_instruction: "Fill in the blanks with appropriate words or phrases.",
    exchanges: [
      { text: `Have you ever thought about ${topicLower}?`, speaker: "Teacher", speaker_role: "tutor", avatar_seed: "Teacher", blank: false, translation: null },
      { text: `Yes, I have. I believe that ___`, speaker: "Student", speaker_role: "student", avatar_seed: "Student", blank: true, translation: null },
      { text: `Interesting. What would you change about it?`, speaker: "Teacher", speaker_role: "tutor", avatar_seed: "Teacher", blank: false, translation: null },
      { text: `I would change ___`, speaker: "Student", speaker_role: "student", avatar_seed: "Student", blank: true, translation: null },
      { text: `And why is that important to you?`, speaker: "Teacher", speaker_role: "tutor", avatar_seed: "Teacher", blank: false, translation: null },
      { text: `It's important because ___`, speaker: "Student", speaker_role: "student", avatar_seed: "Student", blank: true, translation: null },
    ],
    answer_pool: [],
    valid_answers_by_blank: {},
  };
}

function buildDialogueReadAloud(title: string, level: string, sectionNum: number): any {
  const topicLower = title.toLowerCase();
  const lines = level === "A1" ? [
    { role: "tutor", text: `Do you like ${topicLower}?`, speaker: "Teacher", avatar_seed: "Teacher", translation: null },
    { role: "student", text: `Yes, I like ${topicLower} very much.`, speaker: "Student", avatar_seed: "Student", translation: null },
    { role: "tutor", text: `What is your favourite part?`, speaker: "Teacher", avatar_seed: "Teacher", translation: null },
    { role: "student", text: `My favourite part is...`, speaker: "Student", avatar_seed: "Student", translation: null },
  ] : [
    { role: "tutor", text: `Today we're discussing ${topicLower}. What's your experience with it?`, speaker: "Teacher", avatar_seed: "Teacher", translation: null },
    { role: "student", text: `Well, I've always been interested in ${topicLower}. I think it's quite relevant.`, speaker: "Student", avatar_seed: "Student", translation: null },
    { role: "tutor", text: `Can you elaborate on why you find it relevant?`, speaker: "Teacher", avatar_seed: "Teacher", translation: null },
    { role: "student", text: `Certainly. In my opinion, ${topicLower} affects our daily lives in many ways.`, speaker: "Student", avatar_seed: "Student", translation: null },
    { role: "tutor", text: `That's a good point. Would you say it's more positive or negative?`, speaker: "Teacher", avatar_seed: "Teacher", translation: null },
    { role: "student", text: `I'd say it has both positive and negative aspects. On one hand...`, speaker: "Student", avatar_seed: "Student", translation: null },
  ];

  return {
    kind: "dialogue_read_aloud",
    number: sectionNum,
    title: "Read Aloud",
    tutor_instruction: "Read the dialogue together. Focus on pronunciation and natural intonation.",
    student_instruction: "Read your lines aloud with your tutor. Pay attention to pronunciation.",
    context: `A conversation about ${topicLower}.`,
    tutor_role: "tutor",
    student_role: "student",
    lines,
  };
}

function buildMatchingQA(title: string, level: string, sectionNum: number): any {
  const topicLower = title.toLowerCase();
  return {
    kind: "matching_qa",
    number: sectionNum,
    title: "Comprehension Questions",
    tutor_instruction: "Ask the questions and check student understanding.",
    student_instruction: "Match each question with the correct answer.",
    pairs: [
      { question: `What is ${topicLower} about?`, answer: `${title} is about learning and practising English related to this topic.`, question_translation: null, answer_translation: null },
      { question: `Why is this topic useful?`, answer: `It helps you communicate better in everyday situations.`, question_translation: null, answer_translation: null },
      { question: `How can you practise this at home?`, answer: `You can practise by using the vocabulary in real conversations.`, question_translation: null, answer_translation: null },
      { question: `What should you remember from this lesson?`, answer: `The key vocabulary and how to use it in context.`, question_translation: null, answer_translation: null },
    ],
  };
}

function buildWordOrder(title: string, level: string, sectionNum: number): any {
  const sentences = level === "A1" || level === "A2" ? [
    { correct: "I like to learn English every day.", scrambled: "every like English day. I to learn" },
    { correct: "She goes to school by bus.", scrambled: "by goes to bus. She school" },
    { correct: "They are playing in the park.", scrambled: "in are the playing park. They" },
  ] : [
    { correct: "I have been studying English for three years.", scrambled: "years. for three have been studying English I" },
    { correct: "She would have gone if she had known.", scrambled: "gone had if have She known. would she" },
    { correct: "The book that I borrowed was very interesting.", scrambled: "borrowed very I was interesting. The that book" },
  ];

  return {
    kind: "word_order",
    number: sectionNum,
    title: "Word Order",
    tutor_instruction: "Help students understand English sentence structure.",
    student_instruction: "Put the words in the correct order to make a sentence.",
    example: { correct: "I am learning English.", scrambled: "English. learning am I" },
    items: sentences.map(s => ({ correct: s.correct, scrambled: s.scrambled, expected_topic: null })),
  };
}

function buildImageQuestionPrompts(title: string, level: string, sectionNum: number): any {
  const topicLower = title.toLowerCase();
  return {
    kind: "image_question_prompts",
    number: sectionNum,
    title: "Picture Discussion",
    tutor_instruction: "Show the images and ask the questions. Encourage detailed answers.",
    student_instruction: "Look at the images and answer the questions.",
    example: { student_question: "What can you see in this picture?" },
    prompts: [
      { question: `Describe what you see in this picture about ${topicLower}.`, image_url: null, image_hint: `${topicLower} scene`, question_translation: null },
      { question: `What is happening in this image?`, image_url: null, image_hint: `people engaged in ${topicLower}`, question_translation: null },
      { question: `How does this picture relate to today's topic?`, image_url: null, image_hint: `${topicLower} context`, question_translation: null },
    ],
  };
}

function buildFreeResponse(title: string, level: string, sectionNum: number): any {
  const topicLower = title.toLowerCase();
  const questions = level === "A1" || level === "A2" ? [
    `Do you like ${topicLower}? Why or why not?`,
    `Tell me about your experience with ${topicLower}.`,
    `What new words did you learn today?`,
  ] : [
    `What are the advantages and disadvantages of ${topicLower}?`,
    `How has ${topicLower} changed in recent years?`,
    `What advice would you give someone learning about ${topicLower}?`,
    `How is ${topicLower} different in your country compared to English-speaking countries?`,
  ];

  return {
    kind: "free_response",
    number: sectionNum,
    title: "Discussion",
    tutor_instruction: "Ask these questions. Encourage full sentences and correct errors gently.",
    student_instruction: "Discuss these questions with your tutor. Try to give detailed answers.",
    questions,
  };
}

function buildDiscussion(title: string, level: string, sectionNum: number): any {
  const topicLower = title.toLowerCase();
  return {
    kind: "discussion",
    number: sectionNum,
    title: "Open Discussion",
    tutor_instruction: "Lead a free discussion on the topic. Ask follow-up questions.",
    student_instruction: "Share your thoughts and opinions freely.",
    questions: [
      `What is your personal opinion about ${topicLower}?`,
      `Do you think ${topicLower} will be more or less important in the future?`,
      `What surprised you most about today's lesson?`,
    ],
  };
}

function buildReadingComprehension(title: string, level: string, sectionNum: number): any {
  const topicLower = title.toLowerCase();
  const passages: Record<string, string> = {
    A1: `${title} is an important topic. Many people talk about it every day. It is useful to know the key words. When you learn about ${topicLower}, you can speak English better. Let us practise together!`,
    A2: `${title} is something we often encounter in daily life. Understanding this topic helps you communicate better. In this lesson, we will explore the main ideas and learn useful vocabulary. Try to remember the key phrases and use them when you speak English.`,
    B1: `${title} is a topic that affects many aspects of modern life. Whether at work, at home, or socialising, knowledge of this subject proves valuable. We will examine key concepts, discuss different perspectives, and practise expressing opinions clearly. By the end, you should feel more confident discussing ${topicLower} in both formal and informal settings.`,
    B2: `The topic of ${topicLower} has become increasingly relevant in today's interconnected world. As societies evolve and new challenges emerge, our understanding must deepen accordingly. This passage invites you to critically examine various aspects, consider multiple viewpoints, and articulate nuanced arguments. The vocabulary and structures presented here will enable sophisticated discussion.`,
    C1: `${title} represents one of the more intellectually demanding areas of contemporary discourse. The nuances inherent in this subject require not only a sophisticated command of vocabulary and grammar, but also the ability to navigate ambiguity, construct layered arguments, and engage with abstract concepts at a level approaching that of an educated native speaker.`,
  };

  return {
    kind: "reading_comprehension",
    number: sectionNum,
    title: title,
    tutor_instruction: "Have the student read aloud. Check pronunciation. Ask comprehension questions.",
    student_instruction: "Read the passage carefully and answer the questions below.",
    passage: passages[level] || passages.B1,
    questions: [
      { question: "What is the main idea of this passage?", answer: `The main idea is ${topicLower}.` },
      { question: "Why is this topic important?", answer: "It helps with everyday English communication." },
      { question: "What should you do with the new vocabulary?", answer: "Use it in your own sentences and conversations." },
    ],
  };
}

// ─── Build full lesson from template ─────────────────────────────────────────

function buildLesson(title: string, slug: string, level: string, category: string, topicTags: string[]) {
  const template = getTemplate(level);
  const sections: any[] = [];

  let sectionNum = 1;
  for (const kind of template) {
    switch (kind) {
      case "warmup_vocabulary": sections.push(buildWarmupVocab(title, level, sectionNum)); break;
      case "vocabulary_with_examples": sections.push(buildVocabWithExamples(title, level, sectionNum)); break;
      case "fill_in_blank_dialogue": sections.push(buildFillInBlankDialogue(title, level, sectionNum)); break;
      case "fill_in_blank_dialogue_extended": sections.push(buildFillInBlankDialogueExtended(title, level, sectionNum)); break;
      case "dialogue_read_aloud": sections.push(buildDialogueReadAloud(title, level, sectionNum)); break;
      case "matching_qa": sections.push(buildMatchingQA(title, level, sectionNum)); break;
      case "word_order": sections.push(buildWordOrder(title, level, sectionNum)); break;
      case "image_question_prompts": sections.push(buildImageQuestionPrompts(title, level, sectionNum)); break;
      case "free_response": sections.push(buildFreeResponse(title, level, sectionNum)); break;
      case "discussion": sections.push(buildDiscussion(title, level, sectionNum)); break;
      case "reading_comprehension": sections.push(buildReadingComprehension(title, level, sectionNum)); break;
    }
    sectionNum++;
  }

  return {
    slug,
    title,
    level,
    language: "en",
    title_translation: null,
    hero_image_url: null,
    hero_image_hint: title.toLowerCase(),
    duration_minutes: level === "A1" ? 25 : level === "A2" ? 30 : level === "B1" ? 35 : 40,
    objectives: [
      { skill: "speaking", cefr_can_do: `I can discuss topics related to ${title.toLowerCase()}.`, student_label: `Talk about ${title.toLowerCase()} with confidence.` },
      { skill: "reading", cefr_can_do: `I can understand texts about ${title.toLowerCase()}.`, student_label: `Read and understand passages about ${title.toLowerCase()}.` },
    ],
    tutor_overview: `This lesson covers ${title.toLowerCase()}. Students practise vocabulary, reading, dialogue, and discussion.`,
    learning_tips: [
      "Repeat new words out loud several times.",
      "Try to use today's vocabulary in your own sentences.",
      "Don't worry about mistakes — they help you learn!",
    ],
    topic_tags: topicTags,
    sections,
  };
}

// ─── Topic definitions ───────────────────────────────────────────────────────

const TOPIC_BANK: Record<string, Record<string, string[]>> = {
  A1: {
    "en-conversation": [
      "Greetings and Introductions", "Numbers and Counting", "Colours and Shapes",
      "Family Members", "Days of the Week", "Months and Seasons", "Weather Talk",
      "Food and Drinks", "At the Restaurant", "My Daily Routine",
      "Telling the Time", "My Home", "In the Classroom", "Clothes and Fashion",
      "Animals and Pets", "Parts of the Body", "Feelings and Emotions",
      "Hobbies and Free Time", "Sports and Games", "At the Supermarket",
      "Directions and Places", "Transport and Travel", "My School Day",
      "Describing People", "In the Park", "At the Doctor", "On the Phone",
      "The Alphabet", "Asking Questions", "Likes and Dislikes",
      "My Bedroom", "Breakfast Time", "Playing Outside", "Going Shopping",
      "Making Friends", "At the Beach", "My Birthday", "Toys and Games",
      "Fruit and Vegetables", "Simple Present Tense",
    ],
    "en-travel-culture": [
      "At the Airport", "Checking into a Hotel", "Asking for Directions",
      "Ordering Food Abroad", "British vs American English", "Famous Landmarks",
      "Taking a Taxi", "At the Train Station", "Tourist Information",
      "Buying Souvenirs",
    ],
    "en-kids": [
      "Hello and Goodbye", "My Favourite Animal", "Counting to Twenty",
      "Rainbow Colours", "My Family Tree", "Fruit Basket",
      "What Time Is It?", "My Toys", "In the Playground",
      "The Alphabet Song", "Farm Animals", "Weather Song",
      "My Lunchbox", "Body Parts Song", "Classroom Objects",
      "Action Verbs",
    ],
    "en-business": [],
  },
  A2: {
    "en-conversation": [
      "Talking About the Past", "Making Plans", "At the Cinema",
      "Describing Your Town", "Health and Fitness", "Cooking a Recipe",
      "Comparing Things", "A Phone Conversation", "The Weather Forecast",
      "Booking a Table",
    ],
    "en-travel-culture": [
      "Planning a Holiday", "At the Museum", "Street Food Around the World",
      "Cultural Differences",
    ],
    "en-business": [
      "Office Vocabulary", "Writing a Simple Email", "A Job Application",
    ],
    "en-kids": ["A Day at the Zoo"],
  },
  B1: {
    "en-conversation": [
      "Talking About Experiences", "Giving Advice", "Making Complaints",
      "Discussing Films and Books", "Environmental Issues", "Technology in Daily Life",
      "Education Systems", "Health and Medicine", "Social Media",
      "News and Current Events", "Describing a Process", "Telling a Story",
      "Agreeing and Disagreeing", "Making Suggestions", "Discussing Habits",
      "Life in the City vs Country", "Future Plans and Ambitions",
      "Describing Personality", "Cultural Festivals", "Shopping Online",
      "Cooking and Cuisine", "Music and Entertainment", "Volunteering",
      "Neighbours and Community", "The World of Work", "Childhood Memories",
      "Describing a Journey", "Animals and the Environment", "Sleep and Dreams",
      "Money and Budgeting", "Fashion and Style", "Relationships",
      "Traditions and Customs", "Science and Discovery", "Art and Creativity",
      "Adventure and Risk", "Law and Society", "Housing and Renting",
      "Exercise and Wellbeing", "Photography", "Language Learning Tips",
      "Pets and Animals", "Personal Growth", "Travelling by Train",
      "Stress and Relaxation", "Celebrating Success", "Debate Skills",
      "Empathy and Understanding", "Public Speaking", "Reading Habits",
      "Writing a Blog Post", "Podcasts and Listening", "Seasons and Activities",
      "Weekend Routines", "Household Chores", "DIY and Repairs",
      "Gardening", "Street Art", "Museums and Galleries",
      "Theme Parks", "Camping and Outdoors", "Cycling Culture",
      "Football and Sport Culture", "Board Games", "The News",
      "Charity Work", "Time Management", "Daily Commute",
      "Working from Home", "Digital Detox", "Night Life",
      "Breakfast Around the World", "Regional Accents", "Idioms Part 1",
      "Idioms Part 2", "Phrasal Verbs Part 1", "Phrasal Verbs Part 2",
      "Phrasal Verbs Part 3", "Conditionals in Real Life", "Passive Voice Usage",
      "Reported Speech", "Relative Clauses", "Linking Words",
      "Formal vs Informal", "Email Etiquette",
      "Social Etiquette", "Public Transport", "Describing Places",
      "Job Satisfaction", "Learning Styles", "First Impressions",
      "Giving Directions", "Making Appointments", "Apologising",
      "Thanking People", "Small Talk", "Weather Conversations",
      "Cooking at Home", "Eating Out", "Restaurant Reviews",
      "Film Reviews",
    ],
    "en-business": [
      "Job Interviews", "Business Meetings", "Negotiation Skills",
      "Presentations", "Team Management", "Client Communication",
      "Business Emails", "Networking Events", "Project Planning",
      "Conflict Resolution", "Performance Reviews", "Sales Techniques",
      "Marketing Basics", "Customer Service", "Business Phone Calls",
      "Writing Reports", "Company Culture", "Leadership Skills",
      "Financial Vocabulary", "Startup Culture", "Remote Work Communication",
      "Cross-cultural Business", "Time Management at Work", "Business Travel",
      "HR and Recruitment", "Professional Development",
    ],
    "en-travel-culture": [
      "Exploring London", "New York City Guide", "Australian Culture",
      "Canadian Traditions", "Irish Culture", "Scottish Highlands",
      "South African Culture", "Indian English", "Caribbean English",
      "Backpacking Tips", "Eco-Tourism", "Food Tourism",
      "Historical Sites", "Road Trip Planning", "Island Hopping",
      "Mountain Trekking", "City vs Nature Holidays", "Budget Travel",
      "Luxury Travel", "Solo Travel", "Group Travel Dynamics",
      "Travel Photography", "Local Markets", "Street Food Adventures",
      "Cultural Etiquette", "Festival Tourism", "Sustainable Travel",
      "Adventure Sports Abroad", "Volunteering Abroad", "Living Abroad",
      "Digital Nomad Life", "Working Holiday Visas", "Language Exchange Travel",
      "Gap Year Planning", "Cruise Holidays",
    ],
    "en-kids": [],
  },
  B2: {
    "en-conversation": [
      "Ethical Dilemmas", "Artificial Intelligence", "Climate Change Solutions",
      "Mental Health Awareness", "The Future of Education", "Gender Equality",
      "Space Exploration", "The Gig Economy", "Social Justice",
      "Media Literacy", "Philosophy of Happiness", "Genetic Engineering",
      "Urban Planning", "Cultural Identity",
    ],
    "en-business": [
      "Corporate Strategy", "International Trade", "Innovation Management",
      "Crisis Communication", "Business Ethics", "Mergers and Acquisitions",
      "Market Analysis", "Brand Building",
    ],
    "en-travel-culture": [
      "Colonialism and Language", "Global English Varieties", "Immigration Stories",
      "Diaspora Communities",
    ],
    "en-kids": [],
  },
  C1: {
    "en-conversation": [
      "Rhetoric and Persuasion", "The Philosophy of Language",
      "Literary Analysis", "Academic Writing Style",
      "Nuance and Ambiguity", "Sociolinguistics",
    ],
    "en-business": [
      "Executive Communication", "Thought Leadership",
    ],
    "en-travel-culture": [],
    "en-kids": [],
  },
};

// ─── Main ────────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

async function main() {
  console.log("Generating English lessons with varied templates...\n");

  const allLessons: any[] = [];
  const usedSlugs = new Set<string>();

  for (const [level, categories] of Object.entries(TOPIC_BANK)) {
    for (const [category, topics] of Object.entries(categories)) {
      for (const title of topics) {
        let slug = slugify(title);
        if (usedSlugs.has(slug)) slug = `${slug}-${level.toLowerCase()}`;
        if (usedSlugs.has(slug)) slug = `${slug}-${category.replace("en-", "")}`;
        usedSlugs.add(slug);

        const topicTags = [
          ...title.toLowerCase().split(/\s+/).filter(w => w.length > 3),
          category.replace("en-", ""),
          level.toLowerCase(),
        ];

        const content = buildLesson(title, slug, level, category, topicTags);

        allLessons.push({
          slug,
          title,
          level,
          language: "en",
          duration_minutes: content.duration_minutes,
          topic_tags: topicTags,
          status: "published",
          content,
        });
      }
    }
  }

  console.log(`Generated ${allLessons.length} lessons:`);
  const byLevel: Record<string, number> = {};
  for (const l of allLessons) {
    byLevel[l.level] = (byLevel[l.level] || 0) + 1;
  }
  console.log("  By level:", byLevel);

  // Show template variety
  const templatePatterns = new Set<string>();
  for (const l of allLessons) {
    const pattern = l.content.sections.map((s: any) => s.kind).join(" → ");
    templatePatterns.add(pattern);
  }
  console.log(`  Unique templates used: ${templatePatterns.size}`);
  console.log("");

  // Insert in batches
  const BATCH_SIZE = 50;
  let inserted = 0;
  for (let i = 0; i < allLessons.length; i += BATCH_SIZE) {
    const batch = allLessons.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("tutor_lessons").insert(batch);

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      for (const lesson of batch) {
        const { error: singleErr } = await supabase.from("tutor_lessons").insert(lesson);
        if (singleErr) {
          console.error(`  Failed: ${lesson.slug} — ${singleErr.message}`);
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
      console.log(`  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} lessons)`);
    }
  }

  console.log(`\nDone! Inserted ${inserted} English lessons with ${templatePatterns.size} unique template patterns.`);
}

main().catch(console.error);
