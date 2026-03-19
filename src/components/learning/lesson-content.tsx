// src/components/learning/lesson-content.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { BookOpen, ArrowRight, Trophy, Star, CheckCircle, XCircle } from "lucide-react";
import MultipleChoice from "@/components/exercises/multiple-choice";
import Matching from "@/components/exercises/matching";
import FillBlank from "@/components/exercises/fill-blank";
import Translation from "@/components/exercises/translation";
import { updateStreak } from "@/lib/utils/streak";
import { incrementLessonCount } from "@/lib/utils/lesson-limits";

interface LessonContentProps {
  lesson: any;
  exercises: any[];
  userId: string;
  language: string;
  level: string;
  existingProgress: any;
}

type LessonPhase = "intro" | "exercises" | "complete";

export default function LessonContent({
  lesson,
  exercises,
  userId,
  language,
  level,
  existingProgress,
}: LessonContentProps) {
  const router = useRouter();
  const supabase = createClient();

  const [phase, setPhase] = useState<LessonPhase>("intro");
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { correct: boolean; xp: number }>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<{ correct: boolean; xp: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;
  const progress = ((currentExerciseIndex) / totalExercises) * 100;

  // Calculate results
  const correctAnswers = Object.values(answers).filter(a => a.correct).length;
  const totalXP = Object.values(answers).reduce((sum, a) => sum + a.xp, 0) + lesson.xp_reward;
  const scorePercent = totalExercises > 0 ? Math.round((correctAnswers / totalExercises) * 100) : 100;

  const handleExerciseSubmit = (correct: boolean) => {
    const xp = correct ? currentExercise.xp_reward : 0;
    setCurrentAnswer({ correct, xp });
    setAnswers(prev => ({
      ...prev,
      [currentExercise.id]: { correct, xp }
    }));
    setShowFeedback(true);
  };

  const handleContinue = () => {
    setShowFeedback(false);
    setCurrentAnswer(null);

    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      completeLesson();
    }
  };

  // Complete lesson and update streak
  const completeLesson = async () => {
    setIsSubmitting(true);
    setPhase("complete");

    try {
      // Save lesson progress
      const progressData = {
        user_id: userId,
        lesson_id: lesson.id,
        status: scorePercent >= 70 ? "COMPLETED" : "IN_PROGRESS",
        score: scorePercent,
        xp_earned: totalXP,
        completed_at: scorePercent >= 70 ? new Date().toISOString() : null,
      };

      if (existingProgress) {
        await supabase
          .from("lesson_progress")
          .update(progressData)
          .eq("id", existingProgress.id);
      } else {
        await supabase
          .from("lesson_progress")
          .insert(progressData);
      }

      // Update user's XP, streak, and lesson count if passed
      if (scorePercent >= 70) {
        const { data: userData } = await supabase
          .from("users")
          .select("total_xp")
          .eq("id", userId)
          .single();

        if (userData) {
          await supabase
            .from("users")
            .update({ 
              total_xp: (userData.total_xp || 0) + totalXP,
            })
            .eq("id", userId);
        }

        // Update streak
        const streakResult = await updateStreak(supabase, userId);
        console.log("Streak updated:", streakResult);

        // ═══════════════════════════════════════════════════════════
        // ██  INCREMENT DAILY LESSON COUNT  ████████████████████████
        // ═══════════════════════════════════════════════════════════
        await incrementLessonCount(supabase, userId);
        console.log("Daily lesson count incremented");
        // ═══════════════════════════════════════════════════════════
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderExercise = () => {
    if (!currentExercise) return null;

    const props = {
      exercise: currentExercise,
      onSubmit: handleExerciseSubmit,
      disabled: showFeedback,
    };

    switch (currentExercise.exercise_type) {
      case "MULTIPLE_CHOICE":
        return <MultipleChoice {...props} />;
      case "MATCHING":
        return <Matching {...props} />;
      case "FILL_BLANK":
        return <FillBlank {...props} />;
      case "TRANSLATION":
        return <Translation {...props} />;
      case "SPEAK":
      case "LISTENING":
      case "REORDER":
      case "WRITING":
      case "ERROR_CORRECTION":
        return <div>{currentExercise.question}</div>;
      default:
        return <div>Unknown exercise type: {currentExercise.exercise_type}</div>;
    }
  };

  // INTRO PHASE
  if (phase === "intro") {
    const content = lesson.content || {};
    
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
              {lesson.lesson_type}
            </span>
            <span className="text-gray-500 text-sm">
              {lesson.estimated_minutes} min
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {lesson.title}
          </h1>

          {content.introduction && (
            <p className="text-gray-600 text-lg mb-6">
              {content.introduction}
            </p>
          )}

          {content.key_points && content.key_points.length > 0 && (
            <div className="bg-primary-50 rounded-xl p-6 mb-6">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                What you&apos;ll learn
              </h2>
              <ul className="space-y-2">
                {content.key_points.map((point: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.vocabulary && content.vocabulary.length > 0 && (
            <div className="mb-6">
              <h2 className="font-bold text-gray-900 mb-3">Vocabulary</h2>
              <div className="grid gap-2">
                {content.vocabulary.slice(0, 5).map((word: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{word.french}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-gray-500 text-sm">{word.pronunciation}</span>
                    </div>
                    <span className="text-gray-600">{word.english}</span>
                  </div>
                ))}
                {content.vocabulary.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{content.vocabulary.length - 5} more words
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-secondary">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">+{lesson.xp_reward} XP</span>
            </div>
            <Button 
              onClick={() => setPhase("exercises")}
              className="gap-2"
            >
              Start Exercises
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // EXERCISES PHASE
  if (phase === "exercises") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Question {currentExerciseIndex + 1} of {totalExercises}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          {renderExercise()}
        </div>

        {showFeedback && currentAnswer && (
          <div className={`mt-4 p-6 rounded-2xl ${
            currentAnswer.correct 
              ? "bg-green-50 border-2 border-green-200" 
              : "bg-red-50 border-2 border-red-200"
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${
                currentAnswer.correct ? "bg-green-100" : "bg-red-100"
              }`}>
                {currentAnswer.correct ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold ${
                  currentAnswer.correct ? "text-green-800" : "text-red-800"
                }`}>
                  {currentAnswer.correct ? "Correct!" : "Not quite right"}
                </h3>
                {currentExercise.explanation && (
                  <p className={`mt-1 ${
                    currentAnswer.correct ? "text-green-700" : "text-red-700"
                  }`}>
                    {currentExercise.explanation}
                  </p>
                )}
                {currentAnswer.correct && (
                  <p className="mt-2 text-green-600 font-medium">
                    +{currentAnswer.xp} XP
                  </p>
                )}
              </div>
            </div>
            <Button 
              onClick={handleContinue}
              className="w-full mt-4"
              variant={currentAnswer.correct ? "primary" : "secondary"}
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    );
  }

  // COMPLETE PHASE
  if (phase === "complete") {
    const passed = scorePercent >= 70;

    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
            passed ? "bg-green-100" : "bg-orange-100"
          }`}>
            {passed ? (
              <Trophy className="w-10 h-10 text-green-600" />
            ) : (
              <Star className="w-10 h-10 text-orange-600" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {passed ? "Lesson Complete!" : "Keep Practicing!"}
          </h1>
          <p className="text-gray-600 mb-6">
            {passed 
              ? "Great job! You've mastered this lesson."
              : "You need 70% to pass. Try again!"}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">{scorePercent}%</div>
              <div className="text-sm text-gray-500">Score</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">{correctAnswers}/{totalExercises}</div>
              <div className="text-sm text-gray-500">Correct</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-secondary">+{passed ? totalXP : 0}</div>
              <div className="text-sm text-gray-500">XP</div>
            </div>
          </div>

          <div className="space-y-3">
            {passed ? (
              <Button 
                onClick={() => router.push(`/learn/${language}/${level}`)}
                className="w-full"
              >
                Continue to Next Lesson
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  setPhase("intro");
                  setCurrentExerciseIndex(0);
                  setAnswers({});
                  setShowFeedback(false);
                  setCurrentAnswer(null);
                }}
                className="w-full"
              >
                Try Again
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => router.push(`/learn/${language}/${level}`)}
              className="w-full"
            >
              Back to Course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}