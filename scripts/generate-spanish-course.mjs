#!/usr/bin/env node
// scripts/generate-spanish-course.mjs
// Generates Spanish A1–B2 self-learning courses (Spanish target, English
// scaffolding/translations) using OpenAI.
//
// By default it writes generated lessons to local JSON files for REVIEW and
// does NOT touch the database:
//   node --env-file=.env.local scripts/generate-spanish-course.mjs --level=a1 [--unit=N]
//   → writes scripts/output/spanish/a1/<slug>.json + _manifest.json
//
// Once reviewed, publish into Supabase (find/creates the `es` language row,
// inserts course/units/lessons/exercises, is_published=true):
//   node --env-file=.env.local scripts/generate-spanish-course.mjs --level=a1 --publish
//
// Flags:
//   --level=a1|a2|b1|b2   (required)
//   --unit=N              only generate unit N
//   --publish             insert into Supabase instead of writing local files
//   --from-files          (with --publish) publish previously-generated local
//                         JSON instead of calling OpenAI again

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";

const PUBLISH = process.argv.includes("--publish");
const FROM_FILES = process.argv.includes("--from-files");
// --draft inserts the course with is_published=false so it stays off the public
// language picker while we test it directly at /learn/spanish/<level>.
const DRAFT = process.argv.includes("--draft");
const LEVEL_ARG = process.argv.find((a) => a.startsWith("--level="))?.split("=")[1]?.toUpperCase();
const ONLY_UNIT = process.argv.find((a) => a.startsWith("--unit="))?.split("=")[1];

if (!LEVEL_ARG || !["A1", "A2", "B1", "B2"].includes(LEVEL_ARG)) {
  console.error("Usage: --level=a1|a2|b1|b2 [--unit=N] [--publish] [--from-files]");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OUT_DIR = path.join(process.cwd(), "scripts", "output", "spanish", LEVEL_ARG.toLowerCase());

// ═══════════════════════════════════════════════════════════════════
// Course definitions per level (Spanish for English speakers, CEFR)
// 8 units × 5 lessons each. Lesson types: GRAMMAR | VOCABULARY |
// CONVERSATION | REVIEW.
// ═══════════════════════════════════════════════════════════════════

const COURSES = {
  A1: {
    course: {
      title: "Spanish A1 - Beginner",
      slug: "spanish-a1",
      description:
        "Start your Spanish journey! Greetings, the alphabet, numbers, the present tense, food, shopping, and everyday expressions to get you speaking from day one.",
      level: "A1",
      estimated_hours: 60,
      total_lessons: 40,
    },
    units: [
      {
        title: "First Words & Greetings",
        description: "Greetings, introductions, the Spanish alphabet, numbers 0–20, days and months.",
        lessons: [
          { title: "Hello & Goodbye (Saludos)", type: "CONVERSATION", slug: "es-a1-greetings" },
          { title: "The Spanish Alphabet & Sounds", type: "VOCABULARY", slug: "es-a1-alphabet" },
          { title: "Introducing Yourself", type: "CONVERSATION", slug: "es-a1-introductions" },
          { title: "Numbers 0–20", type: "VOCABULARY", slug: "es-a1-numbers" },
          { title: "Unit 1 Review", type: "REVIEW", slug: "es-a1-unit1-review" },
        ],
      },
      {
        title: "People & Family",
        description: "Family members, descriptions, ser vs estar, and possessive adjectives.",
        lessons: [
          { title: "My Family (La Familia)", type: "VOCABULARY", slug: "es-a1-family" },
          { title: "Ser vs Estar (To Be)", type: "GRAMMAR", slug: "es-a1-ser-estar" },
          { title: "Describing People", type: "VOCABULARY", slug: "es-a1-describing-people" },
          { title: "Possessives (Mi, Tu, Su)", type: "GRAMMAR", slug: "es-a1-possessives" },
          { title: "Unit 2 Review", type: "REVIEW", slug: "es-a1-unit2-review" },
        ],
      },
      {
        title: "Daily Life & Routines",
        description: "Present-tense regular verbs, daily routine, telling the time, and reflexive verbs.",
        lessons: [
          { title: "Present Tense — Regular Verbs", type: "GRAMMAR", slug: "es-a1-present-regular" },
          { title: "My Daily Routine", type: "CONVERSATION", slug: "es-a1-daily-routine" },
          { title: "Telling the Time", type: "VOCABULARY", slug: "es-a1-telling-time" },
          { title: "Reflexive Verbs (Levantarse)", type: "GRAMMAR", slug: "es-a1-reflexives" },
          { title: "Unit 3 Review", type: "REVIEW", slug: "es-a1-unit3-review" },
        ],
      },
      {
        title: "Food & Dining",
        description: "Food vocabulary, ordering in a café, the verb gustar, and quantities.",
        lessons: [
          { title: "Food & Drinks (La Comida)", type: "VOCABULARY", slug: "es-a1-food" },
          { title: "I Like It — Gustar", type: "GRAMMAR", slug: "es-a1-gustar" },
          { title: "Ordering at a Café", type: "CONVERSATION", slug: "es-a1-ordering-cafe" },
          { title: "Quantities & Containers", type: "VOCABULARY", slug: "es-a1-quantities" },
          { title: "Unit 4 Review", type: "REVIEW", slug: "es-a1-unit4-review" },
        ],
      },
      {
        title: "Shopping & Around Town",
        description: "Shopping, places in town, asking for directions, prices and bigger numbers.",
        lessons: [
          { title: "Places in Town", type: "VOCABULARY", slug: "es-a1-places-town" },
          { title: "Asking for Directions", type: "CONVERSATION", slug: "es-a1-directions" },
          { title: "Numbers 21–1000 & Prices", type: "VOCABULARY", slug: "es-a1-numbers-prices" },
          { title: "At the Shop", type: "CONVERSATION", slug: "es-a1-at-the-shop" },
          { title: "Unit 5 Review", type: "REVIEW", slug: "es-a1-unit5-review" },
        ],
      },
      {
        title: "Home & Everyday Objects",
        description: "The house, prepositions of place, 'hay' (there is/are), and colours.",
        lessons: [
          { title: "My Home (La Casa)", type: "VOCABULARY", slug: "es-a1-home" },
          { title: "There Is / There Are (Hay)", type: "GRAMMAR", slug: "es-a1-hay" },
          { title: "Prepositions of Place", type: "GRAMMAR", slug: "es-a1-prepositions" },
          { title: "Colours & Everyday Objects", type: "VOCABULARY", slug: "es-a1-colours" },
          { title: "Unit 6 Review", type: "REVIEW", slug: "es-a1-unit6-review" },
        ],
      },
      {
        title: "Free Time & Hobbies",
        description: "Hobbies, common irregular verbs (ir, hacer, tener), and frequency expressions.",
        lessons: [
          { title: "Hobbies & Free Time", type: "VOCABULARY", slug: "es-a1-hobbies" },
          { title: "Irregular Verbs — Ir, Hacer, Tener", type: "GRAMMAR", slug: "es-a1-irregular-verbs" },
          { title: "How Often? (Frequency)", type: "GRAMMAR", slug: "es-a1-frequency" },
          { title: "What Do You Do for Fun?", type: "CONVERSATION", slug: "es-a1-fun-conversation" },
          { title: "Unit 7 Review", type: "REVIEW", slug: "es-a1-unit7-review" },
        ],
      },
      {
        title: "Travel & Weather",
        description: "Travel basics, the weather, the near future (ir a + infinitive), and a final review.",
        lessons: [
          { title: "Travel & Transport", type: "VOCABULARY", slug: "es-a1-travel" },
          { title: "The Weather (El Tiempo)", type: "VOCABULARY", slug: "es-a1-weather" },
          { title: "Near Future — Ir a + Infinitive", type: "GRAMMAR", slug: "es-a1-near-future" },
          { title: "Planning a Trip", type: "CONVERSATION", slug: "es-a1-planning-trip" },
          { title: "Final Review & Celebration", type: "REVIEW", slug: "es-a1-final-review" },
        ],
      },
    ],
  },

  A2: {
    course: {
      title: "Spanish A2 - Elementary",
      slug: "spanish-a2",
      description:
        "Build on the basics! Talk about the past, make future plans, handle health, work and city situations, and communicate with growing confidence.",
      level: "A2",
      estimated_hours: 80,
      total_lessons: 40,
    },
    units: [
      {
        title: "Talking About the Past",
        description: "The preterite of regular verbs, weekends, and past time expressions.",
        lessons: [
          { title: "Preterite — Regular Verbs", type: "GRAMMAR", slug: "es-a2-preterite-regular" },
          { title: "My Last Weekend", type: "CONVERSATION", slug: "es-a2-last-weekend" },
          { title: "Past Time Expressions", type: "VOCABULARY", slug: "es-a2-past-expressions" },
          { title: "What Did You Do Yesterday?", type: "CONVERSATION", slug: "es-a2-yesterday" },
          { title: "Unit 1 Review", type: "REVIEW", slug: "es-a2-unit1-review" },
        ],
      },
      {
        title: "Stories & Memories",
        description: "Irregular preterites, the imperfect for descriptions, and childhood memories.",
        lessons: [
          { title: "Preterite — Irregular Verbs", type: "GRAMMAR", slug: "es-a2-preterite-irregular" },
          { title: "The Imperfect (Imperfecto)", type: "GRAMMAR", slug: "es-a2-imperfect" },
          { title: "Childhood Memories", type: "CONVERSATION", slug: "es-a2-childhood" },
          { title: "Telling a Simple Story", type: "CONVERSATION", slug: "es-a2-telling-story" },
          { title: "Unit 2 Review", type: "REVIEW", slug: "es-a2-unit2-review" },
        ],
      },
      {
        title: "Making Plans & Future",
        description: "The simple future, making arrangements, and talking about intentions.",
        lessons: [
          { title: "The Simple Future Tense", type: "GRAMMAR", slug: "es-a2-simple-future" },
          { title: "Making Arrangements", type: "CONVERSATION", slug: "es-a2-arrangements" },
          { title: "Holiday Planning", type: "CONVERSATION", slug: "es-a2-holiday-planning" },
          { title: "Intentions & Goals", type: "VOCABULARY", slug: "es-a2-intentions" },
          { title: "Unit 3 Review", type: "REVIEW", slug: "es-a2-unit3-review" },
        ],
      },
      {
        title: "Health & Body",
        description: "The body, symptoms, visiting the doctor, and giving advice with deber / tener que.",
        lessons: [
          { title: "The Body & Health", type: "VOCABULARY", slug: "es-a2-body-health" },
          { title: "Giving Advice — Deber & Tener Que", type: "GRAMMAR", slug: "es-a2-advice" },
          { title: "At the Doctor", type: "CONVERSATION", slug: "es-a2-doctor" },
          { title: "Feelings & Emotions", type: "VOCABULARY", slug: "es-a2-feelings" },
          { title: "Unit 4 Review", type: "REVIEW", slug: "es-a2-unit4-review" },
        ],
      },
      {
        title: "Work & Studies",
        description: "Jobs, education, describing your work routine, and writing a simple email.",
        lessons: [
          { title: "Jobs & Professions", type: "VOCABULARY", slug: "es-a2-jobs" },
          { title: "Education & School Life", type: "VOCABULARY", slug: "es-a2-education" },
          { title: "Writing a Simple Email", type: "CONVERSATION", slug: "es-a2-simple-email" },
          { title: "A Job Interview", type: "CONVERSATION", slug: "es-a2-job-interview" },
          { title: "Unit 5 Review", type: "REVIEW", slug: "es-a2-unit5-review" },
        ],
      },
      {
        title: "City & Services",
        description: "Bank, post office, formal 'usted', making requests and complaints.",
        lessons: [
          { title: "City Services & Errands", type: "VOCABULARY", slug: "es-a2-services" },
          { title: "Formal You (Usted)", type: "GRAMMAR", slug: "es-a2-usted" },
          { title: "Making a Complaint", type: "CONVERSATION", slug: "es-a2-complaint" },
          { title: "Polite Requests", type: "CONVERSATION", slug: "es-a2-polite-requests" },
          { title: "Unit 6 Review", type: "REVIEW", slug: "es-a2-unit6-review" },
        ],
      },
      {
        title: "Comparisons & Opinions",
        description: "Comparatives and superlatives, expressing opinions, and small talk.",
        lessons: [
          { title: "Comparatives & Superlatives", type: "GRAMMAR", slug: "es-a2-comparatives" },
          { title: "Giving Opinions", type: "CONVERSATION", slug: "es-a2-opinions" },
          { title: "Small Talk", type: "CONVERSATION", slug: "es-a2-small-talk" },
          { title: "Describing Experiences", type: "CONVERSATION", slug: "es-a2-experiences" },
          { title: "Unit 7 Review", type: "REVIEW", slug: "es-a2-unit7-review" },
        ],
      },
      {
        title: "Everyday Situations",
        description: "Technology, dealing with problems, prepositions, and a comprehensive review.",
        lessons: [
          { title: "Technology & Gadgets", type: "VOCABULARY", slug: "es-a2-technology" },
          { title: "Dealing with Problems", type: "CONVERSATION", slug: "es-a2-problems" },
          { title: "Prepositions (Por & Para)", type: "GRAMMAR", slug: "es-a2-por-para" },
          { title: "Everyday Negotiations", type: "CONVERSATION", slug: "es-a2-negotiations" },
          { title: "Final Review & Celebration", type: "REVIEW", slug: "es-a2-final-review" },
        ],
      },
    ],
  },

  B1: {
    course: {
      title: "Spanish B1 - Intermediate",
      slug: "spanish-b1",
      description:
        "Express opinions, narrate in the past, use the subjunctive and conditionals, and handle work, media and travel situations with fluency.",
      level: "B1",
      estimated_hours: 100,
      total_lessons: 40,
    },
    units: [
      {
        title: "Expressing Opinions",
        description: "The present subjunctive for opinions and wishes, agreeing and disagreeing.",
        lessons: [
          { title: "Present Subjunctive — Introduction", type: "GRAMMAR", slug: "es-b1-subjunctive-intro" },
          { title: "Agreeing & Disagreeing", type: "CONVERSATION", slug: "es-b1-agree-disagree" },
          { title: "Giving Opinions & Reasons", type: "CONVERSATION", slug: "es-b1-opinions" },
          { title: "Discussing Current Events", type: "CONVERSATION", slug: "es-b1-current-events" },
          { title: "Unit 1 Review", type: "REVIEW", slug: "es-b1-unit1-review" },
        ],
      },
      {
        title: "Narrating the Past",
        description: "Preterite vs imperfect mastery, connectors, and storytelling.",
        lessons: [
          { title: "Preterite vs Imperfect", type: "GRAMMAR", slug: "es-b1-preterite-imperfect" },
          { title: "Connectors & Sequencing", type: "GRAMMAR", slug: "es-b1-connectors" },
          { title: "Telling a Story", type: "CONVERSATION", slug: "es-b1-telling-story" },
          { title: "Memorable Experiences", type: "CONVERSATION", slug: "es-b1-memorable" },
          { title: "Unit 2 Review", type: "REVIEW", slug: "es-b1-unit2-review" },
        ],
      },
      {
        title: "Work & Career",
        description: "Professional vocabulary, the passive with 'se', business emails and meetings.",
        lessons: [
          { title: "Professional Vocabulary", type: "VOCABULARY", slug: "es-b1-professional-vocab" },
          { title: "The Passive Se", type: "GRAMMAR", slug: "es-b1-passive-se" },
          { title: "Business Emails & Messages", type: "CONVERSATION", slug: "es-b1-business-emails" },
          { title: "Meetings & Presentations", type: "CONVERSATION", slug: "es-b1-meetings" },
          { title: "Unit 3 Review", type: "REVIEW", slug: "es-b1-unit3-review" },
        ],
      },
      {
        title: "Conditionals & Wishes",
        description: "The conditional tense, real 'si' clauses, and wishes with ojalá + subjunctive.",
        lessons: [
          { title: "The Conditional Tense", type: "GRAMMAR", slug: "es-b1-conditional" },
          { title: "Si Clauses (Real Conditions)", type: "GRAMMAR", slug: "es-b1-si-clauses" },
          { title: "Wishes & Hopes — Ojalá", type: "GRAMMAR", slug: "es-b1-ojala" },
          { title: "What Would You Do?", type: "CONVERSATION", slug: "es-b1-what-would" },
          { title: "Unit 4 Review", type: "REVIEW", slug: "es-b1-unit4-review" },
        ],
      },
      {
        title: "Media & Communication",
        description: "Reported speech, discussing news, and social media in Spanish.",
        lessons: [
          { title: "Media Vocabulary", type: "VOCABULARY", slug: "es-b1-media-vocab" },
          { title: "Reported Speech", type: "GRAMMAR", slug: "es-b1-reported-speech" },
          { title: "Discussing News & Articles", type: "CONVERSATION", slug: "es-b1-news" },
          { title: "Social Media & Digital Life", type: "CONVERSATION", slug: "es-b1-social-media" },
          { title: "Unit 5 Review", type: "REVIEW", slug: "es-b1-unit5-review" },
        ],
      },
      {
        title: "Environment & Society",
        description: "Relative clauses, social issues, and talking about the environment.",
        lessons: [
          { title: "Environment & Nature", type: "VOCABULARY", slug: "es-b1-environment" },
          { title: "Relative Clauses (Que, Quien, Cuyo)", type: "GRAMMAR", slug: "es-b1-relative-clauses" },
          { title: "Social Issues & Solutions", type: "CONVERSATION", slug: "es-b1-social-issues" },
          { title: "Expressing Concern & Suggestions", type: "CONVERSATION", slug: "es-b1-concern" },
          { title: "Unit 6 Review", type: "REVIEW", slug: "es-b1-unit6-review" },
        ],
      },
      {
        title: "Culture & Travel",
        description: "Describing places, past habits with soler, and cultural differences.",
        lessons: [
          { title: "Describing Places & Scenery", type: "VOCABULARY", slug: "es-b1-describing-places" },
          { title: "Past Habits — Soler & Imperfect", type: "GRAMMAR", slug: "es-b1-past-habits" },
          { title: "Cultural Differences", type: "CONVERSATION", slug: "es-b1-cultural-diff" },
          { title: "Travel Stories & Adventures", type: "CONVERSATION", slug: "es-b1-travel-stories" },
          { title: "Unit 7 Review", type: "REVIEW", slug: "es-b1-unit7-review" },
        ],
      },
      {
        title: "Future & Aspirations",
        description: "Talk about goals, give a short presentation, and develop discussion skills.",
        lessons: [
          { title: "Future Plans & Ambitions", type: "CONVERSATION", slug: "es-b1-ambitions" },
          { title: "Future & Conditional Review", type: "GRAMMAR", slug: "es-b1-future-review" },
          { title: "Giving a Short Presentation", type: "CONVERSATION", slug: "es-b1-presentation" },
          { title: "Debate & Discussion Skills", type: "CONVERSATION", slug: "es-b1-debate" },
          { title: "Final Review & Celebration", type: "REVIEW", slug: "es-b1-final-review" },
        ],
      },
    ],
  },

  B2: {
    course: {
      title: "Spanish B2 - Upper Intermediate",
      slug: "spanish-b2",
      description:
        "Achieve advanced fluency. Master the subjunctive, handle complex discussions, idioms and nuance, and express yourself with precision.",
      level: "B2",
      estimated_hours: 120,
      total_lessons: 40,
    },
    units: [
      {
        title: "Advanced Grammar Review",
        description: "The subjunctive across all its uses, perfect tenses, and complex verb patterns.",
        lessons: [
          { title: "Subjunctive — All Uses", type: "GRAMMAR", slug: "es-b2-subjunctive-all" },
          { title: "Perfect Tenses (Compound)", type: "GRAMMAR", slug: "es-b2-perfect-tenses" },
          { title: "Imperfect Subjunctive", type: "GRAMMAR", slug: "es-b2-imperfect-subjunctive" },
          { title: "Advanced Error Correction", type: "GRAMMAR", slug: "es-b2-error-correction" },
          { title: "Unit 1 Review", type: "REVIEW", slug: "es-b2-unit1-review" },
        ],
      },
      {
        title: "Persuasion & Argument",
        description: "Persuasive language, emphasis, and formal vs informal register.",
        lessons: [
          { title: "Persuasive Language", type: "VOCABULARY", slug: "es-b2-persuasive-lang" },
          { title: "Emphasis & Word Order", type: "GRAMMAR", slug: "es-b2-emphasis" },
          { title: "Constructing an Argument", type: "CONVERSATION", slug: "es-b2-argument" },
          { title: "Formal vs Informal Register", type: "CONVERSATION", slug: "es-b2-register" },
          { title: "Unit 2 Review", type: "REVIEW", slug: "es-b2-unit2-review" },
        ],
      },
      {
        title: "Professional Communication",
        description: "Negotiation, formal writing structures, and workplace diplomacy.",
        lessons: [
          { title: "Negotiation Skills", type: "CONVERSATION", slug: "es-b2-negotiation" },
          { title: "Formal Writing Structures", type: "GRAMMAR", slug: "es-b2-formal-writing" },
          { title: "Presenting Complex Ideas", type: "CONVERSATION", slug: "es-b2-complex-ideas" },
          { title: "Workplace Diplomacy", type: "CONVERSATION", slug: "es-b2-diplomacy" },
          { title: "Unit 3 Review", type: "REVIEW", slug: "es-b2-unit3-review" },
        ],
      },
      {
        title: "Idioms & Expressions",
        description: "Common idioms, colloquial expressions, collocations, and refranes (proverbs).",
        lessons: [
          { title: "Common Spanish Idioms", type: "VOCABULARY", slug: "es-b2-idioms" },
          { title: "Colloquial Expressions", type: "VOCABULARY", slug: "es-b2-colloquial" },
          { title: "Collocations & Word Partnerships", type: "VOCABULARY", slug: "es-b2-collocations" },
          { title: "Refranes — Proverbs & Sayings", type: "VOCABULARY", slug: "es-b2-refranes" },
          { title: "Unit 4 Review", type: "REVIEW", slug: "es-b2-unit4-review" },
        ],
      },
      {
        title: "Critical Thinking",
        description: "Analyzing texts, concessive structures, identifying tone, and summarizing.",
        lessons: [
          { title: "Analyzing Written Texts", type: "CONVERSATION", slug: "es-b2-analyze-texts" },
          { title: "Concessive Structures (Aunque)", type: "GRAMMAR", slug: "es-b2-concessive" },
          { title: "Identifying Bias & Tone", type: "CONVERSATION", slug: "es-b2-bias-tone" },
          { title: "Summarizing & Paraphrasing", type: "CONVERSATION", slug: "es-b2-summarize" },
          { title: "Unit 5 Review", type: "REVIEW", slug: "es-b2-unit5-review" },
        ],
      },
      {
        title: "Science & Innovation",
        description: "Science vocabulary, impersonal reporting structures, innovation and ethics.",
        lessons: [
          { title: "Science & Technology Vocabulary", type: "VOCABULARY", slug: "es-b2-science-vocab" },
          { title: "Impersonal & Passive Reporting", type: "GRAMMAR", slug: "es-b2-impersonal" },
          { title: "Discussing Innovation", type: "CONVERSATION", slug: "es-b2-innovation" },
          { title: "Ethical Dilemmas", type: "CONVERSATION", slug: "es-b2-ethical" },
          { title: "Unit 6 Review", type: "REVIEW", slug: "es-b2-unit6-review" },
        ],
      },
      {
        title: "Arts & Literature",
        description: "Arts vocabulary, advanced narrative tenses, reviews, and nuanced opinions.",
        lessons: [
          { title: "Arts & Literature Vocabulary", type: "VOCABULARY", slug: "es-b2-arts-vocab" },
          { title: "Advanced Narrative Tenses", type: "GRAMMAR", slug: "es-b2-narrative-tenses" },
          { title: "Film & Book Reviews", type: "CONVERSATION", slug: "es-b2-reviews" },
          { title: "Expressing Nuanced Opinions", type: "CONVERSATION", slug: "es-b2-nuanced" },
          { title: "Unit 7 Review", type: "REVIEW", slug: "es-b2-unit7-review" },
        ],
      },
      {
        title: "Global Issues & Mastery",
        description: "Global challenges, discourse markers, a panel discussion, and final mastery.",
        lessons: [
          { title: "Global Challenges", type: "VOCABULARY", slug: "es-b2-global-challenges" },
          { title: "Discourse Markers & Cohesion", type: "GRAMMAR", slug: "es-b2-discourse" },
          { title: "Panel Discussion Simulation", type: "CONVERSATION", slug: "es-b2-panel" },
          { title: "Formal Speech & Presentation", type: "CONVERSATION", slug: "es-b2-formal-speech" },
          { title: "Final Review & Celebration", type: "REVIEW", slug: "es-b2-final-review" },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════
// OpenAI content generation — Spanish target, English scaffolding
// ═══════════════════════════════════════════════════════════════════

const LEVEL_GUIDE = {
  A1: "beginner (present tense, ser/estar, basic vocabulary, simple everyday sentences)",
  A2: "elementary (preterite & imperfect, simple future, common connectors, everyday topics)",
  B1: "intermediate (present subjunctive, conditionals, reported speech, abstract topics, opinion phrases)",
  B2: "upper-intermediate (full subjunctive incl. imperfect subjunctive, idiomatic language, nuanced discussion, formal register)",
};

function buildContentPrompt(lesson, unitTitle, level) {
  return `You are an expert Spanish teacher creating content for English-speaking learners using a self-study app.
Generate a complete lesson in JSON for: "${lesson.title}" (Unit: ${unitTitle}, Level: ${level}, Type: ${lesson.type}).

The TARGET language being taught is SPANISH. The learner's language is ENGLISH.
- All Spanish must be natural, correct, and appropriate to CEFR ${level}: ${LEVEL_GUIDE[level]}.
- Every Spanish item MUST include an English translation.
- Explanations, grammar notes, tips and instructions are written in ENGLISH.
- Use Latin-American-neutral Spanish; note major Spain/Latin-America differences in tips when relevant.

Return ONLY valid JSON with this exact structure:
{
  "introduction": {
    "text": "2-3 sentence overview in English of what the student will learn",
    "culturalNote": "Optional: an interesting fact about Spanish-speaking culture related to this topic (1-2 sentences, English)"
  },
  "vocabulary": [
    {
      "term": "Spanish word or phrase (include article for nouns, e.g. 'el libro')",
      "translation": "English translation",
      "definition": "short English gloss or usage note",
      "pronunciation": "simple phonetic guide for an English speaker",
      "partOfSpeech": "noun/verb/phrase/adjective/etc",
      "exampleSentence": {
        "original": "Example sentence in Spanish using the word",
        "translation": "English translation of the example"
      },
      "tip": "A short memory trick or usage note (English)"
    }
  ],
  "grammar": [
    {
      "title": "Grammar point title (English)",
      "explanation": "Clear English explanation (3-5 sentences for ${level})",
      "table": {
        "headers": ["Column1", "Column2"],
        "rows": [["row1col1", "row1col2"]]
      },
      "examples": [
        {
          "original": "Example sentence in Spanish",
          "translation": "English translation",
          "breakdown": "Structural explanation in English"
        }
      ],
      "commonMistakes": ["Mistake 1 with correction", "Mistake 2 with correction"]
    }
  ],
  "dialogue": {
    "title": "Short situational title (English)",
    "context": "Where/when this conversation happens (English)",
    "speakers": ["Speaker A name/role", "Speaker B name/role"],
    "lines": [
      { "speaker": 0, "text": "Spanish line of dialogue", "translation": "English translation", "note": "optional short English note" },
      { "speaker": 1, "text": "Spanish response", "translation": "English translation", "note": "" }
    ]
  },
  "culture": {
    "title": "Cultural insight title (English)",
    "text": "2-3 sentences in English about Spanish-speaking culture related to this topic",
    "funFact": "A fun/surprising fact (English)"
  },
  "summary": {
    "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
    "nextSteps": "What to practice or what comes next (English)"
  }
}

Requirements:
- Vocabulary: 6-10 items for VOCABULARY type, 4-6 for others. ALWAYS include term + translation.
- Grammar: 1-2 points (more for GRAMMAR type). Examples always include Spanish + English translation.
- Dialogue: 8-12 lines of realistic ${level}-level Spanish, each with an English translation.
- For REVIEW type: consolidate the unit — mix earlier vocab and include a longer dialogue.
- Spanish complexity MUST match CEFR ${level}.`;
}

function buildExercisesPrompt(lesson, unitTitle, content, level) {
  const vocabTerms = (content.vocabulary || []).map((v) => v.term).join(", ");
  return `You are a Spanish exercise designer creating practice for English-speaking learners. Create 10-12 exercises for:
Title: "${lesson.title}" (Unit: ${unitTitle}, Level: ${level}, Type: ${lesson.type})
Key Spanish vocabulary: ${vocabTerms}

Return ONLY valid JSON array:
[
  {
    "exercise_type": "MULTIPLE_CHOICE" | "FILL_BLANK" | "REORDER" | "TRANSLATION" | "LISTENING" | "SPEAK",
    "question": "The question/instruction text in English",
    "content": {
      // MULTIPLE_CHOICE: { "options": [...], "correctIndex": 0 }
      // FILL_BLANK: { "sentence": "Yo ___ español", "correctAnswer": "hablo", "acceptableAnswers": [...], "options": [...] }
      // REORDER: { "words": [shuffled Spanish words], "correctOrder": [the SAME words in correct order, as strings], "translation": "English meaning" }  — words and correctOrder MUST be the same multiset of strings; do NOT use indices; only include words that belong in the sentence
      // TRANSLATION: { "prompt": "Translate to Spanish: 'I have two brothers'", "correctAnswer": "Tengo dos hermanos", "acceptableAnswers": [...] }
      // LISTENING: { "ttsText": "Spanish sentence to hear", "ttsLang": "es-ES", "options": [...], "correctIndex": 0 }
      // SPEAK: { "targetText": "Spanish sentence to say", "context": "English context", "acceptableVariants": [...] }
    },
    "explanation": "Why this is correct (1-2 sentences, English)",
    "hint": "A small hint (English)",
    "difficulty": "EASY" | "MEDIUM" | "HARD",
    "xp_reward": 3-5
  }
]

Requirements:
- Mix: at least 2 MULTIPLE_CHOICE, 2 FILL_BLANK, 1 REORDER, 1 TRANSLATION, 1 LISTENING, 1 SPEAK
- TRANSLATION = translate between English and Spanish (both directions welcome)
- LISTENING ttsLang MUST be "es-ES" and ttsText MUST be Spanish
- Difficulty spread: ~3 EASY, ~4 MEDIUM, ~3 HARD, matching CEFR ${level}`;
}

// Retry transient network / rate-limit errors so a long batch run survives a
// dropped socket or a 429 rather than aborting the whole course.
async function withRetry(fn, label, attempts = 5) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = Math.min(30000, 1500 * 2 ** (i - 1));
      console.warn(`       ⚠️  ${label} failed (attempt ${i}/${attempts}): ${e.message}. Retrying in ${Math.round(wait / 1000)}s…`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

async function generateContent(lesson, unitTitle, level) {
  return withRetry(async () => {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: buildContentPrompt(lesson, unitTitle, level) }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });
    return JSON.parse(res.choices[0].message.content);
  }, `content:${lesson.slug}`);
}

async function generateExercises(lesson, unitTitle, content, level) {
  const raw = await withRetry(async () => {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: buildExercisesPrompt(lesson, unitTitle, content, level) }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });
    const parsed = JSON.parse(res.choices[0].message.content);
    return Array.isArray(parsed) ? parsed : parsed.exercises || parsed.items || [];
  }, `exercises:${lesson.slug}`);
  return validateExercises(raw, lesson.slug);
}

// Normalize / drop malformed exercises. The big offender is REORDER, where the
// model often returns indices instead of words, the wrong field name, or words
// that don't match the answer. The Reorder UI expects:
//   { words: string[] (shuffled), correctOrder: string[] (correct order), translation }
function validateExercises(exercises, slug) {
  const out = [];
  let dropped = 0;
  for (const ex of exercises) {
    if (!ex || !ex.exercise_type || !ex.content) {
      dropped++;
      continue;
    }
    const c = ex.content;

    if (ex.exercise_type === "REORDER") {
      let words = Array.isArray(c.words) ? c.words.map(String) : [];
      let order = Array.isArray(c.correctOrder) ? c.correctOrder : [];

      // If correctOrder is numeric indices, map them back to words.
      const allNumeric = order.length > 0 && order.every((o) => typeof o === "number" || /^\d+$/.test(String(o)));
      if (allNumeric) order = order.map((i) => words[Number(i)]).filter((w) => w != null);
      else order = order.map(String);

      // If we only have a correct order, derive the word pool from it.
      if (words.length === 0 && order.length > 0) words = [...order];

      const norm = (a) => [...a].map((s) => s.trim()).sort().join("");
      const validPermutation =
        words.length >= 3 && words.length <= 12 && order.length === words.length && norm(words) === norm(order);

      if (!validPermutation) {
        dropped++;
        continue;
      }
      ex.content = {
        words,
        correctOrder: order,
        translation: c.translation || c.meaning || "",
      };
      out.push(ex);
      continue;
    }

    if (ex.exercise_type === "LISTENING") {
      if (!c.ttsText) { dropped++; continue; }
      c.ttsLang = "es-ES"; // force Spanish audio
      out.push(ex);
      continue;
    }

    if (ex.exercise_type === "MULTIPLE_CHOICE") {
      if (!Array.isArray(c.options) || c.options.length < 2 || typeof c.correctIndex !== "number") { dropped++; continue; }
      out.push(ex);
      continue;
    }

    if (ex.exercise_type === "FILL_BLANK") {
      if (!c.sentence || !c.correctAnswer) { dropped++; continue; }
      out.push(ex);
      continue;
    }

    if (ex.exercise_type === "TRANSLATION") {
      if (!c.correctAnswer) { dropped++; continue; }
      out.push(ex);
      continue;
    }

    if (ex.exercise_type === "SPEAK") {
      if (!c.targetText) { dropped++; continue; }
      out.push(ex);
      continue;
    }

    // Unknown type — keep it; the player guards unknown types.
    out.push(ex);
  }
  if (dropped) console.log(`       🧹 ${slug}: dropped ${dropped} malformed exercise(s), kept ${out.length}`);
  return out;
}

// ═══════════════════════════════════════════════════════════════════
// Spanish language row (find or create)
// ═══════════════════════════════════════════════════════════════════

async function getSpanishLanguageId() {
  const { data: existing } = await supabase
    .from("languages")
    .select("id")
    .eq("code", "es")
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("languages")
    .insert({
      code: "es",
      name: "Spanish",
      native_name: "Español",
      flag_emoji: "🇪🇸",
      is_active: true,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Language insert: ${error.message}`);
  return created.id;
}

// ═══════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const def = COURSES[LEVEL_ARG];
  const mode = PUBLISH ? "PUBLISH → Supabase" : "REVIEW → local files";
  console.log(`\n🇪🇸 Spanish ${LEVEL_ARG} Course Generator — ${mode}\n`);

  if (!PUBLISH) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log(`📂 Writing to ${OUT_DIR}\n`);
  }

  let languageId, courseId;
  if (PUBLISH) {
    languageId = await getSpanishLanguageId();
    console.log(`🌐 Spanish language id: ${languageId}`);

    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", def.course.slug)
      .maybeSingle();

    if (existing) {
      courseId = existing.id;
      console.log(`📚 Course exists: ${courseId}`);
    } else {
      const { data: newC, error } = await supabase
        .from("courses")
        .insert({
          ...def.course,
          language_id: languageId,
          course_type: "CORE",
          is_premium: !DRAFT, // non-premium while testing as a draft
          is_published: !DRAFT,
          order_index: { A1: 1, A2: 2, B1: 3, B2: 4 }[LEVEL_ARG],
        })
        .select("id")
        .single();
      if (error) throw new Error(`Course insert: ${error.message}`);
      courseId = newC.id;
      console.log(`📚 Created course: ${courseId}`);
    }
  }

  const manifest = [];

  for (let ui = 0; ui < def.units.length; ui++) {
    const unit = def.units[ui];
    const unitOrder = ui + 1;
    if (ONLY_UNIT && String(unitOrder) !== ONLY_UNIT) continue;

    console.log(`\n━━━ Unit ${unitOrder}: ${unit.title} ━━━`);

    let unitId;
    if (PUBLISH) {
      const { data: eu } = await supabase
        .from("units")
        .select("id")
        .eq("course_id", courseId)
        .eq("order_index", unitOrder)
        .maybeSingle();
      if (eu) {
        unitId = eu.id;
        console.log(`  📁 Unit exists: ${unitId}`);
      } else {
        const { data: nu, error } = await supabase
          .from("units")
          .insert({
            course_id: courseId,
            title: unit.title,
            description: unit.description,
            order_index: unitOrder,
            is_premium: DRAFT ? false : unitOrder > 1,
          })
          .select("id")
          .single();
        if (error) throw new Error(`Unit insert: ${error.message}`);
        unitId = nu.id;
        console.log(`  📁 Created unit: ${unitId}`);
      }
    }

    for (let li = 0; li < unit.lessons.length; li++) {
      const lesson = unit.lessons[li];
      const lessonOrder = li + 1;
      const filePath = path.join(OUT_DIR, `${lesson.slug}.json`);

      // Skip if already done (DB row exists, or local file exists in review mode).
      if (PUBLISH) {
        const { data: el } = await supabase
          .from("lessons")
          .select("id")
          .eq("slug", lesson.slug)
          .maybeSingle();
        if (el) {
          console.log(`    ✅ ${lesson.title} (exists)`);
          continue;
        }
      } else if (fs.existsSync(filePath) && !process.argv.includes("--force")) {
        console.log(`    ✅ ${lesson.title} (file exists, skip)`);
        manifest.push({ ...lesson, unit: unit.title, unitOrder, lessonOrder });
        continue;
      }

      let content, exercises;

      if (PUBLISH && FROM_FILES) {
        const saved = JSON.parse(fs.readFileSync(filePath, "utf8"));
        content = saved.content;
        exercises = saved.exercises;
        console.log(`    📄 Loaded ${lesson.title} from file`);
      } else {
        console.log(`    🔄 Generating: ${lesson.title}...`);
        content = await generateContent(lesson, unit.title, LEVEL_ARG);
        console.log(`       📝 Content OK (${(content.vocabulary || []).length} vocab)`);
        exercises = await generateExercises(lesson, unit.title, content, LEVEL_ARG);
        console.log(`       🎯 Exercises OK (${exercises.length})`);
      }

      if (!PUBLISH) {
        fs.writeFileSync(
          filePath,
          JSON.stringify({ lesson, unit: unit.title, unitOrder, lessonOrder, content, exercises }, null, 2)
        );
        console.log(`       💾 Saved ${path.relative(process.cwd(), filePath)}`);
        manifest.push({ ...lesson, unit: unit.title, unitOrder, lessonOrder });
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }

      // PUBLISH path → insert into Supabase.
      const { data: nl, error: le } = await supabase
        .from("lessons")
        .insert({
          unit_id: unitId,
          title: lesson.title,
          slug: lesson.slug,
          description: content.introduction?.text || "",
          lesson_type: lesson.type,
          content,
          estimated_minutes: { A1: 15, A2: 18, B1: 20, B2: 25 }[LEVEL_ARG],
          xp_reward: { A1: 20, A2: 25, B1: 30, B2: 35 }[LEVEL_ARG],
          order_index: lessonOrder,
          is_premium: DRAFT ? false : unitOrder > 1 || lessonOrder > 2,
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

  if (!PUBLISH) {
    fs.writeFileSync(path.join(OUT_DIR, "_manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`\n📋 Manifest: ${manifest.length} lessons → ${path.relative(process.cwd(), path.join(OUT_DIR, "_manifest.json"))}`);
  }

  console.log("\n🎉 Done!\n");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
