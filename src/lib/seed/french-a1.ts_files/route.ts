// src/app/api/seed/french-a1/route.ts

import { createClient } from "@supabase/supabase-js";
import { frenchA1Course, frenchA1Vocabulary } from "@/lib/seed/french-a1";
import { NextResponse } from "next/server";

// Use service role key for seeding (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // Verify this is an authorized request (simple check - improve for production)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
      // For development, we'll allow it. In production, add proper auth.
      console.log("Warning: No auth header, proceeding anyway for development");
    }

    console.log("🌱 Starting French A1 seed...");

    // Step 1: Get or verify French language exists
    const { data: languages, error: langError } = await supabaseAdmin
      .from("languages")
      .select("id")
      .eq("code", "fr")
      .single();

    if (langError || !languages) {
      // Insert French language if it doesn't exist
      const { data: newLang, error: insertLangError } = await supabaseAdmin
        .from("languages")
        .upsert({
          code: "fr",
          name: "French",
          native_name: "Français",
          flag_emoji: "🇫🇷",
          is_active: true,
        }, { onConflict: "code" })
        .select("id")
        .single();

      if (insertLangError) {
        throw new Error(`Failed to insert language: ${insertLangError.message}`);
      }
      
      console.log("✅ French language created");
    }

    // Get French language ID
    const { data: frenchLang } = await supabaseAdmin
      .from("languages")
      .select("id")
      .eq("code", "fr")
      .single();

    if (!frenchLang) {
      throw new Error("Could not find French language");
    }

    const languageId = frenchLang.id;
    console.log(`✅ French language ID: ${languageId}`);

    // Step 2: Check if course already exists
    const { data: existingCourse } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("slug", frenchA1Course.course.slug)
      .single();

    if (existingCourse) {
      console.log("⚠️ French A1 course already exists. Deleting and recreating...");
      
      // Delete existing course (cascade will handle related records)
      await supabaseAdmin
        .from("courses")
        .delete()
        .eq("id", existingCourse.id);
    }

    // Step 3: Insert the course
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .insert({
        language_id: languageId,
        ...frenchA1Course.course,
      })
      .select("id")
      .single();

    if (courseError) {
      throw new Error(`Failed to insert course: ${courseError.message}`);
    }

    console.log(`✅ Course created: ${course.id}`);

    // Step 4: Insert units and lessons
    let totalLessons = 0;
    let totalExercises = 0;

    for (const unitData of frenchA1Course.units) {
      const { lessons, ...unitInfo } = unitData;

      // Insert unit
      const { data: unit, error: unitError } = await supabaseAdmin
        .from("units")
        .insert({
          course_id: course.id,
          ...unitInfo,
        })
        .select("id")
        .single();

      if (unitError) {
        throw new Error(`Failed to insert unit "${unitInfo.title}": ${unitError.message}`);
      }

      console.log(`  ✅ Unit created: ${unitInfo.title}`);

      // Insert lessons for this unit
      for (const lessonData of lessons) {
        const { exercises, vocabulary, ...lessonInfo } = lessonData;

        // Insert lesson
        const { data: lesson, error: lessonError } = await supabaseAdmin
          .from("lessons")
          .insert({
            unit_id: unit.id,
            ...lessonInfo,
          })
          .select("id")
          .single();

        if (lessonError) {
          throw new Error(`Failed to insert lesson "${lessonInfo.title}": ${lessonError.message}`);
        }

        totalLessons++;
        console.log(`    ✅ Lesson created: ${lessonInfo.title}`);

        // Insert exercises for this lesson
        if (exercises && exercises.length > 0) {
          const exercisesToInsert = exercises.map((ex) => ({
            lesson_id: lesson.id,
            ...ex,
          }));

          const { error: exerciseError } = await supabaseAdmin
            .from("exercises")
            .insert(exercisesToInsert);

          if (exerciseError) {
            throw new Error(`Failed to insert exercises for "${lessonInfo.title}": ${exerciseError.message}`);
          }

          totalExercises += exercises.length;
          console.log(`      ✅ ${exercises.length} exercises created`);
        }

        // Insert vocabulary for this lesson (into vocabulary table)
        if (vocabulary && vocabulary.length > 0) {
          const vocabToInsert = vocabulary.map((v) => ({
            language_id: languageId,
            word: v.french,
            translation: v.english,
            pronunciation: v.pronunciation,
            category: lessonInfo.slug,
            difficulty: 1,
          }));

          const { error: vocabError } = await supabaseAdmin
            .from("vocabulary")
            .upsert(vocabToInsert, { onConflict: "language_id,word" });

          if (vocabError) {
            console.warn(`Warning: Could not insert vocabulary: ${vocabError.message}`);
          }
        }
      }
    }

    // Step 5: Insert general vocabulary
    const generalVocab = frenchA1Vocabulary.map((v) => ({
      language_id: languageId,
      word: v.word,
      translation: v.translation,
      pronunciation: v.pronunciation,
      category: v.category,
      difficulty: v.difficulty,
    }));

    const { error: generalVocabError } = await supabaseAdmin
      .from("vocabulary")
      .upsert(generalVocab, { onConflict: "language_id,word" });

    if (generalVocabError) {
      console.warn(`Warning: Could not insert general vocabulary: ${generalVocabError.message}`);
    }

    console.log("\n🎉 Seed completed successfully!");
    console.log(`   📚 1 course`);
    console.log(`   📖 ${frenchA1Course.units.length} units`);
    console.log(`   📝 ${totalLessons} lessons`);
    console.log(`   ❓ ${totalExercises} exercises`);
    console.log(`   📖 ${frenchA1Vocabulary.length}+ vocabulary words`);

    return NextResponse.json({
      success: true,
      message: "French A1 course seeded successfully",
      stats: {
        course: 1,
        units: frenchA1Course.units.length,
        lessons: totalLessons,
        exercises: totalExercises,
        vocabulary: frenchA1Vocabulary.length,
      },
    });
  } catch (error) {
    console.error("❌ Seed failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET method to check status
export async function GET() {
  try {
    const { data: course, error } = await supabaseAdmin
      .from("courses")
      .select(`
        id,
        title,
        slug,
        units:units(
          id,
          title,
          lessons:lessons(
            id,
            title,
            exercises:exercises(count)
          )
        )
      `)
      .eq("slug", "french-a1")
      .single();

    if (error || !course) {
      return NextResponse.json({
        exists: false,
        message: "French A1 course not found. Run POST to seed.",
      });
    }

    const lessonCount = course.units.reduce(
      (acc: number, unit: any) => acc + unit.lessons.length,
      0
    );

    const exerciseCount = course.units.reduce(
      (acc: number, unit: any) =>
        acc + unit.lessons.reduce((lacc: number, lesson: any) => lacc + (lesson.exercises[0]?.count || 0), 0),
      0
    );

    return NextResponse.json({
      exists: true,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        units: course.units.length,
        lessons: lessonCount,
        exercises: exerciseCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}