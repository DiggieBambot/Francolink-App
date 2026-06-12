#!/usr/bin/env node
// scripts/generate-english-a1.mjs
// Generates the English A1 self-learning course using OpenAI + inserts into Supabase.
// Usage: node --env-file=.env.local scripts/generate-english-a1.mjs [--dry-run] [--unit=N] [--lesson=N]

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import crypto from "crypto";

const DRY_RUN = process.argv.includes("--dry-run");
const ONLY_UNIT = process.argv.find((a) => a.startsWith("--unit="))?.split("=")[1];
const ONLY_LESSON = process.argv.find((a) => a.startsWith("--lesson="))?.split("=")[1];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ENGLISH_LANGUAGE_ID = "2ff6cabc-541a-47c0-9c8a-7b15a328cf7e";

// ═══════════════════════════════════════════════════════════════════
// Course structure — 8 units × 8 lessons = 64 lessons
// ═══════════════════════════════════════════════════════════════════

const COURSE = {
  title: "English A1 - Beginner",
  slug: "english-a1",
  description:
    "Start your English journey! Learn essential vocabulary, basic grammar, and everyday expressions. Master greetings, daily routines, shopping, travel, and more.",
  level: "A1",
  language_id: ENGLISH_LANGUAGE_ID,
  course_type: "CORE",
  estimated_hours: 80,
  total_lessons: 64,
  is_premium: false,
  is_published: true,
  order_index: 1,
};

const UNITS = [
  {
    title: "First Steps",
    description:
      "Master the basics: greetings, introductions, the alphabet, numbers 1-20, days of the week, and months.",
    order_index: 1,
    is_premium: false,
    lessons: [
      { title: "Hello & Goodbye", type: "VOCABULARY", slug: "en-hello-goodbye" },
      { title: "The English Alphabet", type: "VOCABULARY", slug: "en-alphabet" },
      { title: "Numbers 1-20", type: "VOCABULARY", slug: "en-numbers-1-20" },
      { title: "Days of the Week", type: "VOCABULARY", slug: "en-days-of-week" },
      { title: "Months & Seasons", type: "VOCABULARY", slug: "en-months-seasons" },
      { title: "Introducing Yourself", type: "CONVERSATION", slug: "en-introducing-yourself" },
      { title: "Classroom English", type: "VOCABULARY", slug: "en-classroom-english" },
      { title: "Unit 1 Review", type: "REVIEW", slug: "en-unit1-review" },
    ],
  },
  {
    title: "About Me",
    description:
      "Talk about yourself: personal information, nationalities, jobs, family, age, and appearance.",
    order_index: 2,
    is_premium: false,
    lessons: [
      { title: "Personal Information", type: "CONVERSATION", slug: "en-personal-info" },
      { title: "Countries & Nationalities", type: "VOCABULARY", slug: "en-countries-nationalities" },
      { title: "Jobs & Professions", type: "VOCABULARY", slug: "en-jobs-professions" },
      { title: "My Family", type: "VOCABULARY", slug: "en-my-family" },
      { title: "Describing People", type: "VOCABULARY", slug: "en-describing-people" },
      { title: "The Verb 'To Be'", type: "GRAMMAR", slug: "en-verb-to-be" },
      { title: "Possessive Adjectives", type: "GRAMMAR", slug: "en-possessive-adjectives" },
      { title: "Unit 2 Review", type: "REVIEW", slug: "en-unit2-review" },
    ],
  },
  {
    title: "Daily Life",
    description:
      "Everyday English: telling time, daily routines, home and rooms, colors, likes and dislikes.",
    order_index: 3,
    is_premium: true,
    lessons: [
      { title: "Telling the Time", type: "VOCABULARY", slug: "en-telling-time" },
      { title: "My Daily Routine", type: "CONVERSATION", slug: "en-daily-routine" },
      { title: "Rooms in a House", type: "VOCABULARY", slug: "en-rooms-house" },
      { title: "Furniture & Objects", type: "VOCABULARY", slug: "en-furniture-objects" },
      { title: "Colors & Shapes", type: "VOCABULARY", slug: "en-colors-shapes" },
      { title: "Present Simple Tense", type: "GRAMMAR", slug: "en-present-simple" },
      { title: "Likes & Dislikes", type: "CONVERSATION", slug: "en-likes-dislikes" },
      { title: "Unit 3 Review", type: "REVIEW", slug: "en-unit3-review" },
    ],
  },
  {
    title: "Food & Drink",
    description:
      "Learn food vocabulary, ordering at a restaurant, shopping for groceries, and expressing preferences.",
    order_index: 4,
    is_premium: true,
    lessons: [
      { title: "Fruits & Vegetables", type: "VOCABULARY", slug: "en-fruits-vegetables" },
      { title: "Meals & Snacks", type: "VOCABULARY", slug: "en-meals-snacks" },
      { title: "Drinks & Beverages", type: "VOCABULARY", slug: "en-drinks-beverages" },
      { title: "At the Restaurant", type: "CONVERSATION", slug: "en-at-restaurant" },
      { title: "Grocery Shopping", type: "CONVERSATION", slug: "en-grocery-shopping" },
      { title: "Countable & Uncountable Nouns", type: "GRAMMAR", slug: "en-countable-uncountable" },
      { title: "Some & Any", type: "GRAMMAR", slug: "en-some-any" },
      { title: "Unit 4 Review", type: "REVIEW", slug: "en-unit4-review" },
    ],
  },
  {
    title: "Getting Around",
    description:
      "Navigate the city: directions, transport, places, asking for help, and prepositions of place.",
    order_index: 5,
    is_premium: true,
    lessons: [
      { title: "Places in Town", type: "VOCABULARY", slug: "en-places-in-town" },
      { title: "Directions & Navigation", type: "CONVERSATION", slug: "en-directions" },
      { title: "Public Transport", type: "VOCABULARY", slug: "en-public-transport" },
      { title: "At the Hotel", type: "CONVERSATION", slug: "en-at-hotel" },
      { title: "Prepositions of Place", type: "GRAMMAR", slug: "en-prepositions-place" },
      { title: "There is / There are", type: "GRAMMAR", slug: "en-there-is-are" },
      { title: "Asking for Help", type: "CONVERSATION", slug: "en-asking-for-help" },
      { title: "Unit 5 Review", type: "REVIEW", slug: "en-unit5-review" },
    ],
  },
  {
    title: "Shopping & Money",
    description:
      "Go shopping: clothes, prices, comparing items, paying, and handling numbers above 20.",
    order_index: 6,
    is_premium: true,
    lessons: [
      { title: "Clothes & Accessories", type: "VOCABULARY", slug: "en-clothes-accessories" },
      { title: "Numbers 20-1000", type: "VOCABULARY", slug: "en-numbers-20-1000" },
      { title: "Prices & Money", type: "VOCABULARY", slug: "en-prices-money" },
      { title: "At the Shop", type: "CONVERSATION", slug: "en-at-the-shop" },
      { title: "Adjectives & Comparisons", type: "GRAMMAR", slug: "en-adjectives-comparisons" },
      { title: "This / That / These / Those", type: "GRAMMAR", slug: "en-demonstratives" },
      { title: "Online Shopping", type: "CONVERSATION", slug: "en-online-shopping" },
      { title: "Unit 6 Review", type: "REVIEW", slug: "en-unit6-review" },
    ],
  },
  {
    title: "Free Time & Hobbies",
    description:
      "Talk about hobbies, sports, entertainment, making plans, and using can/can't.",
    order_index: 7,
    is_premium: true,
    lessons: [
      { title: "Hobbies & Interests", type: "VOCABULARY", slug: "en-hobbies-interests" },
      { title: "Sports & Exercise", type: "VOCABULARY", slug: "en-sports-exercise" },
      { title: "Music & Entertainment", type: "VOCABULARY", slug: "en-music-entertainment" },
      { title: "Making Plans", type: "CONVERSATION", slug: "en-making-plans" },
      { title: "Can & Can't (Abilities)", type: "GRAMMAR", slug: "en-can-cant" },
      { title: "Present Continuous", type: "GRAMMAR", slug: "en-present-continuous" },
      { title: "Weekend Activities", type: "CONVERSATION", slug: "en-weekend-activities" },
      { title: "Unit 7 Review", type: "REVIEW", slug: "en-unit7-review" },
    ],
  },
  {
    title: "Health & Emergencies",
    description:
      "Handle important situations: body parts, health problems, at the doctor, weather, and emergencies.",
    order_index: 8,
    is_premium: true,
    lessons: [
      { title: "Parts of the Body", type: "VOCABULARY", slug: "en-body-parts" },
      { title: "Health & Illness", type: "VOCABULARY", slug: "en-health-illness" },
      { title: "At the Doctor", type: "CONVERSATION", slug: "en-at-the-doctor" },
      { title: "Weather & Climate", type: "VOCABULARY", slug: "en-weather-climate" },
      { title: "Imperatives & Instructions", type: "GRAMMAR", slug: "en-imperatives" },
      { title: "Past Simple (Was/Were)", type: "GRAMMAR", slug: "en-past-simple-was-were" },
      { title: "Emergency Situations", type: "CONVERSATION", slug: "en-emergencies" },
      { title: "Final Review & Celebration", type: "REVIEW", slug: "en-final-review" },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// OpenAI content generation
// ═══════════════════════════════════════════════════════════════════

function buildContentPrompt(lesson, unitTitle) {
  return `You are an expert English language teacher creating content for a self-study app.
Generate a complete lesson in JSON for: "${lesson.title}" (Unit: ${unitTitle}, Level: A1 Beginner, Type: ${lesson.type}).

The audience is diverse — do NOT assume any particular native language. Keep all explanations in simple English. Use clear examples and context clues.

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
      "pronunciation": "phonetic guide like 'heh-LOH'",
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
      "explanation": "Clear explanation in simple English (2-4 sentences)",
      "table": {
        "headers": ["Column1", "Column2", ...],
        "rows": [["row1col1", "row1col2"], ...]
      },
      "examples": [
        {
          "original": "Example sentence",
          "breakdown": "Word-by-word or structural explanation",
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
    "text": "2-3 sentences about English-speaking culture or global usage of English related to this topic",
    "funFact": "A fun/surprising fact"
  },
  "summary": {
    "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
    "nextSteps": "What to practice or what comes next"
  }
}

Requirements:
- Vocabulary: 6-10 items for VOCABULARY type, 4-6 for others
- Grammar: 1-2 points (more for GRAMMAR type lessons)
- Dialogue: 6-10 lines, realistic A1-level conversation
- For REVIEW type: focus on consolidation — mix vocab from the unit, include a longer dialogue
- All English used must be A1 level (simple present, basic past, common words)
- No translations into other languages — definitions should use simple English, pictures, or context`;
}

function buildExercisesPrompt(lesson, unitTitle, content) {
  const vocabTerms = (content.vocabulary || []).map((v) => v.term).join(", ");
  return `You are an English language exercise designer. Create 10-12 exercises for this lesson:
Title: "${lesson.title}" (Unit: ${unitTitle}, Level: A1, Type: ${lesson.type})
Key vocabulary: ${vocabTerms}

Return ONLY valid JSON array of exercises:
[
  {
    "exercise_type": "MULTIPLE_CHOICE" | "FILL_BLANK" | "REORDER" | "TRANSLATION" | "LISTENING" | "SPEAK",
    "question": "The question/instruction text",
    "content": {
      // For MULTIPLE_CHOICE:
      "options": ["option1", "option2", "option3", "option4"],
      "correctIndex": 0

      // For FILL_BLANK:
      "sentence": "I ___ to school every day.",
      "correctAnswer": "go",
      "acceptableAnswers": ["go", "walk"],
      "options": ["go", "run", "fly", "swim"]

      // For REORDER:
      "words": ["school", "I", "go", "to"],
      "correctOrder": ["I", "go", "to", "school"],
      "meaning": "I go to school."

      // For TRANSLATION (rephrase, not translate to another language):
      "prompt": "Say this in another way: 'I am happy'",
      "correctAnswer": "I feel happy",
      "acceptableAnswers": ["I feel happy", "I'm happy", "I am glad"]

      // For LISTENING:
      "ttsText": "Text to be spoken aloud",
      "ttsLang": "en-US",
      "options": ["option1", "option2", "option3", "option4"],
      "correctIndex": 0

      // For SPEAK:
      "targetText": "Text the student should say",
      "context": "When/why you'd say this",
      "acceptableVariants": ["variant1", "variant2"]
    },
    "explanation": "Why this is the correct answer (1-2 sentences)",
    "hint": "A small hint",
    "difficulty": "EASY" | "MEDIUM" | "HARD",
    "xp_reward": 3-5
  }
]

Requirements:
- Mix of types: at least 2 MULTIPLE_CHOICE, 2 FILL_BLANK, 1 REORDER, 1 LISTENING, 1 SPEAK
- Difficulty: 4 EASY, 4 MEDIUM, 2-4 HARD
- Use vocabulary and grammar from the lesson
- TRANSLATION type: rephrase in simpler/different English words (NOT translate to another language)
- All content A1 level
- xp_reward: EASY=3, MEDIUM=4, HARD=5`;
}

async function generateContent(lesson, unitTitle) {
  const prompt = buildContentPrompt(lesson, unitTitle);
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4000,
  });
  return JSON.parse(res.choices[0].message.content);
}

async function generateExercises(lesson, unitTitle, content) {
  const prompt = buildExercisesPrompt(lesson, unitTitle, content);
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4000,
  });
  const parsed = JSON.parse(res.choices[0].message.content);
  // OpenAI may wrap in { exercises: [...] }
  return Array.isArray(parsed) ? parsed : parsed.exercises || parsed.items || [];
}

// ═══════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log(`\n🇬🇧 English A1 Course Generator ${DRY_RUN ? "(DRY RUN)" : ""}\n`);

  // 1. Create or get course
  let courseId;
  const { data: existingCourse } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", COURSE.slug)
    .single();

  if (existingCourse) {
    courseId = existingCourse.id;
    console.log(`📚 Course already exists: ${courseId}`);
  } else if (!DRY_RUN) {
    const { data: newCourse, error } = await supabase
      .from("courses")
      .insert(COURSE)
      .select("id")
      .single();
    if (error) throw new Error(`Course insert failed: ${error.message}`);
    courseId = newCourse.id;
    console.log(`📚 Created course: ${courseId}`);
  } else {
    courseId = "dry-run-course-id";
    console.log(`📚 Would create course: ${COURSE.title}`);
  }

  // 2. Process each unit
  for (const unit of UNITS) {
    if (ONLY_UNIT && String(unit.order_index) !== ONLY_UNIT) continue;

    console.log(`\n━━━ Unit ${unit.order_index}: ${unit.title} ━━━`);

    let unitId;
    const { data: existingUnit } = await supabase
      .from("units")
      .select("id")
      .eq("course_id", courseId)
      .eq("order_index", unit.order_index)
      .single();

    if (existingUnit) {
      unitId = existingUnit.id;
      console.log(`  📁 Unit exists: ${unitId}`);
    } else if (!DRY_RUN) {
      const { data: newUnit, error } = await supabase
        .from("units")
        .insert({
          course_id: courseId,
          title: unit.title,
          description: unit.description,
          order_index: unit.order_index,
          is_premium: unit.is_premium,
        })
        .select("id")
        .single();
      if (error) throw new Error(`Unit insert failed: ${error.message}`);
      unitId = newUnit.id;
      console.log(`  📁 Created unit: ${unitId}`);
    } else {
      unitId = `dry-run-unit-${unit.order_index}`;
      console.log(`  📁 Would create unit: ${unit.title}`);
    }

    // 3. Process each lesson in unit
    for (let li = 0; li < unit.lessons.length; li++) {
      const lesson = unit.lessons[li];
      const lessonOrder = li + 1;
      if (ONLY_LESSON && String(lessonOrder) !== ONLY_LESSON) continue;

      // Check if lesson already exists
      const { data: existingLesson } = await supabase
        .from("lessons")
        .select("id")
        .eq("slug", lesson.slug)
        .single();

      if (existingLesson) {
        console.log(`    ✅ ${lesson.title} (exists)`);
        continue;
      }

      console.log(`    🔄 Generating: ${lesson.title}...`);

      // Generate content
      const content = await generateContent(lesson, unit.title);
      console.log(`       📝 Content OK (${(content.vocabulary || []).length} vocab items)`);

      // Generate exercises
      const exercises = await generateExercises(lesson, unit.title, content);
      console.log(`       🎯 Exercises OK (${exercises.length} items)`);

      if (DRY_RUN) {
        console.log(`       [DRY RUN] Would insert lesson + ${exercises.length} exercises`);
        continue;
      }

      // Insert lesson
      const { data: newLesson, error: lessonErr } = await supabase
        .from("lessons")
        .insert({
          unit_id: unitId,
          title: lesson.title,
          slug: lesson.slug,
          description: content.introduction?.text || "",
          lesson_type: lesson.type,
          content,
          estimated_minutes: 15,
          xp_reward: 20,
          order_index: lessonOrder,
          is_premium: unit.is_premium && lessonOrder > 2, // first 2 lessons of each unit free
          is_active: true,
          content_version: "1.0",
        })
        .select("id")
        .single();

      if (lessonErr) {
        console.error(`       ❌ Lesson insert failed: ${lessonErr.message}`);
        continue;
      }

      // Insert exercises
      const exerciseRows = exercises.map((ex, idx) => ({
        lesson_id: newLesson.id,
        exercise_type: ex.exercise_type,
        question: ex.question,
        content: ex.content,
        explanation: ex.explanation || "",
        hint: ex.hint || "",
        difficulty: ex.difficulty || "MEDIUM",
        xp_reward: ex.xp_reward || 3,
        order_index: idx + 1,
        is_active: true,
      }));

      const { error: exErr } = await supabase.from("exercises").insert(exerciseRows);
      if (exErr) {
        console.error(`       ⚠️  Exercise insert warning: ${exErr.message}`);
      }

      console.log(`    ✅ ${lesson.title} — saved (${exercises.length} exercises)`);

      // Small delay to respect rate limits
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log("\n🎉 Done!\n");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
