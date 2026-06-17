// src/components/learning/lesson-flow.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  ArrowRight,
  Trophy,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Volume2,
  X,
  Flame,
  Zap,
  Medal,
} from "lucide-react";
import { Button } from "@/components/ui";
import LessonProgressBar from "./lesson-progress-bar";
import VocabularyCards from "./vocabulary-cards";
import GrammarSection from "./grammar-section";
import DialogueViewer from "./dialogue-viewer";
import MultipleChoice from "@/components/exercises/multiple-choice";
import Matching from "@/components/exercises/matching";
import FillBlank from "@/components/exercises/fill-blank";
import Translation from "@/components/exercises/translation";
import SpeakExercise from "@/components/exercises/speak-exercise";
import Reorder from "@/components/exercises/reorder";
import Listening from "@/components/exercises/listening";
import Writing from "@/components/exercises/writing";
import ErrorCorrection from "@/components/exercises/error-correction";
import { updateStreak } from "@/lib/utils/streak";
import { incrementLessonCount } from "@/lib/utils/lesson-limits";
import { useSoundEngine } from "@/hooks/use-sound-engine";

type LessonPhase =
  | "intro"
  | "vocabulary"
  | "grammar"
  | "dialogue"
  | "culture"
  | "practice-intro"
  | "exercises"
  | "wrong-review"
  | "complete";

interface LessonFlowProps {
  lesson: any;
  exercises: any[];
  userId: string;
  language: string;
  level: string;
  existingProgress: any;
}

const LANGUAGE_TTS_MAP: Record<string, string> = {
  french: "fr-FR",
  spanish: "es-ES",
  german: "de-DE",
  english: "en-GB",
};

// ── Celebration overlay shown after XP / streak / leaderboard ──────────────
function CelebrationOverlay({
  type,
  onDone,
}: {
  type: "xp" | "streak" | "leaderboard" | "perfect" | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!type) return;
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [type, onDone]);

  if (!type) return null;

  const configs = {
    xp: {
      emoji: "⭐",
      label: "XP Earned!",
      color: "from-yellow-400 to-orange-400",
      icon: <Zap className="w-8 h-8 text-white" />,
    },
    streak: {
      emoji: "🔥",
      label: "7-Day Streak!",
      color: "from-orange-500 to-red-500",
      icon: <Flame className="w-8 h-8 text-white" />,
    },
    leaderboard: {
      emoji: "🏅",
      label: "Leaderboard Rank Up!",
      color: "from-blue-500 to-purple-600",
      icon: <Medal className="w-8 h-8 text-white" />,
    },
    perfect: {
      emoji: "🌟",
      label: "Perfect Score!",
      color: "from-green-400 to-emerald-500",
      icon: <Trophy className="w-8 h-8 text-white" />,
    },
  };

  const cfg = configs[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className={`bg-gradient-to-br ${cfg.color} rounded-3xl px-10 py-8 text-center shadow-2xl
          animate-[celebration_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]`}
      >
        <div className="text-6xl mb-3">{cfg.emoji}</div>
        <div className="flex items-center gap-2 justify-center">
          {cfg.icon}
          <span className="text-white font-bold text-2xl">{cfg.label}</span>
        </div>
      </div>
    </div>
  );
}

// ── Answer feedback banner shown at bottom of exercise card ────────────────
function AnswerFeedback({
  correct,
  correctAnswer,
  hint,
  explanation,
}: {
  correct: boolean;
  correctAnswer?: string;
  hint?: string;
  explanation?: string;
}) {
  return (
    <div
      className={`mt-4 rounded-xl p-4 border-2 ${
        correct
          ? "bg-green-50 border-green-300"
          : "bg-red-50 border-red-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-1.5 rounded-full flex-shrink-0 ${
            correct ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {correct ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
        </div>
        <div className="flex-1">
          <p
            className={`font-bold text-sm ${
              correct ? "text-green-800" : "text-red-800"
            }`}
          >
            {correct ? "Correct! Well done!" : "Not quite right"}
          </p>

          {/* Show correct answer on wrong */}
          {!correct && correctAnswer && (
            <div className="mt-2 bg-white rounded-lg px-3 py-2 border border-red-200">
              <p className="text-xs text-gray-500 mb-0.5">Correct answer:</p>
              <p className="text-green-700 font-semibold text-sm">{correctAnswer}</p>
            </div>
          )}

          {/* Hint */}
          {hint && (
            <p className="text-xs text-gray-600 mt-2">
              💡 <span className="italic">{hint}</span>
            </p>
          )}

          {/* Explanation */}
          {explanation && (
            <p className="text-xs text-blue-700 mt-1 bg-blue-50 rounded px-2 py-1">
              📖 {explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LessonFlow({
  lesson,
  exercises,
  userId,
  language,
  level,
  existingProgress,
}: LessonFlowProps) {
  const router = useRouter();
  const supabase = createClient();
  const ttsLanguage = LANGUAGE_TTS_MAP[language] || "fr-FR";
  const { play } = useSoundEngine();

  const content = lesson.content || {};
  const hasVocabulary = content.vocabulary && content.vocabulary.length > 0;
  const hasGrammar = content.grammar && content.grammar.length > 0;
  const hasDialogue = content.dialogue && content.dialogue.lines?.length > 0;
  const hasCulture = content.culture && content.culture.text;

  const buildPhases = (): LessonPhase[] => {
    const phases: LessonPhase[] = ["intro"];
    if (hasVocabulary) phases.push("vocabulary");
    if (hasGrammar) phases.push("grammar");
    if (hasDialogue) phases.push("dialogue");
    if (hasCulture) phases.push("culture");
    if (exercises.length > 0) phases.push("practice-intro", "exercises");
    phases.push("complete");
    return phases;
  };

  const phases = buildPhases();

  // Core state
  const [currentPhase, setCurrentPhase] = useState<LessonPhase>("intro");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { correct: boolean; xp: number; userAnswer?: any; correctAnswer?: any }>
  >({});
  const [wrongAnswers, setWrongAnswers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Sound/feedback state
  const [lastAnswerResult, setLastAnswerResult] = useState<{
    correct: boolean;
    correctAnswer?: string;
    hint?: string;
    explanation?: string;
    show: boolean;
  } | null>(null);
  const [celebration, setCelebration] = useState<
    "xp" | "streak" | "leaderboard" | "perfect" | null
  >(null);

  // When a FREE user finishes their daily lesson, show an upgrade CTA on
  // the completion screen so they can keep practicing today.
  const [showFreeDailyLimitCTA, setShowFreeDailyLimitCTA] = useState(false);

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;
  const correctAnswers = Object.values(answers).filter((a) => a.correct).length;
  const totalXP =
    Object.values(answers).reduce((sum, a) => sum + a.xp, 0) + lesson.xp_reward;
  const scorePercent =
    totalExercises > 0
      ? Math.round((correctAnswers / totalExercises) * 100)
      : 100;

  // Phase navigation
  const goToNextPhase = () => {
    play("phase_change");
    const idx = phases.indexOf(currentPhase);
    if (idx < phases.length - 1) {
      setCurrentPhase(phases[idx + 1]);
      setPhaseProgress(0);
    }
  };

  const goToPreviousPhase = () => {
    const idx = phases.indexOf(currentPhase);
    if (idx > 0) {
      setCurrentPhase(phases[idx - 1]);
      setPhaseProgress(100);
    }
  };

  const skipToExercises = () => {
    if (exercises.length > 0) {
      play("tap");
      setCurrentPhase("practice-intro");
      setPhaseProgress(0);
    }
  };

  // ── Exercise submission ──────────────────────────────────────────────────
  const handleExerciseSubmit = (
    correct: boolean,
    userAnswer?: any,
    correctAnswer?: any
  ) => {
    const xp = correct ? currentExercise.xp_reward : 0;
    const isSpeak = currentExercise.exercise_type === "SPEAK";
    const alreadyAnswered = answers[currentExercise.id] !== undefined;

    // Play sound immediately
    if (!alreadyAnswered || isSpeak) {
      play(correct ? "correct" : "incorrect");
    }

    if (isSpeak && !alreadyAnswered) {
      // 1st SPEAK call — record result, show feedback banner, wait for Continue
      setAnswers((prev) => ({
        ...prev,
        [currentExercise.id]: { correct, xp, userAnswer, correctAnswer },
      }));
      if (!correct) {
        setWrongAnswers((prev) => [
          ...prev,
          { exercise: currentExercise, userAnswer, correctAnswer },
        ]);
      }
      // Show feedback inline in SpeakExercise (it handles its own UI)
      return;
    }

    if (!isSpeak) {
      setAnswers((prev) => ({
        ...prev,
        [currentExercise.id]: { correct, xp, userAnswer, correctAnswer },
      }));
      if (!correct) {
        setWrongAnswers((prev) => [
          ...prev,
          { exercise: currentExercise, userAnswer, correctAnswer },
        ]);
      }

      // Show feedback banner for non-SPEAK exercises
      setLastAnswerResult({
        correct,
        correctAnswer: correct
          ? undefined
          : typeof correctAnswer === "string"
          ? correctAnswer
          : JSON.stringify(correctAnswer),
        hint: currentExercise.hint,
        explanation: correct ? undefined : currentExercise.explanation,
        show: true,
      });
    }

    const resolvedCorrect = isSpeak
      ? answers[currentExercise.id]?.correct ?? correct
      : correct;

    const advance = () => {
      setLastAnswerResult(null);

      if (currentExerciseIndex < totalExercises - 1) {
        setCurrentExerciseIndex((prev) => prev + 1);
        setPhaseProgress(((currentExerciseIndex + 2) / totalExercises) * 100);
      } else {
        const finalAnswers = isSpeak
          ? { ...answers }
          : { ...answers, [currentExercise.id]: { correct, xp } };
        const hasWrong = Object.values(finalAnswers).some((a) => !a.correct);
        if (hasWrong) {
          setCurrentPhase("wrong-review");
        } else {
          completeLesson(true);
        }
      }
    };

    if (isSpeak) {
      advance();
    } else {
      // Give student time to read the feedback before advancing
      setTimeout(advance, correct ? 900 : 1800);
    }
  };

  // ── Show celebration then complete ──────────────────────────────────────
  const triggerCelebration = useCallback(
    (type: "xp" | "streak" | "leaderboard" | "perfect", cb: () => void) => {
      play(type);
      setCelebration(type);
      setTimeout(() => {
        setCelebration(null);
        cb();
      }, 2300);
    },
    [play]
  );

  // ── Complete lesson ──────────────────────────────────────────────────────
  const completeLesson = async (allCorrect = false) => {
    setIsSubmitting(true);
    setCurrentPhase("complete");

    // Fire sounds
    if (allCorrect && scorePercent === 100) {
      play("perfect");
    } else {
      play("complete");
    }

    try {
      const progressData = {
        user_id: userId,
        lesson_id: lesson.id,
        status: scorePercent >= 70 ? "COMPLETED" : "IN_PROGRESS",
        score: scorePercent,
        xp_earned: totalXP,
        completed_at:
          scorePercent >= 70 ? new Date().toISOString() : null,
      };

      if (existingProgress) {
        await supabase
          .from("lesson_progress")
          .update(progressData)
          .eq("id", existingProgress.id);
      } else {
        await supabase.from("lesson_progress").insert(progressData);
      }

      if (scorePercent >= 70) {
        // XP
        play("xp");
        const { data: userData } = await supabase
          .from("users")
          .select("total_xp, streak_count")
          .eq("id", userId)
          .single();

        if (userData) {
          await supabase
            .from("users")
            .update({ total_xp: (userData.total_xp || 0) + totalXP })
            .eq("id", userId);

          // Streak update + sound if milestone
          const streakResult = await updateStreak(supabase, userId);
          const newStreak = streakResult?.streak ?? userData.streak_count ?? 0;
          if (newStreak > 0 && newStreak % 7 === 0) {
            setTimeout(() => play("streak"), 800);
          }
        }

        await incrementLessonCount(supabase, userId);

        // If this completion put a FREE user at their daily cap, flag the
        // upgrade CTA on the completion screen.
        try {
          const { data: planRow } = await supabase
            .from("users")
            .select("subscription_plan, lessons_today")
            .eq("id", userId)
            .single();
          if (planRow && (planRow.subscription_plan ?? "FREE") === "FREE") {
            setShowFreeDailyLimitCTA(true);
          }
        } catch {
          // non-critical
        }

        // Leaderboard check (basic: if top XP changed)
        try {
          const { data: lb } = await supabase
            .from("users")
            .select("id, total_xp")
            .order("total_xp", { ascending: false })
            .limit(10);

          const myRank = lb?.findIndex((u: any) => u.id === userId) ?? -1;
          if (myRank >= 0 && myRank < 3) {
            setTimeout(() => play("leaderboard"), 1200);
          }
        } catch {
          // leaderboard check is non-critical
        }
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render exercise with feedback ────────────────────────────────────────
  const renderExercise = () => {
    if (!currentExercise) return null;

    const props = {
      exercise: currentExercise,
      onSubmit: handleExerciseSubmit,
      disabled: false,
      showFeedbackInline: true,
    };

    const exerciseComponent = (() => {
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
          return (
            <SpeakExercise
              {...props}
              language={ttsLanguage}
              onMicStart={() => play("mic_on")}
            />
          );
        case "REORDER":
          return <Reorder {...props} language={ttsLanguage} />;
        case "WRITING":
        case "ERROR_CORRECTION":
        case "LISTENING":
          return <Listening {...props} language={ttsLanguage} />;
        default:
          return <div>Unknown exercise type</div>;
      }
    })();

    return (
      <>
        {exerciseComponent}
        {/* Feedback banner — shown for non-SPEAK exercises */}
        {lastAnswerResult?.show &&
          currentExercise.exercise_type !== "SPEAK" && (
            <AnswerFeedback
              correct={lastAnswerResult.correct}
              correctAnswer={lastAnswerResult.correctAnswer}
              hint={lastAnswerResult.hint}
              explanation={lastAnswerResult.explanation}
            />
          )}
      </>
    );
  };

  // Exit confirm modal
  const ExitConfirmModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Leave lesson?</h3>
        <p className="text-gray-600 mb-6">Your progress will be saved.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowExitConfirm(false)} className="flex-1">
            Stay
          </Button>
          <Button onClick={() => router.push(`/learn/${language}/${level}`)} className="flex-1">
            Leave
          </Button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER: INTRO
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === "intro") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10 lesson-header">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button onClick={() => setShowExitConfirm(true)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <LessonProgressBar currentPhase={currentPhase} phases={phases} phaseProgress={0} level={level} />
            <div className="w-9" />
          </div>
        </div>
        {showExitConfirm && <ExitConfirmModal />}
        <CelebrationOverlay type={celebration} onDone={() => setCelebration(null)} />

        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                {lesson.lesson_type}
              </span>
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <Clock className="w-4 h-4" />
                {lesson.estimated_minutes} min
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
            {content.introduction?.text && (
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">{content.introduction.text}</p>
            )}
            {content.introduction?.culturalNote && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-amber-800">{content.introduction.culturalNote}</p>
              </div>
            )}
            {content.summary?.keyPoints && content.summary.keyPoints.length > 0 && (
              <div className="bg-primary-50 rounded-xl p-6 mb-6">
                <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  What you'll learn
                </h2>
                <ul className="space-y-2">
                  {content.summary.keyPoints.slice(0, 5).map((point: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {hasVocabulary && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{content.vocabulary.length}</div>
                  <div className="text-sm text-gray-500">Words</div>
                </div>
              )}
              {hasGrammar && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{content.grammar.length}</div>
                  <div className="text-sm text-gray-500">Grammar</div>
                </div>
              )}
              {hasDialogue && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">1</div>
                  <div className="text-sm text-gray-500">Dialogue</div>
                </div>
              )}
              {exercises.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{exercises.length}</div>
                  <div className="text-sm text-gray-500">Exercises</div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 text-secondary mb-6">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">+{lesson.xp_reward} XP</span>
            </div>
            <div className="space-y-3">
              <Button onClick={goToNextPhase} className="w-full gap-2">
                Start Learning <ArrowRight className="w-4 h-4" />
              </Button>
              {exercises.length > 0 && (
                <button onClick={skipToExercises} className="w-full py-2 text-sm text-gray-500 hover:text-primary">
                  I know this — skip to practice →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: VOCABULARY
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === "vocabulary") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10 lesson-header">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <button onClick={() => setShowExitConfirm(true)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex-1">
              <LessonProgressBar currentPhase={currentPhase} phases={phases} phaseProgress={phaseProgress} level={level} />
            </div>
          </div>
        </div>
        {showExitConfirm && <ExitConfirmModal />}
        <CelebrationOverlay type={celebration} onDone={() => setCelebration(null)} />
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full py-6">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2 px-4">Vocabulary</h2>
          <p className="text-center text-gray-500 mb-6 px-4">Learn these words before practicing</p>
          <div className="flex-1">
            <VocabularyCards
              vocabulary={content.vocabulary}
              language={ttsLanguage}
              onComplete={goToNextPhase}
              onProgress={setPhaseProgress}
            />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: GRAMMAR
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === "grammar") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10 lesson-header">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <button onClick={() => setShowExitConfirm(true)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex-1">
              <LessonProgressBar currentPhase={currentPhase} phases={phases} phaseProgress={phaseProgress} level={level} />
            </div>
          </div>
        </div>
        {showExitConfirm && <ExitConfirmModal />}
        <CelebrationOverlay type={celebration} onDone={() => setCelebration(null)} />
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
          <GrammarSection grammar={content.grammar} language={ttsLanguage} onComplete={goToNextPhase} onProgress={setPhaseProgress} />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: DIALOGUE
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === "dialogue") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10 lesson-header">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <button onClick={() => setShowExitConfirm(true)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex-1">
              <LessonProgressBar currentPhase={currentPhase} phases={phases} phaseProgress={phaseProgress} level={level} />
            </div>
          </div>
        </div>
        {showExitConfirm && <ExitConfirmModal />}
        <CelebrationOverlay type={celebration} onDone={() => setCelebration(null)} />
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
          <DialogueViewer
            title={content.dialogue.title}
            context={content.dialogue.context}
            lines={content.dialogue.lines}
            speakers={content.dialogue.speakers}
            image={content.dialogue.image}
            language={ttsLanguage}
            onComplete={goToNextPhase}
          />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: CULTURE
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === "culture") {
    const culture = content.culture;
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10 lesson-header">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <button onClick={() => setShowExitConfirm(true)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex-1">
              <LessonProgressBar currentPhase={currentPhase} phases={phases} phaseProgress={100} level={level} />
            </div>
          </div>
        </div>
        {showExitConfirm && <ExitConfirmModal />}
        <CelebrationOverlay type={celebration} onDone={() => setCelebration(null)} />
        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🌍</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{culture.title}</h2>
            <p className="text-gray-600 mb-4">{culture.text}</p>
            {culture.funFact && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-amber-800">{culture.funFact}</p>
              </div>
            )}
            <Button onClick={goToNextPhase} className="w-full">Continue</Button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: PRACTICE INTRO
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === "practice-intro") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10 lesson-header">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <button onClick={() => setShowExitConfirm(true)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex-1">
              <LessonProgressBar currentPhase={currentPhase} phases={phases} phaseProgress={0} level={level} />
            </div>
          </div>
        </div>
        {showExitConfirm && <ExitConfirmModal />}
        <CelebrationOverlay type={celebration} onDone={() => setCelebration(null)} />
        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to practice?</h2>
            <p className="text-gray-600 mb-6">
              You've learned the vocabulary and grammar. Now let's test your knowledge with {exercises.length} exercises!
            </p>
            <div className="flex items-center justify-center gap-4 mb-6 text-sm text-gray-500">
              <span>✓ {content.vocabulary?.length || 0} words</span>
              {hasGrammar && <span>✓ {content.grammar.length} grammar points</span>}
            </div>
            <Button onClick={goToNextPhase} className="w-full gap-2">
              Start Practice <ArrowRight className="w-4 h-4" />
            </Button>
            <button onClick={goToPreviousPhase} className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-primary">
              ← Review vocabulary first
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: EXERCISES
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === "exercises") {
    const exerciseProgress = ((currentExerciseIndex + 1) / totalExercises) * 100;
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10 lesson-header">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <button onClick={() => setShowExitConfirm(true)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex-1">
              <LessonProgressBar currentPhase={currentPhase} phases={phases} phaseProgress={exerciseProgress} level={level} />
            </div>
          </div>
        </div>
        {showExitConfirm && <ExitConfirmModal />}
        <CelebrationOverlay type={celebration} onDone={() => setCelebration(null)} />

        <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
          <div className="text-center mb-4">
            <span className="text-sm text-gray-500">
              Question {currentExerciseIndex + 1} of {totalExercises}
            </span>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            {renderExercise()}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: WRONG REVIEW
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === "wrong-review") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-10 lesson-header">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-bold text-gray-900">Review Your Mistakes</h2>
          </div>
        </div>
        <CelebrationOverlay type={celebration} onDone={() => setCelebration(null)} />

        <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
          <p className="text-gray-600 mb-6">
            You got {wrongAnswers.length} question{wrongAnswers.length > 1 ? "s" : ""} wrong. Let's review them:
          </p>

          <div className="space-y-4 mb-8">
            {wrongAnswers.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-red-400">
                <p className="font-medium text-gray-900 mb-3">{item.exercise.question}</p>

                {/* Your answer vs correct answer */}
                <div className="space-y-2 mb-3">
                  {item.userAnswer && (
                    <div className="flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-red-500 font-medium">Your answer</p>
                        <p className="text-sm text-red-800">
                          {typeof item.userAnswer === "string"
                            ? item.userAnswer
                            : JSON.stringify(item.userAnswer)}
                        </p>
                      </div>
                    </div>
                  )}
                  {item.correctAnswer && (
                    <div className="flex items-start gap-2 bg-green-50 rounded-lg px-3 py-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-green-600 font-medium">Correct answer</p>
                        <p className="text-sm text-green-800 font-semibold">
                          {typeof item.correctAnswer === "string"
                            ? item.correctAnswer
                            : JSON.stringify(item.correctAnswer)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hint */}
                {item.exercise.hint && (
                  <p className="text-xs text-gray-500 italic mt-2">
                    💡 {item.exercise.hint}
                  </p>
                )}

                {/* Explanation */}
                {item.exercise.explanation && (
                  <div className="bg-blue-50 rounded-lg p-3 mt-3">
                    <p className="text-sm text-blue-800">📖 {item.exercise.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button onClick={() => completeLesson(false)} className="w-full">
            Continue to Results
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: COMPLETE
  // ═══════════════════════════════════════════════════════════════
  if (currentPhase === "complete") {
    const passed = scorePercent >= 70;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-6">
        <CelebrationOverlay type={celebration} onDone={() => setCelebration(null)} />
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${passed ? "bg-green-100" : "bg-orange-100"}`}>
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
              : "You need 70% to pass. Review and try again!"}
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

          {passed && showFreeDailyLimitCTA && (
            <div className="mb-6 rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/10 via-amber-50 to-white p-5 text-left">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">You've used your free daily lesson 🎯</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Upgrade to Premium for <span className="font-semibold">unlimited lessons today</span> — keep your momentum going.
                  </p>
                  <Button
                    onClick={() => router.push("/pricing")}
                    className="mt-3 w-full"
                  >
                    See Premium plans
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {passed ? (
              <Button onClick={() => router.push(`/learn/${language}/${level}`)} className="w-full">
                Continue to Next Lesson
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setCurrentPhase("intro");
                  setCurrentExerciseIndex(0);
                  setAnswers({});
                  setWrongAnswers([]);
                  setPhaseProgress(0);
                  setLastAnswerResult(null);
                }}
                className="w-full"
              >
                Try Again
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push(`/learn/${language}/${level}`)} className="w-full">
              Back to Course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}