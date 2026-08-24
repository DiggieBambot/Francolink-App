// src/app/api/seed/french-a1/route.ts

import { createClient } from "@supabase/supabase-js";
import { frenchA1Course } from "@/lib/seed/french-a1";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrSecret } from "@/lib/auth/require-admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // This route deletes every course, unit, lesson, exercise, vocabulary row
  // AND lesson_progress before re-seeding — i.e. it wipes real students'
  // learning history. It ran unauthenticated with the service role, so any
  // stranger who guessed the path could destroy the catalogue in one POST.
  const denied = await requireAdminOrSecret(request);
  if (denied) return denied;

  try {
    console.log("🌱 Starting French A1 seed...");

    // 1. Find or create French language
    let { data: language } = await supabaseAdmin
      .from("languages")
      .select("id")
      .eq("code", "fr")
      .single();

    if (!language) {
      const { data: newLang, error: langError } = await supabaseAdmin
        .from("languages")
        .insert({
          code: "fr",
          name: "French",
          native_name: "Français",
          flag_emoji: "🇫🇷",
          is_active: true,
        })
        .select("id")
        .single();
      if (langError) throw langError;
      language = newLang;
    }

    console.log("✅ Language:", language!.id);

    // 2. Delete existing course data to avoid duplicates
    const { data: existingCourse } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("slug", "fr-a1")
      .single();

    if (existingCourse) {
      const { data: existingUnits } = await supabaseAdmin
        .from("units")
        .select("id")
        .eq("course_id", existingCourse.id);

      if (existingUnits && existingUnits.length > 0) {
        const unitIds = existingUnits.map((u: any) => u.id);

        const { data: existingLessons } = await supabaseAdmin
          .from("lessons")
          .select("id")
          .in("unit_id", unitIds);

        if (existingLessons && existingLessons.length > 0) {
          const lessonIds = existingLessons.map((l: any) => l.id);

          await supabaseAdmin.from("exercises").delete().in("lesson_id", lessonIds);
          await supabaseAdmin.from("vocabulary").delete().in("lesson_id", lessonIds);
          
          // Try to delete lesson_progress if it exists
          try {
            await supabaseAdmin.from("lesson_progress").delete().in("lesson_id", lessonIds);
          } catch (e) {
            // Table might not exist, ignore
          }
        }

        await supabaseAdmin.from("lessons").delete().in("unit_id", unitIds);
      }

      await supabaseAdmin.from("units").delete().eq("course_id", existingCourse.id);
      await supabaseAdmin.from("courses").delete().eq("id", existingCourse.id);

      console.log("🗑️ Deleted old course data");
    }

    // 3. Create the course
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .insert({
        language_id: language!.id,
        title: frenchA1Course.course.title,
        slug: frenchA1Course.course.slug,
        description: frenchA1Course.course.description,
        level: frenchA1Course.course.level,
        estimated_hours: frenchA1Course.course.estimated_hours,
        total_lessons: frenchA1Course.course.total_lessons,
        image_url: frenchA1Course.course.image_url,
        is_published: frenchA1Course.course.is_published,
        is_premium: frenchA1Course.course.is_premium,
      })
      .select("id")
      .single();

    if (courseError) throw courseError;
    console.log("✅ Course created:", course.id);

    let totalLessons = 0;
    let totalExercises = 0;
    let totalVocab = 0;

    // 4. Loop through units
    for (const unitData of frenchA1Course.units) {
      const { data: unit, error: unitError } = await supabaseAdmin
        .from("units")
        .insert({
          course_id: course.id,
          title: unitData.unit.title,
          description: unitData.unit.description,
          order_index: unitData.unit.order_index,
          is_premium: unitData.unit.is_premium,
        })
        .select("id")
        .single();

      if (unitError) throw unitError;
      console.log(`✅ Unit created: ${unitData.unit.title}`);

      // 5. Loop through lessons
      for (const lessonData of unitData.lessons) {
        // Match YOUR lessons schema exactly
        const { data: lesson, error: lessonError } = await supabaseAdmin
          .from("lessons")
          .insert({
            unit_id: unit.id,
            title: lessonData.metadata.title,
            slug: lessonData.metadata.slug,
            description: lessonData.content.introduction?.text?.substring(0, 500) || "",
            lesson_type: lessonData.metadata.type,
            content: lessonData.content,
            estimated_minutes: lessonData.metadata.estimatedMinutes,
            xp_reward: lessonData.metadata.xpReward,
            order_index: lessonData.metadata.lesson,
            is_premium: false,
            is_active: true,
            category: null,
            content_version: "1.0",
          })
          .select("id")
          .single();

        if (lessonError) {
          console.error(`❌ Lesson error:`, lessonError);
          throw lessonError;
        }
        totalLessons++;
        console.log(`  ✅ Lesson ${lessonData.metadata.lesson}: ${lessonData.metadata.title}`);

        // 6. Insert exercises - match YOUR exercises schema
        if (lessonData.exercises && lessonData.exercises.length > 0) {
          const exerciseRows = lessonData.exercises.map((ex: any) => ({
            lesson_id: lesson.id,
            exercise_type: ex.exercise_type,
            difficulty: ex.difficulty || "MEDIUM",
            question: ex.question,
            content: ex.content,
            explanation: ex.explanation || null,
            hint: ex.hint || null,
            xp_reward: ex.xp_reward || 5,
            order_index: ex.order_index,
            is_active: true,
          }));

          const { error: exError } = await supabaseAdmin
            .from("exercises")
            .insert(exerciseRows);

          if (exError) {
            console.error(`  ❌ Exercise error:`, exError.message);
          } else {
            totalExercises += exerciseRows.length;
            console.log(`    ✅ ${exerciseRows.length} exercises`);
          }
        }

        // 7. Insert vocabulary - match YOUR vocabulary schema (no gender, difficulty, tags)
        if (lessonData.content.vocabulary && lessonData.content.vocabulary.length > 0) {
          const vocabRows = lessonData.content.vocabulary.map((v: any) => ({
            language_id: language!.id,
            lesson_id: lesson.id,
            word: v.term,
            translation: v.translation,
            pronunciation: v.pronunciation || null,
            part_of_speech: v.partOfSpeech || null,
            example_sentence: v.exampleSentence?.original || null,
            example_translation: v.exampleSentence?.translation || null,
            image_url: v.image || null,
            audio_url: v.audio || null,
            // Removed: gender, difficulty, tags (not in your schema)
          }));

          const { error: vocabError } = await supabaseAdmin
            .from("vocabulary")
            .insert(vocabRows);

          if (vocabError) {
            console.error(`  ⚠️ Vocab error:`, vocabError.message);
          } else {
            totalVocab += vocabRows.length;
            console.log(`    ✅ ${vocabRows.length} vocabulary words`);
          }
        }
      }
    }

    // 8. Update course total_lessons count
    await supabaseAdmin
      .from("courses")
      .update({ total_lessons: totalLessons })
      .eq("id", course.id);

    console.log("🎉 Seed complete!");

    return NextResponse.json({
      success: true,
      message: "French A1 seeded successfully!",
      stats: {
        course: 1,
        units: frenchA1Course.units.length,
        lessons: totalLessons,
        exercises: totalExercises,
        vocabulary: totalVocab,
      },
    });
  } catch (error: any) {
    console.error("❌ Seed error:", error);
    return NextResponse.json(
      { error: error.message || "Seed failed" },
      { status: 500 }
    );
  }
}
