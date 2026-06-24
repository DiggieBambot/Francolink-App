#!/usr/bin/env node
// scripts/generate-german-course.mjs
// Generates German A1-B2 self-learning courses (German target, English
// scaffolding/translations) using OpenAI.
//
// By default it writes generated lessons to local JSON files for REVIEW and
// does NOT touch the database:
//   node --env-file=.env.local scripts/generate-german-course.mjs --level=a1 [--unit=N]
//   → writes scripts/output/german/a1/<slug>.json + _manifest.json
//
// Once reviewed, publish into Supabase (find/creates the `de` language row,
// inserts course/units/lessons/exercises):
//   node --env-file=.env.local scripts/generate-german-course.mjs --level=a1 --publish
//
// Flags:
//   --level=a1|a2|b1|b2   (required)
//   --unit=N              only generate unit N
//   --publish             insert into Supabase instead of writing local files
//   --draft               (with --publish) is_premium=false + is_published=false
//   --from-files          (with --publish) publish previously-generated local
//                         JSON instead of calling OpenAI again

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";

const PUBLISH = process.argv.includes("--publish");
const FROM_FILES = process.argv.includes("--from-files");
const DRAFT = process.argv.includes("--draft");
const LEVEL_ARG = process.argv.find((a) => a.startsWith("--level="))?.split("=")[1]?.toUpperCase();
const ONLY_UNIT = process.argv.find((a) => a.startsWith("--unit="))?.split("=")[1];

if (!LEVEL_ARG || !["A1", "A2", "B1", "B2"].includes(LEVEL_ARG)) {
  console.error("Usage: --level=a1|a2|b1|b2 [--unit=N] [--publish] [--draft] [--from-files]");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OUT_DIR = path.join(process.cwd(), "scripts", "output", "german", LEVEL_ARG.toLowerCase());

// ═══════════════════════════════════════════════════════════════════
// Course definitions per level (German for English speakers, CEFR)
// 8 units × 5 lessons each. Lesson types: GRAMMAR | VOCABULARY |
// CONVERSATION | REVIEW. Curriculum focuses on the things that actually
// trip English speakers up in German: articles + genders, the four cases,
// separable verbs, modal verbs, Perfekt vs Präteritum, word order, the
// subjunctive (Konjunktiv II), and Goethe-Zertifikat topics.
// ═══════════════════════════════════════════════════════════════════

const COURSES = {
  A1: {
    course: {
      title: "German A1 - Beginner",
      slug: "german-a1",
      description:
        "Start your German journey! Greetings, the alphabet, numbers, the three articles, basic verbs in present tense, food, shopping, and everyday expressions to get you speaking from day one.",
      level: "A1",
      estimated_hours: 60,
      total_lessons: 40,
    },
    units: [
      {
        title: "First Words & Greetings",
        description: "Greetings, introductions, the German alphabet (including ä/ö/ü/ß), and numbers 0-20.",
        lessons: [
          { title: "Hello & Goodbye (Begrüßungen)", type: "CONVERSATION", slug: "de-a1-greetings" },
          { title: "The German Alphabet & Umlauts", type: "VOCABULARY", slug: "de-a1-alphabet" },
          { title: "Introducing Yourself", type: "CONVERSATION", slug: "de-a1-introductions" },
          { title: "Numbers 0-20", type: "VOCABULARY", slug: "de-a1-numbers" },
          { title: "Unit 1 Review", type: "REVIEW", slug: "de-a1-unit1-review" },
        ],
      },
      {
        title: "Articles & Genders",
        description: "The three genders (der/die/das), plural forms, and the verb sein (to be).",
        lessons: [
          { title: "Der, Die, Das - German Articles", type: "GRAMMAR", slug: "de-a1-articles" },
          { title: "The Verb Sein (To Be)", type: "GRAMMAR", slug: "de-a1-sein" },
          { title: "My Family (Die Familie)", type: "VOCABULARY", slug: "de-a1-family" },
          { title: "Plural Forms", type: "GRAMMAR", slug: "de-a1-plurals" },
          { title: "Unit 2 Review", type: "REVIEW", slug: "de-a1-unit2-review" },
        ],
      },
      {
        title: "Daily Life & Verbs",
        description: "Regular verb conjugation in the present tense, daily routine, and telling the time.",
        lessons: [
          { title: "Present Tense - Regular Verbs", type: "GRAMMAR", slug: "de-a1-present-regular" },
          { title: "The Verb Haben (To Have)", type: "GRAMMAR", slug: "de-a1-haben" },
          { title: "My Daily Routine", type: "CONVERSATION", slug: "de-a1-daily-routine" },
          { title: "Telling the Time", type: "VOCABULARY", slug: "de-a1-telling-time" },
          { title: "Unit 3 Review", type: "REVIEW", slug: "de-a1-unit3-review" },
        ],
      },
      {
        title: "Food & Drink",
        description: "Food vocabulary, ordering in a café, the accusative case introduction, and quantities.",
        lessons: [
          { title: "Food & Drinks (Essen & Trinken)", type: "VOCABULARY", slug: "de-a1-food" },
          { title: "The Accusative Case - Introduction", type: "GRAMMAR", slug: "de-a1-accusative-intro" },
          { title: "Ordering at a Café", type: "CONVERSATION", slug: "de-a1-ordering-cafe" },
          { title: "Quantities & Containers", type: "VOCABULARY", slug: "de-a1-quantities" },
          { title: "Unit 4 Review", type: "REVIEW", slug: "de-a1-unit4-review" },
        ],
      },
      {
        title: "Shopping & Around Town",
        description: "Shopping, places in town, asking for directions, prices and bigger numbers.",
        lessons: [
          { title: "Places in Town", type: "VOCABULARY", slug: "de-a1-places-town" },
          { title: "Asking for Directions", type: "CONVERSATION", slug: "de-a1-directions" },
          { title: "Numbers 21-1000 & Prices", type: "VOCABULARY", slug: "de-a1-numbers-prices" },
          { title: "At the Shop", type: "CONVERSATION", slug: "de-a1-at-the-shop" },
          { title: "Unit 5 Review", type: "REVIEW", slug: "de-a1-unit5-review" },
        ],
      },
      {
        title: "Home & Everyday Objects",
        description: "The house, prepositions of place, 'es gibt' (there is/are), and colours.",
        lessons: [
          { title: "My Home (Mein Zuhause)", type: "VOCABULARY", slug: "de-a1-home" },
          { title: "There Is / There Are (Es gibt)", type: "GRAMMAR", slug: "de-a1-es-gibt" },
          { title: "Prepositions of Place", type: "GRAMMAR", slug: "de-a1-prepositions" },
          { title: "Colours & Everyday Objects", type: "VOCABULARY", slug: "de-a1-colours" },
          { title: "Unit 6 Review", type: "REVIEW", slug: "de-a1-unit6-review" },
        ],
      },
      {
        title: "Free Time & Modal Verbs",
        description: "Hobbies, common modal verbs (können, möchten, müssen), and frequency expressions.",
        lessons: [
          { title: "Hobbies & Free Time", type: "VOCABULARY", slug: "de-a1-hobbies" },
          { title: "Modal Verbs - Können & Möchten", type: "GRAMMAR", slug: "de-a1-modal-verbs" },
          { title: "How Often? (Frequency)", type: "GRAMMAR", slug: "de-a1-frequency" },
          { title: "What Do You Do for Fun?", type: "CONVERSATION", slug: "de-a1-fun-conversation" },
          { title: "Unit 7 Review", type: "REVIEW", slug: "de-a1-unit7-review" },
        ],
      },
      {
        title: "Travel & Weather",
        description: "Travel basics, the weather, separable verbs introduction, and a final review.",
        lessons: [
          { title: "Travel & Transport", type: "VOCABULARY", slug: "de-a1-travel" },
          { title: "The Weather (Das Wetter)", type: "VOCABULARY", slug: "de-a1-weather" },
          { title: "Separable Verbs - Introduction", type: "GRAMMAR", slug: "de-a1-separable-verbs" },
          { title: "Planning a Trip", type: "CONVERSATION", slug: "de-a1-planning-trip" },
          { title: "Final Review & Celebration", type: "REVIEW", slug: "de-a1-final-review" },
        ],
      },
    ],
  },

  A2: {
    course: {
      title: "German A2 - Elementary",
      slug: "german-a2",
      description:
        "Build on the basics! The perfect tense, the dative case, modal verbs in detail, and handle health, work and city situations with growing confidence.",
      level: "A2",
      estimated_hours: 80,
      total_lessons: 40,
    },
    units: [
      {
        title: "Talking About the Past",
        description: "The Perfekt tense with haben, regular and irregular participles, and weekends.",
        lessons: [
          { title: "Perfekt with Haben - Regular Verbs", type: "GRAMMAR", slug: "de-a2-perfekt-haben-regular" },
          { title: "Perfekt - Irregular Participles", type: "GRAMMAR", slug: "de-a2-perfekt-irregular" },
          { title: "My Last Weekend", type: "CONVERSATION", slug: "de-a2-last-weekend" },
          { title: "Past Time Expressions", type: "VOCABULARY", slug: "de-a2-past-expressions" },
          { title: "Unit 1 Review", type: "REVIEW", slug: "de-a2-unit1-review" },
        ],
      },
      {
        title: "More on the Past",
        description: "Perfekt with sein, Präteritum of common verbs, and telling stories.",
        lessons: [
          { title: "Perfekt with Sein - Movement Verbs", type: "GRAMMAR", slug: "de-a2-perfekt-sein" },
          { title: "Präteritum of Sein, Haben & Modals", type: "GRAMMAR", slug: "de-a2-praeteritum" },
          { title: "Childhood Memories", type: "CONVERSATION", slug: "de-a2-childhood" },
          { title: "Telling a Simple Story", type: "CONVERSATION", slug: "de-a2-telling-story" },
          { title: "Unit 2 Review", type: "REVIEW", slug: "de-a2-unit2-review" },
        ],
      },
      {
        title: "The Dative Case",
        description: "The dative case, dative pronouns, and verbs that take the dative.",
        lessons: [
          { title: "The Dative Case - Introduction", type: "GRAMMAR", slug: "de-a2-dative-intro" },
          { title: "Dative Pronouns (mir, dir, ihm)", type: "GRAMMAR", slug: "de-a2-dative-pronouns" },
          { title: "Verbs That Take the Dative", type: "GRAMMAR", slug: "de-a2-dative-verbs" },
          { title: "Giving & Receiving Gifts", type: "CONVERSATION", slug: "de-a2-gifts" },
          { title: "Unit 3 Review", type: "REVIEW", slug: "de-a2-unit3-review" },
        ],
      },
      {
        title: "Health & Body",
        description: "The body, symptoms, visiting the doctor, and giving advice with modal verbs.",
        lessons: [
          { title: "The Body & Health", type: "VOCABULARY", slug: "de-a2-body-health" },
          { title: "Giving Advice - Sollen & Müssen", type: "GRAMMAR", slug: "de-a2-advice" },
          { title: "At the Doctor", type: "CONVERSATION", slug: "de-a2-doctor" },
          { title: "Feelings & Emotions", type: "VOCABULARY", slug: "de-a2-feelings" },
          { title: "Unit 4 Review", type: "REVIEW", slug: "de-a2-unit4-review" },
        ],
      },
      {
        title: "Work & Studies",
        description: "Jobs, education, describing your work routine, and writing a simple email.",
        lessons: [
          { title: "Jobs & Professions", type: "VOCABULARY", slug: "de-a2-jobs" },
          { title: "Education & School Life", type: "VOCABULARY", slug: "de-a2-education" },
          { title: "Writing a Simple Email", type: "CONVERSATION", slug: "de-a2-simple-email" },
          { title: "A Job Interview", type: "CONVERSATION", slug: "de-a2-job-interview" },
          { title: "Unit 5 Review", type: "REVIEW", slug: "de-a2-unit5-review" },
        ],
      },
      {
        title: "City & Services",
        description: "Bank, post office, formal Sie, making requests and complaints.",
        lessons: [
          { title: "City Services & Errands", type: "VOCABULARY", slug: "de-a2-services" },
          { title: "Formal You (Sie) vs Informal (Du)", type: "GRAMMAR", slug: "de-a2-sie-du" },
          { title: "Making a Complaint", type: "CONVERSATION", slug: "de-a2-complaint" },
          { title: "Polite Requests with Würden", type: "CONVERSATION", slug: "de-a2-polite-requests" },
          { title: "Unit 6 Review", type: "REVIEW", slug: "de-a2-unit6-review" },
        ],
      },
      {
        title: "Comparisons & Opinions",
        description: "Comparatives and superlatives, expressing opinions, and small talk.",
        lessons: [
          { title: "Comparatives & Superlatives", type: "GRAMMAR", slug: "de-a2-comparatives" },
          { title: "Giving Opinions", type: "CONVERSATION", slug: "de-a2-opinions" },
          { title: "Small Talk", type: "CONVERSATION", slug: "de-a2-small-talk" },
          { title: "Describing Experiences", type: "CONVERSATION", slug: "de-a2-experiences" },
          { title: "Unit 7 Review", type: "REVIEW", slug: "de-a2-unit7-review" },
        ],
      },
      {
        title: "Everyday Situations",
        description: "Technology, dealing with problems, two-way prepositions, and a comprehensive review.",
        lessons: [
          { title: "Technology & Gadgets", type: "VOCABULARY", slug: "de-a2-technology" },
          { title: "Dealing with Problems", type: "CONVERSATION", slug: "de-a2-problems" },
          { title: "Two-Way Prepositions", type: "GRAMMAR", slug: "de-a2-two-way-prepositions" },
          { title: "Everyday Negotiations", type: "CONVERSATION", slug: "de-a2-negotiations" },
          { title: "Final Review & Celebration", type: "REVIEW", slug: "de-a2-final-review" },
        ],
      },
    ],
  },

  B1: {
    course: {
      title: "German B1 - Intermediate",
      slug: "german-b1",
      description:
        "Express opinions, narrate in the past, use the genitive and Konjunktiv II, and handle work, media and travel situations with fluency.",
      level: "B1",
      estimated_hours: 100,
      total_lessons: 40,
    },
    units: [
      {
        title: "Expressing Opinions",
        description: "Subordinate clauses with dass/weil, agreeing and disagreeing, and word order.",
        lessons: [
          { title: "Subordinate Clauses with Dass & Weil", type: "GRAMMAR", slug: "de-b1-subordinate-clauses" },
          { title: "Agreeing & Disagreeing", type: "CONVERSATION", slug: "de-b1-agree-disagree" },
          { title: "Giving Opinions & Reasons", type: "CONVERSATION", slug: "de-b1-opinions" },
          { title: "Discussing Current Events", type: "CONVERSATION", slug: "de-b1-current-events" },
          { title: "Unit 1 Review", type: "REVIEW", slug: "de-b1-unit1-review" },
        ],
      },
      {
        title: "Narrating the Past",
        description: "Präteritum in writing, plusquamperfekt, and connectors for storytelling.",
        lessons: [
          { title: "Präteritum for Writing", type: "GRAMMAR", slug: "de-b1-praeteritum-writing" },
          { title: "Plusquamperfekt (Past Perfect)", type: "GRAMMAR", slug: "de-b1-plusquamperfekt" },
          { title: "Telling a Story", type: "CONVERSATION", slug: "de-b1-telling-story" },
          { title: "Memorable Experiences", type: "CONVERSATION", slug: "de-b1-memorable" },
          { title: "Unit 2 Review", type: "REVIEW", slug: "de-b1-unit2-review" },
        ],
      },
      {
        title: "Work & Career",
        description: "Professional vocabulary, the passive voice, business emails and meetings.",
        lessons: [
          { title: "Professional Vocabulary", type: "VOCABULARY", slug: "de-b1-professional-vocab" },
          { title: "The Passive Voice (Werden)", type: "GRAMMAR", slug: "de-b1-passive" },
          { title: "Business Emails & Messages", type: "CONVERSATION", slug: "de-b1-business-emails" },
          { title: "Meetings & Presentations", type: "CONVERSATION", slug: "de-b1-meetings" },
          { title: "Unit 3 Review", type: "REVIEW", slug: "de-b1-unit3-review" },
        ],
      },
      {
        title: "Conditionals & Wishes",
        description: "Konjunktiv II for hypothetical situations, wenn-clauses, polite requests.",
        lessons: [
          { title: "Konjunktiv II - Introduction", type: "GRAMMAR", slug: "de-b1-konjunktiv-intro" },
          { title: "Wenn-Clauses (Conditionals)", type: "GRAMMAR", slug: "de-b1-wenn-clauses" },
          { title: "Polite Konjunktiv II", type: "GRAMMAR", slug: "de-b1-konjunktiv-polite" },
          { title: "What Would You Do?", type: "CONVERSATION", slug: "de-b1-what-would" },
          { title: "Unit 4 Review", type: "REVIEW", slug: "de-b1-unit4-review" },
        ],
      },
      {
        title: "Media & Communication",
        description: "Indirect speech, discussing news, and social media in German.",
        lessons: [
          { title: "Media Vocabulary", type: "VOCABULARY", slug: "de-b1-media-vocab" },
          { title: "Indirect Speech (Indirekte Rede)", type: "GRAMMAR", slug: "de-b1-indirect-speech" },
          { title: "Discussing News & Articles", type: "CONVERSATION", slug: "de-b1-news" },
          { title: "Social Media & Digital Life", type: "CONVERSATION", slug: "de-b1-social-media" },
          { title: "Unit 5 Review", type: "REVIEW", slug: "de-b1-unit5-review" },
        ],
      },
      {
        title: "Environment & Society",
        description: "Relative clauses, social issues, and talking about the environment.",
        lessons: [
          { title: "Environment & Nature", type: "VOCABULARY", slug: "de-b1-environment" },
          { title: "Relative Clauses (Der, Die, Das as Pronouns)", type: "GRAMMAR", slug: "de-b1-relative-clauses" },
          { title: "Social Issues & Solutions", type: "CONVERSATION", slug: "de-b1-social-issues" },
          { title: "Expressing Concern & Suggestions", type: "CONVERSATION", slug: "de-b1-concern" },
          { title: "Unit 6 Review", type: "REVIEW", slug: "de-b1-unit6-review" },
        ],
      },
      {
        title: "Culture & Travel",
        description: "Describing places, adjective endings, and cultural differences.",
        lessons: [
          { title: "Describing Places & Scenery", type: "VOCABULARY", slug: "de-b1-describing-places" },
          { title: "Adjective Endings - Nominative & Accusative", type: "GRAMMAR", slug: "de-b1-adjective-endings" },
          { title: "Cultural Differences (DACH)", type: "CONVERSATION", slug: "de-b1-cultural-diff" },
          { title: "Travel Stories & Adventures", type: "CONVERSATION", slug: "de-b1-travel-stories" },
          { title: "Unit 7 Review", type: "REVIEW", slug: "de-b1-unit7-review" },
        ],
      },
      {
        title: "Future & Aspirations",
        description: "The future tense (Futur I), goals, presentations, and discussion skills.",
        lessons: [
          { title: "Future Plans & Ambitions", type: "CONVERSATION", slug: "de-b1-ambitions" },
          { title: "Futur I (Will + Werden)", type: "GRAMMAR", slug: "de-b1-futur" },
          { title: "Giving a Short Presentation", type: "CONVERSATION", slug: "de-b1-presentation" },
          { title: "Debate & Discussion Skills", type: "CONVERSATION", slug: "de-b1-debate" },
          { title: "Final Review & Celebration", type: "REVIEW", slug: "de-b1-final-review" },
        ],
      },
    ],
  },

  B2: {
    course: {
      title: "German B2 - Upper Intermediate",
      slug: "german-b2",
      description:
        "Achieve advanced fluency. Master the genitive, full Konjunktiv I and II, complex word order, idioms and nuance, and express yourself with precision.",
      level: "B2",
      estimated_hours: 120,
      total_lessons: 40,
    },
    units: [
      {
        title: "Advanced Grammar Review",
        description: "The genitive case, advanced adjective endings, and complex Konjunktiv I.",
        lessons: [
          { title: "The Genitive Case", type: "GRAMMAR", slug: "de-b2-genitive" },
          { title: "Adjective Endings - All Cases", type: "GRAMMAR", slug: "de-b2-adjective-all-cases" },
          { title: "Konjunktiv I (Reported Speech)", type: "GRAMMAR", slug: "de-b2-konjunktiv-i" },
          { title: "Advanced Error Correction", type: "GRAMMAR", slug: "de-b2-error-correction" },
          { title: "Unit 1 Review", type: "REVIEW", slug: "de-b2-unit1-review" },
        ],
      },
      {
        title: "Persuasion & Argument",
        description: "Persuasive language, sentence brackets, and formal vs informal register.",
        lessons: [
          { title: "Persuasive Language", type: "VOCABULARY", slug: "de-b2-persuasive-lang" },
          { title: "Sentence Bracket (Satzklammer) Mastery", type: "GRAMMAR", slug: "de-b2-satzklammer" },
          { title: "Constructing an Argument", type: "CONVERSATION", slug: "de-b2-argument" },
          { title: "Formal vs Informal Register", type: "CONVERSATION", slug: "de-b2-register" },
          { title: "Unit 2 Review", type: "REVIEW", slug: "de-b2-unit2-review" },
        ],
      },
      {
        title: "Professional Communication",
        description: "Negotiation, formal writing structures, and workplace diplomacy.",
        lessons: [
          { title: "Negotiation Skills", type: "CONVERSATION", slug: "de-b2-negotiation" },
          { title: "Formal Writing Structures", type: "GRAMMAR", slug: "de-b2-formal-writing" },
          { title: "Presenting Complex Ideas", type: "CONVERSATION", slug: "de-b2-complex-ideas" },
          { title: "Workplace Diplomacy", type: "CONVERSATION", slug: "de-b2-diplomacy" },
          { title: "Unit 3 Review", type: "REVIEW", slug: "de-b2-unit3-review" },
        ],
      },
      {
        title: "Idioms & Expressions",
        description: "Common idioms, colloquial expressions, modal particles, and Redewendungen.",
        lessons: [
          { title: "Common German Idioms", type: "VOCABULARY", slug: "de-b2-idioms" },
          { title: "Modal Particles (doch, mal, ja, eben)", type: "VOCABULARY", slug: "de-b2-modal-particles" },
          { title: "Collocations & Word Partnerships", type: "VOCABULARY", slug: "de-b2-collocations" },
          { title: "Redewendungen - Sayings", type: "VOCABULARY", slug: "de-b2-redewendungen" },
          { title: "Unit 4 Review", type: "REVIEW", slug: "de-b2-unit4-review" },
        ],
      },
      {
        title: "Critical Thinking",
        description: "Analyzing texts, concessive structures (obwohl, trotzdem), tone, summarizing.",
        lessons: [
          { title: "Analyzing Written Texts", type: "CONVERSATION", slug: "de-b2-analyze-texts" },
          { title: "Concessive Structures (Obwohl, Trotzdem)", type: "GRAMMAR", slug: "de-b2-concessive" },
          { title: "Identifying Bias & Tone", type: "CONVERSATION", slug: "de-b2-bias-tone" },
          { title: "Summarizing & Paraphrasing", type: "CONVERSATION", slug: "de-b2-summarize" },
          { title: "Unit 5 Review", type: "REVIEW", slug: "de-b2-unit5-review" },
        ],
      },
      {
        title: "Science & Innovation",
        description: "Science vocabulary, nominalization, innovation and ethics.",
        lessons: [
          { title: "Science & Technology Vocabulary", type: "VOCABULARY", slug: "de-b2-science-vocab" },
          { title: "Nominalization & Noun Compounds", type: "GRAMMAR", slug: "de-b2-nominalization" },
          { title: "Discussing Innovation", type: "CONVERSATION", slug: "de-b2-innovation" },
          { title: "Ethical Dilemmas", type: "CONVERSATION", slug: "de-b2-ethical" },
          { title: "Unit 6 Review", type: "REVIEW", slug: "de-b2-unit6-review" },
        ],
      },
      {
        title: "Arts & Literature",
        description: "Arts vocabulary, participial constructions, reviews, and nuanced opinions.",
        lessons: [
          { title: "Arts & Literature Vocabulary", type: "VOCABULARY", slug: "de-b2-arts-vocab" },
          { title: "Participial Constructions", type: "GRAMMAR", slug: "de-b2-participial" },
          { title: "Film & Book Reviews", type: "CONVERSATION", slug: "de-b2-reviews" },
          { title: "Expressing Nuanced Opinions", type: "CONVERSATION", slug: "de-b2-nuanced" },
          { title: "Unit 7 Review", type: "REVIEW", slug: "de-b2-unit7-review" },
        ],
      },
      {
        title: "Global Issues & Mastery",
        description: "Global challenges, discourse markers, a panel discussion, and final mastery.",
        lessons: [
          { title: "Global Challenges", type: "VOCABULARY", slug: "de-b2-global-challenges" },
          { title: "Discourse Markers & Cohesion", type: "GRAMMAR", slug: "de-b2-discourse" },
          { title: "Panel Discussion Simulation", type: "CONVERSATION", slug: "de-b2-panel" },
          { title: "Formal Speech & Presentation", type: "CONVERSATION", slug: "de-b2-formal-speech" },
          { title: "Final Review & Celebration", type: "REVIEW", slug: "de-b2-final-review" },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════
// OpenAI content generation - German target, English scaffolding
// ═══════════════════════════════════════════════════════════════════

const LEVEL_GUIDE = {
  A1: "beginner (present tense, nominative + intro to accusative, modal verbs können/möchten, der/die/das, basic vocabulary, simple everyday sentences)",
  A2: "elementary (Perfekt and Präteritum of common verbs, full accusative + dative, all modal verbs, two-way prepositions, common connectors)",
  B1: "intermediate (subordinate clauses dass/weil/wenn, Konjunktiv II for politeness and hypotheticals, passive voice, relative clauses, abstract topics)",
  B2: "upper-intermediate (genitive, full Konjunktiv I + II, complex sentence brackets, nominalization, idiomatic language, formal register, nuanced discussion)",
};

function buildContentPrompt(lesson, unitTitle, level) {
  return `You are an expert German teacher creating content for English-speaking learners using a self-study app.
Generate a complete lesson in JSON for: "${lesson.title}" (Unit: ${unitTitle}, Level: ${level}, Type: ${lesson.type}).

The TARGET language being taught is GERMAN. The learner's language is ENGLISH.
- All German must be natural, correct, and appropriate to CEFR ${level}: ${LEVEL_GUIDE[level]}.
- Every German item MUST include an English translation.
- Explanations, grammar notes, tips and instructions are written in ENGLISH.
- Use Hochdeutsch (standard German). Note major Austrian/Swiss differences in tips when relevant.
- For nouns: ALWAYS include the article (der/die/das) so the learner sees the gender, e.g. "der Tisch", "die Lampe", "das Buch".
- Be explicit about gender, plurals, and cases in tips when teaching new words.

Return ONLY valid JSON with this exact structure:
{
  "introduction": {
    "text": "2-3 sentence overview in English of what the student will learn",
    "culturalNote": "Optional: an interesting fact about German-speaking culture (Germany, Austria, Switzerland) related to this topic (1-2 sentences, English)"
  },
  "vocabulary": [
    {
      "term": "German word or phrase (include der/die/das for nouns, e.g. 'der Tisch')",
      "translation": "English translation",
      "definition": "short English gloss or usage note",
      "pronunciation": "simple phonetic guide for an English speaker",
      "partOfSpeech": "noun/verb/phrase/adjective/etc",
      "exampleSentence": {
        "original": "Example sentence in German using the word",
        "translation": "English translation of the example"
      },
      "tip": "A short memory trick or usage note (English), e.g. plural form or gender hint"
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
          "original": "Example sentence in German",
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
      { "speaker": 0, "text": "German line of dialogue", "translation": "English translation", "note": "optional short English note" },
      { "speaker": 1, "text": "German response", "translation": "English translation", "note": "" }
    ]
  },
  "culture": {
    "title": "Cultural insight title (English)",
    "text": "2-3 sentences in English about German-speaking (DACH) culture related to this topic",
    "funFact": "A fun/surprising fact (English)"
  },
  "summary": {
    "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
    "nextSteps": "What to practice or what comes next (English)"
  }
}

Requirements:
- Vocabulary: 6-10 items for VOCABULARY type, 4-6 for others. ALWAYS include term + translation. Nouns ALWAYS get der/die/das.
- Grammar: 1-2 points (more for GRAMMAR type). Examples always include German + English translation.
- Dialogue: 8-12 lines of realistic ${level}-level German, each with an English translation.
- Use REALISTIC German speaker names — typical first names like Anna, Lukas, Lena, Max, Hans, Sophie, Felix, Marie, Klaus, Petra etc. (NOT generic "Speaker A").
- For REVIEW type: consolidate the unit — mix earlier vocab and include a longer dialogue.
- German complexity MUST match CEFR ${level}.`;
}

function buildExercisesPrompt(lesson, unitTitle, content, level) {
  const vocabTerms = (content.vocabulary || []).map((v) => v.term).join(", ");
  return `You are a German exercise designer creating practice for English-speaking learners. Create 10-12 exercises for:
Title: "${lesson.title}" (Unit: ${unitTitle}, Level: ${level}, Type: ${lesson.type})
Key German vocabulary: ${vocabTerms}

Return ONLY valid JSON array:
[
  {
    "exercise_type": "MULTIPLE_CHOICE" | "FILL_BLANK" | "REORDER" | "TRANSLATION" | "LISTENING" | "SPEAK",
    "question": "The question/instruction text in English",
    "content": {
      // MULTIPLE_CHOICE: { "options": [...], "correctIndex": 0 }
      // FILL_BLANK: { "sentence": "Ich ___ Deutsch", "correctAnswer": "spreche", "acceptableAnswers": [...], "options": [...] }
      // REORDER: { "words": [shuffled German words], "correctOrder": [the SAME words in correct order, as strings], "translation": "English meaning" }  — words and correctOrder MUST be the same multiset of strings; do NOT use indices; only include words that belong in the sentence
      // TRANSLATION: { "prompt": "Translate to German: 'I have two brothers'", "correctAnswer": "Ich habe zwei Brüder", "acceptableAnswers": [...] }
      // LISTENING: { "ttsText": "German sentence to hear", "ttsLang": "de-DE", "options": [...], "correctIndex": 0 }
      // SPEAK: { "targetText": "German sentence to say", "context": "English context", "acceptableVariants": [...] }
    },
    "explanation": "Why this is correct (1-2 sentences, English)",
    "hint": "A small hint (English)",
    "difficulty": "EASY" | "MEDIUM" | "HARD",
    "xp_reward": 3-5
  }
]

Requirements:
- Mix: at least 2 MULTIPLE_CHOICE, 2 FILL_BLANK, 1 REORDER, 1 TRANSLATION, 1 LISTENING, 1 SPEAK
- TRANSLATION = translate between English and German (both directions welcome)
- LISTENING ttsLang MUST be "de-DE" and ttsText MUST be German
- For FILL_BLANK with nouns: include the correct article (der/die/das) in the answer if relevant
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

// Drop / normalize malformed exercises. Same rules as the Spanish generator;
// LISTENING ttsLang is forced to "de-DE" for German.
function validateExercises(exercises, slug) {
  const out = [];
  let dropped = 0;
  for (const ex of exercises) {
    if (!ex || !ex.exercise_type || !ex.content) { dropped++; continue; }
    const c = ex.content;

    if (ex.exercise_type === "REORDER") {
      let words = Array.isArray(c.words) ? c.words.map(String) : [];
      let order = Array.isArray(c.correctOrder) ? c.correctOrder : [];
      const allNumeric = order.length > 0 && order.every((o) => typeof o === "number" || /^\d+$/.test(String(o)));
      if (allNumeric) order = order.map((i) => words[Number(i)]).filter((w) => w != null);
      else order = order.map(String);
      if (words.length === 0 && order.length > 0) words = [...order];

      const norm = (a) => [...a].map((s) => s.trim()).sort().join("");
      const valid = words.length >= 3 && words.length <= 12 && order.length === words.length && norm(words) === norm(order);
      if (!valid) { dropped++; continue; }
      ex.content = { words, correctOrder: order, translation: c.translation || c.meaning || "" };
      out.push(ex); continue;
    }
    if (ex.exercise_type === "LISTENING") {
      if (!c.ttsText) { dropped++; continue; }
      c.ttsLang = "de-DE";
      out.push(ex); continue;
    }
    if (ex.exercise_type === "MULTIPLE_CHOICE") {
      if (!Array.isArray(c.options) || c.options.length < 2 || typeof c.correctIndex !== "number") { dropped++; continue; }
      out.push(ex); continue;
    }
    if (ex.exercise_type === "FILL_BLANK") {
      if (!c.sentence || !(c.correctAnswer || c.answer)) { dropped++; continue; }
      out.push(ex); continue;
    }
    if (ex.exercise_type === "TRANSLATION") {
      if (!c.correctAnswer) { dropped++; continue; }
      out.push(ex); continue;
    }
    if (ex.exercise_type === "SPEAK") {
      if (!c.targetText) { dropped++; continue; }
      out.push(ex); continue;
    }
    out.push(ex);
  }
  if (dropped) console.log(`       🧹 ${slug}: dropped ${dropped} malformed exercise(s), kept ${out.length}`);
  return out;
}

// ═══════════════════════════════════════════════════════════════════
// German language row (find or create)
// ═══════════════════════════════════════════════════════════════════

async function getGermanLanguageId() {
  const { data: existing } = await supabase
    .from("languages")
    .select("id")
    .eq("code", "de")
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("languages")
    .insert({
      code: "de",
      name: "German",
      native_name: "Deutsch",
      flag_emoji: "🇩🇪",
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
  console.log(`\n🇩🇪 German ${LEVEL_ARG} Course Generator — ${mode}\n`);

  if (!PUBLISH) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log(`📂 Writing to ${OUT_DIR}\n`);
  }

  let languageId, courseId;
  if (PUBLISH) {
    languageId = await getGermanLanguageId();
    console.log(`🌐 German language id: ${languageId}`);

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
          is_premium: !DRAFT,
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

      if (PUBLISH) {
        const { data: el } = await supabase
          .from("lessons")
          .select("id")
          .eq("slug", lesson.slug)
          .maybeSingle();
        if (el) { console.log(`    ✅ ${lesson.title} (exists)`); continue; }
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
        fs.writeFileSync(filePath, JSON.stringify({ lesson, unit: unit.title, unitOrder, lessonOrder, content, exercises }, null, 2));
        console.log(`       💾 Saved ${path.relative(process.cwd(), filePath)}`);
        manifest.push({ ...lesson, unit: unit.title, unitOrder, lessonOrder });
        await new Promise((r) => setTimeout(r, 250));
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
          estimated_minutes: { A1: 15, A2: 18, B1: 20, B2: 25 }[LEVEL_ARG],
          xp_reward: { A1: 20, A2: 25, B1: 30, B2: 35 }[LEVEL_ARG],
          order_index: lessonOrder,
          is_premium: DRAFT ? false : unitOrder > 1 || lessonOrder > 2,
          is_active: true,
          content_version: "1.0",
        })
        .select("id")
        .single();
      if (le) { console.error(`       ❌ ${le.message}`); continue; }

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
