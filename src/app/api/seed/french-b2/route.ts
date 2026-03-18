import { createClient } from "@supabase/supabase-js";
import { frenchB2Course } from "@/lib/seed/french-b2";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    console.log("🌱 Starting French B2 seed...");

    let { data: language } = await supabaseAdmin
      .from("languages")
      .select("id")
      .eq("code", "fr")
      .single();

    if (!language) {
      return NextResponse.json(
        { error: "French language not found. Please seed A1 first." },
        { status: 400 }
      );
    }

    // Delete existing B1 course data
    const { data: existingCourse } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("slug", "french-b2")
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
          try {
            await supabaseAdmin.from("lesson_progress").delete().in("lesson_id", lessonIds);
          } catch (e) {}
        }
        await supabaseAdmin.from("lessons").delete().in("unit_id", unitIds);
      }
      await supabaseAdmin.from("units").delete().eq("course_id", existingCourse.id);
      await supabaseAdmin.from("courses").delete().eq("id", existingCourse.id);
      console.log("🗑️ Deleted old B1 course data");
    }

    // Create course
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .insert({
        language_id: language.id,
        title: frenchB2Course.course.title,
        slug: frenchB2Course.course.slug,
        description: frenchB2Course.course.description,
        level: frenchB2Course.course.level,
        estimated_hours: frenchB2Course.course.estimated_hours,
        total_lessons: frenchB2Course.course.total_lessons,
        image_url: frenchB2Course.course.image_url,
        is_published: frenchB2Course.course.is_published,
        is_premium: frenchB2Course.course.is_premium,
      })
      .select("id")
      .single();

    if (courseError) throw courseError;

    let totalLessons = 0;
    let totalExercises = 0;
    let totalVocab = 0;

    for (const unitData of frenchB2Course.units) {
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

      for (const lessonData of unitData.lessons) {
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
            content_version: "2.0",
          })
          .select("id")
          .single();

        if (lessonError) throw lessonError;
        totalLessons++;

        if (lessonData.exercises?.length > 0) {
          for (const ex of lessonData.exercises) {
            const exerciseRow = {
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
            };

            const { error: exError } = await supabaseAdmin
              .from("exercises")
              .insert(exerciseRow);

            if (exError) {
              console.error(`❌ Exercise error [${ex.exercise_type}] in ${lessonData.metadata.title}:`, exError.message, exError.code);
            } else {
              totalExercises += 1;
            }
          }
        }

        if (lessonData.content.vocabulary?.length > 0) {
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
          }));

          const { error: vocabError } = await supabaseAdmin
            .from("vocabulary")
            .insert(vocabRows);

          if (!vocabError) totalVocab += vocabRows.length;
        }
      }
    }

    await supabaseAdmin
      .from("courses")
      .update({ total_lessons: totalLessons })
      .eq("id", course.id);

    return NextResponse.json({
      success: true,
      message: "French B2 seeded successfully!",
      stats: {
        course: 1,
        units: frenchB2Course.units.length,
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
