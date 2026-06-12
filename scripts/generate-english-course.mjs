#!/usr/bin/env node
// scripts/generate-english-course.mjs
// Generates English A2/B1/B2 courses using OpenAI + inserts into Supabase.
// Usage: node --env-file=.env.local scripts/generate-english-course.mjs --level=a2 [--unit=N] [--dry-run]

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const DRY_RUN = process.argv.includes("--dry-run");
const LEVEL_ARG = process.argv.find((a) => a.startsWith("--level="))?.split("=")[1]?.toUpperCase();
const ONLY_UNIT = process.argv.find((a) => a.startsWith("--unit="))?.split("=")[1];

if (!LEVEL_ARG || !["A2", "B1", "B2"].includes(LEVEL_ARG)) {
  console.error("Usage: --level=a2|b1|b2 [--unit=N] [--dry-run]");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ENGLISH_LANGUAGE_ID = "2ff6cabc-541a-47c0-9c8a-7b15a328cf7e";

// ═══════════════════════════════════════════════════════════════════
// Course definitions per level
// ═══════════════════════════════════════════════════════════════════

const COURSES = {
  A2: {
    course: {
      title: "English A2 - Elementary",
      slug: "english-a2",
      description:
        "Build on your basics! Talk about the past and future, handle everyday situations, describe experiences, and communicate with more confidence.",
      level: "A2",
      estimated_hours: 80,
      total_lessons: 40,
    },
    units: [
      {
        title: "Talking About the Past",
        description: "Learn past simple tense, tell stories about your weekend, holidays, and childhood memories.",
        lessons: [
          { title: "Past Simple — Regular Verbs", type: "GRAMMAR", slug: "en-a2-past-regular" },
          { title: "Past Simple — Irregular Verbs", type: "GRAMMAR", slug: "en-a2-past-irregular" },
          { title: "My Last Weekend", type: "CONVERSATION", slug: "en-a2-last-weekend" },
          { title: "Childhood Memories", type: "CONVERSATION", slug: "en-a2-childhood" },
          { title: "Unit 1 Review", type: "REVIEW", slug: "en-a2-unit1-review" },
        ],
      },
      {
        title: "Making Plans & Future",
        description: "Talk about future plans, make arrangements, use 'going to' and 'will'.",
        lessons: [
          { title: "Going To (Plans & Intentions)", type: "GRAMMAR", slug: "en-a2-going-to" },
          { title: "Will & Won't (Predictions)", type: "GRAMMAR", slug: "en-a2-will-wont" },
          { title: "Making Arrangements", type: "CONVERSATION", slug: "en-a2-arrangements" },
          { title: "Holiday Planning", type: "CONVERSATION", slug: "en-a2-holiday-planning" },
          { title: "Unit 2 Review", type: "REVIEW", slug: "en-a2-unit2-review" },
        ],
      },
      {
        title: "Around the House",
        description: "Household chores, giving instructions, making requests, and polite English.",
        lessons: [
          { title: "Household Chores", type: "VOCABULARY", slug: "en-a2-household-chores" },
          { title: "Making Requests Politely", type: "GRAMMAR", slug: "en-a2-polite-requests" },
          { title: "Giving & Following Instructions", type: "CONVERSATION", slug: "en-a2-instructions" },
          { title: "Problems at Home", type: "CONVERSATION", slug: "en-a2-home-problems" },
          { title: "Unit 3 Review", type: "REVIEW", slug: "en-a2-unit3-review" },
        ],
      },
      {
        title: "Travel & Transport",
        description: "Book tickets, check in at airports, deal with travel situations, and describe journeys.",
        lessons: [
          { title: "At the Airport", type: "CONVERSATION", slug: "en-a2-airport" },
          { title: "Booking a Trip", type: "CONVERSATION", slug: "en-a2-booking-trip" },
          { title: "Travel Vocabulary", type: "VOCABULARY", slug: "en-a2-travel-vocab" },
          { title: "Describing a Journey", type: "CONVERSATION", slug: "en-a2-describe-journey" },
          { title: "Unit 4 Review", type: "REVIEW", slug: "en-a2-unit4-review" },
        ],
      },
      {
        title: "Health & Wellbeing",
        description: "Talk about health habits, symptoms, give advice with 'should', and pharmacy visits.",
        lessons: [
          { title: "Healthy Habits", type: "VOCABULARY", slug: "en-a2-healthy-habits" },
          { title: "Should & Shouldn't (Advice)", type: "GRAMMAR", slug: "en-a2-should" },
          { title: "At the Pharmacy", type: "CONVERSATION", slug: "en-a2-pharmacy" },
          { title: "Feelings & Emotions", type: "VOCABULARY", slug: "en-a2-feelings" },
          { title: "Unit 5 Review", type: "REVIEW", slug: "en-a2-unit5-review" },
        ],
      },
      {
        title: "Work & Study",
        description: "Talk about jobs, education, skills, write a simple email, and handle a job interview.",
        lessons: [
          { title: "Education & School Life", type: "VOCABULARY", slug: "en-a2-education" },
          { title: "Present Perfect (Experiences)", type: "GRAMMAR", slug: "en-a2-present-perfect" },
          { title: "Writing a Simple Email", type: "CONVERSATION", slug: "en-a2-simple-email" },
          { title: "A Job Interview", type: "CONVERSATION", slug: "en-a2-job-interview" },
          { title: "Unit 6 Review", type: "REVIEW", slug: "en-a2-unit6-review" },
        ],
      },
      {
        title: "Socializing",
        description: "Accept and decline invitations, small talk, comparisons, and describing experiences.",
        lessons: [
          { title: "Invitations & Social Plans", type: "CONVERSATION", slug: "en-a2-invitations" },
          { title: "Comparatives & Superlatives", type: "GRAMMAR", slug: "en-a2-comparatives" },
          { title: "Small Talk & Opinions", type: "CONVERSATION", slug: "en-a2-small-talk" },
          { title: "Describing Experiences", type: "CONVERSATION", slug: "en-a2-experiences" },
          { title: "Unit 7 Review", type: "REVIEW", slug: "en-a2-unit7-review" },
        ],
      },
      {
        title: "Everyday Situations",
        description: "Handle complaints, deal with problems, technology basics, and a final comprehensive review.",
        lessons: [
          { title: "Technology & Gadgets", type: "VOCABULARY", slug: "en-a2-technology" },
          { title: "Making a Complaint", type: "CONVERSATION", slug: "en-a2-complaint" },
          { title: "Prepositions of Time & Movement", type: "GRAMMAR", slug: "en-a2-prepositions" },
          { title: "Dealing with Problems", type: "CONVERSATION", slug: "en-a2-dealing-problems" },
          { title: "Final Review & Celebration", type: "REVIEW", slug: "en-a2-final-review" },
        ],
      },
    ],
  },
  B1: {
    course: {
      title: "English B1 - Intermediate",
      slug: "english-b1",
      description:
        "Express opinions, discuss ideas, handle complex situations, and communicate fluently in work, travel, and social contexts.",
      level: "B1",
      estimated_hours: 100,
      total_lessons: 40,
    },
    units: [
      {
        title: "Expressing Opinions",
        description: "Share views, agree/disagree politely, use modals for speculation, and participate in discussions.",
        lessons: [
          { title: "Agreeing & Disagreeing", type: "CONVERSATION", slug: "en-b1-agree-disagree" },
          { title: "Modal Verbs (Must, Might, Could)", type: "GRAMMAR", slug: "en-b1-modals" },
          { title: "Giving Opinions & Reasons", type: "CONVERSATION", slug: "en-b1-opinions" },
          { title: "Discussing Current Events", type: "CONVERSATION", slug: "en-b1-current-events" },
          { title: "Unit 1 Review", type: "REVIEW", slug: "en-b1-unit1-review" },
        ],
      },
      {
        title: "Narrative & Storytelling",
        description: "Tell stories, use past continuous, sequence events, and describe memorable experiences.",
        lessons: [
          { title: "Past Continuous vs Past Simple", type: "GRAMMAR", slug: "en-b1-past-continuous" },
          { title: "Linking Words & Sequencing", type: "GRAMMAR", slug: "en-b1-linking-words" },
          { title: "Telling a Story", type: "CONVERSATION", slug: "en-b1-telling-story" },
          { title: "Memorable Experiences", type: "CONVERSATION", slug: "en-b1-memorable" },
          { title: "Unit 2 Review", type: "REVIEW", slug: "en-b1-unit2-review" },
        ],
      },
      {
        title: "Work & Career",
        description: "Professional English: meetings, presentations, emails, and career vocabulary.",
        lessons: [
          { title: "Professional Vocabulary", type: "VOCABULARY", slug: "en-b1-professional-vocab" },
          { title: "Passive Voice", type: "GRAMMAR", slug: "en-b1-passive" },
          { title: "Business Emails & Messages", type: "CONVERSATION", slug: "en-b1-business-emails" },
          { title: "Meetings & Presentations", type: "CONVERSATION", slug: "en-b1-meetings" },
          { title: "Unit 3 Review", type: "REVIEW", slug: "en-b1-unit3-review" },
        ],
      },
      {
        title: "Conditionals & Hypotheticals",
        description: "First and second conditionals, wishes, regrets, and hypothetical situations.",
        lessons: [
          { title: "First Conditional (Real Possibilities)", type: "GRAMMAR", slug: "en-b1-first-conditional" },
          { title: "Second Conditional (Imaginary)", type: "GRAMMAR", slug: "en-b1-second-conditional" },
          { title: "Wishes & Regrets", type: "GRAMMAR", slug: "en-b1-wishes-regrets" },
          { title: "What Would You Do?", type: "CONVERSATION", slug: "en-b1-what-would" },
          { title: "Unit 4 Review", type: "REVIEW", slug: "en-b1-unit4-review" },
        ],
      },
      {
        title: "Media & Communication",
        description: "Discuss media, reported speech, news, social media, and information sources.",
        lessons: [
          { title: "Media Vocabulary", type: "VOCABULARY", slug: "en-b1-media-vocab" },
          { title: "Reported Speech", type: "GRAMMAR", slug: "en-b1-reported-speech" },
          { title: "Discussing News & Articles", type: "CONVERSATION", slug: "en-b1-news" },
          { title: "Social Media & Digital Life", type: "CONVERSATION", slug: "en-b1-social-media" },
          { title: "Unit 5 Review", type: "REVIEW", slug: "en-b1-unit5-review" },
        ],
      },
      {
        title: "Environment & Society",
        description: "Discuss environmental issues, social topics, use relative clauses, and express concern.",
        lessons: [
          { title: "Environment & Nature", type: "VOCABULARY", slug: "en-b1-environment" },
          { title: "Relative Clauses (Who, Which, That)", type: "GRAMMAR", slug: "en-b1-relative-clauses" },
          { title: "Social Issues & Solutions", type: "CONVERSATION", slug: "en-b1-social-issues" },
          { title: "Expressing Concern & Suggestions", type: "CONVERSATION", slug: "en-b1-concern" },
          { title: "Unit 6 Review", type: "REVIEW", slug: "en-b1-unit6-review" },
        ],
      },
      {
        title: "Culture & Travel",
        description: "Cultural awareness, travel stories, describing places, and cross-cultural communication.",
        lessons: [
          { title: "Describing Places & Scenery", type: "VOCABULARY", slug: "en-b1-describing-places" },
          { title: "Used To & Would (Past Habits)", type: "GRAMMAR", slug: "en-b1-used-to" },
          { title: "Cultural Differences", type: "CONVERSATION", slug: "en-b1-cultural-diff" },
          { title: "Travel Stories & Adventures", type: "CONVERSATION", slug: "en-b1-travel-stories" },
          { title: "Unit 7 Review", type: "REVIEW", slug: "en-b1-unit7-review" },
        ],
      },
      {
        title: "Future & Aspirations",
        description: "Talk about goals, plans, future perfect, and reflect on your English learning journey.",
        lessons: [
          { title: "Future Plans & Ambitions", type: "CONVERSATION", slug: "en-b1-ambitions" },
          { title: "Future Forms Review", type: "GRAMMAR", slug: "en-b1-future-forms" },
          { title: "Giving a Short Presentation", type: "CONVERSATION", slug: "en-b1-presentation" },
          { title: "Debate & Discussion Skills", type: "CONVERSATION", slug: "en-b1-debate" },
          { title: "Final Review & Celebration", type: "REVIEW", slug: "en-b1-final-review" },
        ],
      },
    ],
  },
  B2: {
    course: {
      title: "English B2 - Upper Intermediate",
      slug: "english-b2",
      description:
        "Achieve advanced fluency. Handle complex discussions, understand nuance, write effectively, and express yourself with precision.",
      level: "B2",
      estimated_hours: 120,
      total_lessons: 40,
    },
    units: [
      {
        title: "Advanced Grammar Review",
        description: "Master mixed conditionals, perfect tenses, and advanced verb patterns.",
        lessons: [
          { title: "Mixed Conditionals", type: "GRAMMAR", slug: "en-b2-mixed-conditionals" },
          { title: "Perfect Tenses (All Forms)", type: "GRAMMAR", slug: "en-b2-perfect-tenses" },
          { title: "Verb Patterns (Gerunds & Infinitives)", type: "GRAMMAR", slug: "en-b2-verb-patterns" },
          { title: "Advanced Error Correction", type: "GRAMMAR", slug: "en-b2-error-correction" },
          { title: "Unit 1 Review", type: "REVIEW", slug: "en-b2-unit1-review" },
        ],
      },
      {
        title: "Persuasion & Argument",
        description: "Build persuasive arguments, use rhetorical techniques, and write opinion pieces.",
        lessons: [
          { title: "Persuasive Language", type: "VOCABULARY", slug: "en-b2-persuasive-lang" },
          { title: "Inversion for Emphasis", type: "GRAMMAR", slug: "en-b2-inversion" },
          { title: "Constructing an Argument", type: "CONVERSATION", slug: "en-b2-argument" },
          { title: "Formal vs Informal Register", type: "CONVERSATION", slug: "en-b2-register" },
          { title: "Unit 2 Review", type: "REVIEW", slug: "en-b2-unit2-review" },
        ],
      },
      {
        title: "Professional Communication",
        description: "Business negotiations, presentations, formal writing, and workplace dynamics.",
        lessons: [
          { title: "Negotiation Skills", type: "CONVERSATION", slug: "en-b2-negotiation" },
          { title: "Formal Writing Structures", type: "GRAMMAR", slug: "en-b2-formal-writing" },
          { title: "Presenting Complex Ideas", type: "CONVERSATION", slug: "en-b2-complex-ideas" },
          { title: "Workplace Diplomacy", type: "CONVERSATION", slug: "en-b2-diplomacy" },
          { title: "Unit 3 Review", type: "REVIEW", slug: "en-b2-unit3-review" },
        ],
      },
      {
        title: "Idioms & Figurative Language",
        description: "Master common idioms, phrasal verbs, collocations, and figurative expressions.",
        lessons: [
          { title: "Common English Idioms", type: "VOCABULARY", slug: "en-b2-idioms" },
          { title: "Advanced Phrasal Verbs", type: "VOCABULARY", slug: "en-b2-phrasal-verbs" },
          { title: "Collocations & Word Partnerships", type: "VOCABULARY", slug: "en-b2-collocations" },
          { title: "Figurative Language & Metaphors", type: "VOCABULARY", slug: "en-b2-figurative" },
          { title: "Unit 4 Review", type: "REVIEW", slug: "en-b2-unit4-review" },
        ],
      },
      {
        title: "Critical Thinking",
        description: "Analyze texts, evaluate arguments, identify bias, and think critically in English.",
        lessons: [
          { title: "Analyzing Written Texts", type: "CONVERSATION", slug: "en-b2-analyze-texts" },
          { title: "Cleft Sentences & Emphasis", type: "GRAMMAR", slug: "en-b2-cleft" },
          { title: "Identifying Bias & Tone", type: "CONVERSATION", slug: "en-b2-bias-tone" },
          { title: "Summarizing & Paraphrasing", type: "CONVERSATION", slug: "en-b2-summarize" },
          { title: "Unit 5 Review", type: "REVIEW", slug: "en-b2-unit5-review" },
        ],
      },
      {
        title: "Science & Innovation",
        description: "Discuss scientific topics, technology trends, and use academic vocabulary.",
        lessons: [
          { title: "Science & Technology Vocabulary", type: "VOCABULARY", slug: "en-b2-science-vocab" },
          { title: "Passive Reporting Structures", type: "GRAMMAR", slug: "en-b2-passive-reporting" },
          { title: "Discussing Innovation", type: "CONVERSATION", slug: "en-b2-innovation" },
          { title: "Ethical Dilemmas", type: "CONVERSATION", slug: "en-b2-ethical" },
          { title: "Unit 6 Review", type: "REVIEW", slug: "en-b2-unit6-review" },
        ],
      },
      {
        title: "Arts & Literature",
        description: "Discuss art, literature, film, and express nuanced aesthetic opinions.",
        lessons: [
          { title: "Arts & Literature Vocabulary", type: "VOCABULARY", slug: "en-b2-arts-vocab" },
          { title: "Narrative Tenses (Advanced)", type: "GRAMMAR", slug: "en-b2-narrative-tenses" },
          { title: "Film & Book Reviews", type: "CONVERSATION", slug: "en-b2-reviews" },
          { title: "Expressing Nuanced Opinions", type: "CONVERSATION", slug: "en-b2-nuanced" },
          { title: "Unit 7 Review", type: "REVIEW", slug: "en-b2-unit7-review" },
        ],
      },
      {
        title: "Global Issues & Mastery",
        description: "Tackle global challenges, express complex views, and celebrate your English mastery.",
        lessons: [
          { title: "Global Challenges", type: "VOCABULARY", slug: "en-b2-global-challenges" },
          { title: "Discourse Markers & Cohesion", type: "GRAMMAR", slug: "en-b2-discourse" },
          { title: "Panel Discussion Simulation", type: "CONVERSATION", slug: "en-b2-panel" },
          { title: "Formal Speech & Presentation", type: "CONVERSATION", slug: "en-b2-formal-speech" },
          { title: "Final Review & Celebration", type: "REVIEW", slug: "en-b2-final-review" },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════
// OpenAI content generation (same as A1 script but level-aware)
// ═══════════════════════════════════════════════════════════════════

function buildContentPrompt(lesson, unitTitle, level) {
  const levelGuide = {
    A2: "elementary (past simple, future with going to, common connectors, everyday topics)",
    B1: "intermediate (conditionals, passive, reported speech, abstract topics, opinion phrases)",
    B2: "upper-intermediate (mixed conditionals, subjunctive, idiomatic language, nuanced discussion, academic register)",
  };

  return `You are an expert English language teacher creating content for a self-study app.
Generate a complete lesson in JSON for: "${lesson.title}" (Unit: ${unitTitle}, Level: ${level}, Type: ${lesson.type}).

The audience is diverse — do NOT assume any particular native language. Keep all explanations in English. For ${level}: use ${levelGuide[level]} level language.

Return ONLY valid JSON with this structure:
{
  "introduction": {
    "text": "2-3 sentence overview of what the student will learn",
    "culturalNote": "Optional: an interesting English/global culture fact related to this topic (1-2 sentences)"
  },
  "vocabulary": [
    {
      "term": "word or phrase",
      "definition": "simple English definition (no translation, use context/synonyms)",
      "pronunciation": "phonetic guide",
      "partOfSpeech": "noun/verb/phrase/adjective/etc",
      "exampleSentence": {
        "original": "Example sentence using the word",
        "simplified": "Simpler rephrasing or context clue"
      },
      "tip": "A short memory trick or usage note"
    }
  ],
  "grammar": [
    {
      "title": "Grammar point title",
      "explanation": "Clear explanation (3-5 sentences for ${level})",
      "table": {
        "headers": ["Column1", "Column2", ...],
        "rows": [["row1col1", "row1col2"], ...]
      },
      "examples": [
        {
          "original": "Example sentence",
          "breakdown": "Structural explanation",
          "simplified": "Meaning in simpler words"
        }
      ],
      "commonMistakes": ["Mistake 1 with correction", "Mistake 2 with correction"]
    }
  ],
  "dialogue": {
    "title": "Short situational title",
    "context": "Where/when this conversation happens",
    "speakers": ["Speaker A name/role", "Speaker B name/role"],
    "lines": [
      { "speaker": 0, "text": "Line of dialogue", "note": "optional short note" },
      { "speaker": 1, "text": "Response", "note": "" }
    ]
  },
  "culture": {
    "title": "Cultural insight title",
    "text": "2-3 sentences about English-speaking culture or global usage related to this topic",
    "funFact": "A fun/surprising fact"
  },
  "summary": {
    "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
    "nextSteps": "What to practice or what comes next"
  }
}

Requirements:
- Vocabulary: 6-10 items for VOCABULARY type, 4-6 for others
- Grammar: 1-2 points (more for GRAMMAR type)
- Dialogue: 8-12 lines, realistic ${level}-level conversation
- For REVIEW type: consolidation — mix vocab from the unit, include a longer dialogue
- No translations into other languages — definitions use English, context, or synonyms
- Language complexity must match ${level} level`;
}

function buildExercisesPrompt(lesson, unitTitle, content, level) {
  const vocabTerms = (content.vocabulary || []).map((v) => v.term).join(", ");
  return `You are an English exercise designer. Create 10-12 exercises for:
Title: "${lesson.title}" (Unit: ${unitTitle}, Level: ${level}, Type: ${lesson.type})
Key vocabulary: ${vocabTerms}

Return ONLY valid JSON array:
[
  {
    "exercise_type": "MULTIPLE_CHOICE" | "FILL_BLANK" | "REORDER" | "TRANSLATION" | "LISTENING" | "SPEAK",
    "question": "The question/instruction text",
    "content": {
      // MULTIPLE_CHOICE: { "options": [...], "correctIndex": 0 }
      // FILL_BLANK: { "sentence": "I ___ ...", "correctAnswer": "...", "acceptableAnswers": [...], "options": [...] }
      // REORDER: { "words": [...], "correctOrder": [...], "meaning": "..." }
      // TRANSLATION: { "prompt": "Rephrase: '...'", "correctAnswer": "...", "acceptableAnswers": [...] }
      // LISTENING: { "ttsText": "...", "ttsLang": "en-US", "options": [...], "correctIndex": 0 }
      // SPEAK: { "targetText": "...", "context": "...", "acceptableVariants": [...] }
    },
    "explanation": "Why this is correct (1-2 sentences)",
    "hint": "A small hint",
    "difficulty": "EASY" | "MEDIUM" | "HARD",
    "xp_reward": 3-5
  }
]

Requirements:
- Mix: at least 2 MULTIPLE_CHOICE, 2 FILL_BLANK, 1 REORDER, 1 LISTENING, 1 SPEAK
- Difficulty: 3 EASY, 4 MEDIUM, 3-5 HARD (${level} level)
- TRANSLATION = rephrase in different English (NOT translate to another language)
- Complexity must match ${level}`;
}

async function generateContent(lesson, unitTitle, level) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: buildContentPrompt(lesson, unitTitle, level) }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4000,
  });
  return JSON.parse(res.choices[0].message.content);
}

async function generateExercises(lesson, unitTitle, content, level) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: buildExercisesPrompt(lesson, unitTitle, content, level) }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4000,
  });
  const parsed = JSON.parse(res.choices[0].message.content);
  return Array.isArray(parsed) ? parsed : parsed.exercises || parsed.items || [];
}

// ═══════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const def = COURSES[LEVEL_ARG];
  console.log(`\n🇬🇧 English ${LEVEL_ARG} Course Generator ${DRY_RUN ? "(DRY RUN)" : ""}\n`);

  // 1. Create or get course
  let courseId;
  const { data: existing } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", def.course.slug)
    .single();

  if (existing) {
    courseId = existing.id;
    console.log(`📚 Course exists: ${courseId}`);
  } else if (!DRY_RUN) {
    const { data: newC, error } = await supabase
      .from("courses")
      .insert({
        ...def.course,
        language_id: ENGLISH_LANGUAGE_ID,
        course_type: "CORE",
        is_premium: true,
        is_published: true,
        order_index: { A2: 2, B1: 3, B2: 4 }[LEVEL_ARG],
      })
      .select("id")
      .single();
    if (error) throw new Error(`Course insert: ${error.message}`);
    courseId = newC.id;
    console.log(`📚 Created course: ${courseId}`);
  } else {
    courseId = "dry-run";
    console.log(`📚 Would create: ${def.course.title}`);
  }

  // 2. Process units
  for (let ui = 0; ui < def.units.length; ui++) {
    const unit = def.units[ui];
    const unitOrder = ui + 1;
    if (ONLY_UNIT && String(unitOrder) !== ONLY_UNIT) continue;

    console.log(`\n━━━ Unit ${unitOrder}: ${unit.title} ━━━`);

    let unitId;
    const { data: eu } = await supabase
      .from("units")
      .select("id")
      .eq("course_id", courseId)
      .eq("order_index", unitOrder)
      .single();

    if (eu) {
      unitId = eu.id;
      console.log(`  📁 Unit exists: ${unitId}`);
    } else if (!DRY_RUN) {
      const { data: nu, error } = await supabase
        .from("units")
        .insert({
          course_id: courseId,
          title: unit.title,
          description: unit.description,
          order_index: unitOrder,
          is_premium: unitOrder > 1,
        })
        .select("id")
        .single();
      if (error) throw new Error(`Unit insert: ${error.message}`);
      unitId = nu.id;
      console.log(`  📁 Created unit: ${unitId}`);
    } else {
      unitId = `dry-${unitOrder}`;
      console.log(`  📁 Would create: ${unit.title}`);
    }

    // 3. Lessons
    for (let li = 0; li < unit.lessons.length; li++) {
      const lesson = unit.lessons[li];
      const lessonOrder = li + 1;

      const { data: el } = await supabase
        .from("lessons")
        .select("id")
        .eq("slug", lesson.slug)
        .single();

      if (el) {
        console.log(`    ✅ ${lesson.title} (exists)`);
        continue;
      }

      console.log(`    🔄 Generating: ${lesson.title}...`);

      const content = await generateContent(lesson, unit.title, LEVEL_ARG);
      console.log(`       📝 Content OK (${(content.vocabulary || []).length} vocab)`);

      const exercises = await generateExercises(lesson, unit.title, content, LEVEL_ARG);
      console.log(`       🎯 Exercises OK (${exercises.length})`);

      if (DRY_RUN) {
        console.log(`       [DRY RUN] Would insert`);
        continue;
      }

      const { data: nl, error: le } = await supabase
        .from("lessons")
        .insert({
          unit_id: unitId,
          title: lesson.title,
          slug: lesson.slug,
          description: content.introduction?.text || "",
          lesson_type: lesson.type,
          content,
          estimated_minutes: { A2: 18, B1: 20, B2: 25 }[LEVEL_ARG],
          xp_reward: { A2: 25, B1: 30, B2: 35 }[LEVEL_ARG],
          order_index: lessonOrder,
          is_premium: unitOrder > 1 || lessonOrder > 2,
          is_active: true,
          content_version: "1.0",
        })
        .select("id")
        .single();

      if (le) {
        console.error(`       ❌ ${le.message}`);
        continue;
      }

      const rows = exercises.map((ex, idx) => ({
        lesson_id: nl.id,
        exercise_type: ex.exercise_type,
        question: ex.question,
        content: ex.content,
        explanation: ex.explanation || "",
        hint: ex.hint || "",
        difficulty: ex.difficulty || "MEDIUM",
        xp_reward: ex.xp_reward || 4,
        order_index: idx + 1,
        is_active: true,
      }));

      const { error: ee } = await supabase.from("exercises").insert(rows);
      if (ee) console.error(`       ⚠️  Exercises: ${ee.message}`);

      console.log(`    ✅ ${lesson.title} — saved (${exercises.length} exercises)`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log("\n🎉 Done!\n");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
