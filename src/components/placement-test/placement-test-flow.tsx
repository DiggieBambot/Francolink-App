// src/components/placement-test/placement-test-flow.tsx

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { 
  getQuestionsByLanguage,
  getLevelFromScore,
  type PlacementQuestion 
} from "@/lib/placement-test/questions";
import { 
  ArrowRight, 
  Brain, 
  Clock, 
  Target, 
  CheckCircle, 
  XCircle,
  Trophy,
  BookOpen,
  Sparkles,
  Loader2
} from "lucide-react";

interface PlacementTestFlowProps {
  userId: string;
  userName: string;
  language: string;
}

type TestPhase = "intro" | "testing" | "saving" | "complete";

interface TestState {
  currentDifficulty: number;
  questionsAnswered: PlacementQuestion[];
  answersCorrect: boolean[];
  totalScore: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  usedQuestionIds: Set<string>;
}

const MAX_QUESTIONS = 15;
const MIN_QUESTIONS = 10;

// Language display names
const languageNames: Record<string, string> = {
  fr: "French",
  es: "Spanish",
  en: "English",
  de: "German",
};

// Language flags
const languageFlags: Record<string, string> = {
  fr: "🇫🇷",
  es: "🇪🇸",
  en: "🇬🇧",
  de: "🇩🇪",
};

export default function PlacementTestFlow({ userId, userName, language }: PlacementTestFlowProps) {
  const router = useRouter();
  const supabase = createClient();
  
  // Get questions for the selected language
  const placementQuestions = getQuestionsByLanguage(language);
  const languageName = languageNames[language] || "French";
  const languageFlag = languageFlags[language] || "🌍";
  
  const [phase, setPhase] = useState<TestPhase>("intro");
  const [testState, setTestState] = useState<TestState>({
    currentDifficulty: 3,
    questionsAnswered: [],
    answersCorrect: [],
    totalScore: 0,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    usedQuestionIds: new Set()
  });
  
  const [currentQuestion, setCurrentQuestion] = useState<PlacementQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [finalLevel, setFinalLevel] = useState<string>("A1");

  // Get next question based on adaptive algorithm
  const getNextQuestion = useCallback((state: TestState): PlacementQuestion | null => {
    const availableQuestions = placementQuestions.filter(
      q => q.difficulty === state.currentDifficulty && !state.usedQuestionIds.has(q.id)
    );

    if (availableQuestions.length === 0) {
      const lowerQuestions = placementQuestions.filter(
        q => q.difficulty === state.currentDifficulty - 1 && !state.usedQuestionIds.has(q.id)
      );
      const higherQuestions = placementQuestions.filter(
        q => q.difficulty === state.currentDifficulty + 1 && !state.usedQuestionIds.has(q.id)
      );
      
      if (higherQuestions.length > 0) return higherQuestions[0];
      if (lowerQuestions.length > 0) return lowerQuestions[0];
      return null;
    }

    return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  }, [placementQuestions]);

  // Start the test
  const startTest = () => {
    const firstQuestion = getNextQuestion(testState);
    if (firstQuestion) {
      setCurrentQuestion(firstQuestion);
      setTestState(prev => ({
        ...prev,
        usedQuestionIds: new Set([firstQuestion.id])
      }));
      setPhase("testing");
    }
  };

  // Handle answer submission
  const handleSubmit = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    const correct = selectedAnswer === currentQuestion.correctIndex;
    setIsCorrect(correct);
    setShowFeedback(true);

    setTestState(prev => {
      const newScore = correct ? prev.totalScore + currentQuestion.points : prev.totalScore;
      const newConsecutiveCorrect = correct ? prev.consecutiveCorrect + 1 : 0;
      const newConsecutiveWrong = correct ? 0 : prev.consecutiveWrong + 1;

      let newDifficulty = prev.currentDifficulty;
      
      if (correct) {
        if (newConsecutiveCorrect >= 3) {
          newDifficulty = Math.min(6, prev.currentDifficulty + 2);
        } else {
          newDifficulty = Math.min(6, prev.currentDifficulty + 1);
        }
      } else {
        if (newConsecutiveWrong >= 3) {
          newDifficulty = Math.max(1, prev.currentDifficulty - 2);
        } else {
          newDifficulty = Math.max(1, prev.currentDifficulty - 1);
        }
      }

      return {
        ...prev,
        questionsAnswered: [...prev.questionsAnswered, currentQuestion],
        answersCorrect: [...prev.answersCorrect, correct],
        totalScore: newScore,
        consecutiveCorrect: newConsecutiveCorrect,
        consecutiveWrong: newConsecutiveWrong,
        currentDifficulty: newDifficulty
      };
    });
  };

  // Save results to database
  const saveResults = async (score: number, level: string) => {
    setPhase("saving");
    
    try {
      const { error } = await supabase
        .from("users")
        .update({
          placement_test_taken: true,
          placement_test_level: level,
          placement_test_score: score,
          placement_test_taken_at: new Date().toISOString(),
          learning_language: language
        })
        .eq("id", userId);

      if (error) {
        console.error("Error saving placement test results:", error);
      }
    } catch (error) {
      console.error("Error saving placement test results:", error);
    }
    
    setPhase("complete");
  };

  // Continue to next question or finish
  const handleContinue = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);

    const questionsCount = testState.questionsAnswered.length;

    const shouldStop = 
      questionsCount >= MAX_QUESTIONS ||
      (questionsCount >= MIN_QUESTIONS && testState.consecutiveCorrect >= 5) ||
      (questionsCount >= MIN_QUESTIONS && testState.consecutiveWrong >= 5);

    if (shouldStop) {
      const level = getLevelFromScore(testState.totalScore);
      setFinalLevel(level);
      saveResults(testState.totalScore, level);
      return;
    }

    const nextQuestion = getNextQuestion(testState);
    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setTestState(prev => ({
        ...prev,
        usedQuestionIds: new Set([...prev.usedQuestionIds, nextQuestion.id])
      }));
    } else {
      const level = getLevelFromScore(testState.totalScore);
      setFinalLevel(level);
      saveResults(testState.totalScore, level);
    }
  };

  // Skip placement test (start from A1)
  const skipTest = async () => {
    setPhase("saving");
    
    try {
      await supabase
        .from("users")
        .update({
          placement_test_taken: true,
          placement_test_level: "A1",
          placement_test_score: 0,
          placement_test_taken_at: new Date().toISOString(),
          learning_language: language
        })
        .eq("id", userId);
    } catch (error) {
      console.error("Error skipping placement test:", error);
    }
    
    // Dynamic language route
    router.push(`/learn/${language}/a1`);
  };

  const correctCount = testState.answersCorrect.filter(Boolean).length;
  const accuracy = testState.questionsAnswered.length > 0 
    ? Math.round((correctCount / testState.questionsAnswered.length) * 100) 
    : 0;

  const levelDescriptions: Record<string, { title: string; description: string; color: string }> = {
    A1: {
      title: "Beginner",
      description: `You're starting your ${languageName} journey! We'll begin with the basics: greetings, numbers, and essential phrases.`,
      color: "bg-green-500"
    },
    A2: {
      title: "Elementary",
      description: `You have some ${languageName} basics! We'll build on your foundation with everyday conversations and simple grammar.`,
      color: "bg-green-600"
    },
    B1: {
      title: "Intermediate",
      description: `Great progress! You can handle most everyday situations. We'll work on more complex grammar and vocabulary.`,
      color: "bg-primary-500"
    },
    B2: {
      title: "Upper Intermediate",
      description: `Impressive! You communicate effectively in ${languageName}. We'll refine your skills with nuanced expressions.`,
      color: "bg-primary"
    },
    C1: {
      title: "Advanced",
      description: `Excellent! You're highly proficient. We'll focus on sophisticated language and cultural nuances.`,
      color: "bg-purple-500"
    },
    C2: {
      title: "Mastery",
      description: `Outstanding! You have near-native proficiency. We'll polish your skills with literary and academic ${languageName}.`,
      color: "bg-purple-600"
    }
  };

  // INTRO PHASE
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">{languageFlag}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {languageName} Placement Test
          </h1>
          <p className="text-gray-600">
            Hi {userName}! Let&apos;s find your {languageName} level.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="font-bold text-gray-900 mb-4">How it works:</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Adaptive Questions</h3>
                <p className="text-gray-600 text-sm">Questions adjust to your level. Answer correctly to get harder questions!</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">10-15 Questions</h3>
                <p className="text-gray-600 text-sm">Takes about 5-10 minutes. No time limit per question.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Personalized Path</h3>
                <p className="text-gray-600 text-sm">We&apos;ll recommend the perfect starting level for you.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <p className="text-amber-800 text-sm">
            💡 <strong>Tip:</strong> Answer honestly! It&apos;s okay to guess if you&apos;re unsure - this helps us find your true level.
          </p>
        </div>

        <Button onClick={startTest} className="w-full gap-2" size="lg">
          Start Placement Test
          <ArrowRight className="w-5 h-5" />
        </Button>

        <p className="text-center text-gray-500 text-sm mt-4">
          Complete beginner?{" "}
          <button 
            onClick={skipTest}
            className="text-primary hover:underline"
          >
            Skip and start from A1
          </button>
        </p>
      </div>
    );
  }

  // TESTING PHASE
  if (phase === "testing" && currentQuestion) {
    const progress = (testState.questionsAnswered.length / MAX_QUESTIONS) * 100;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Question {testState.questionsAnswered.length + 1}</span>
            <span>Score: {testState.totalScore}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              currentQuestion.level === "A1" || currentQuestion.level === "A2" 
                ? "bg-green-100 text-green-700"
                : currentQuestion.level === "B1" || currentQuestion.level === "B2"
                  ? "bg-primary-100 text-primary"
                  : "bg-purple-100 text-purple-700"
            }`}>
              {currentQuestion.level}
            </span>
            <span className="text-xs text-gray-400">
              +{currentQuestion.points} points
            </span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !showFeedback && setSelectedAnswer(index)}
                disabled={showFeedback}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  showFeedback
                    ? index === currentQuestion.correctIndex
                      ? "border-green-500 bg-green-50"
                      : selectedAnswer === index
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 opacity-50"
                    : selectedAnswer === index
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    showFeedback
                      ? index === currentQuestion.correctIndex
                        ? "border-green-500 bg-green-500 text-white"
                        : selectedAnswer === index
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-gray-300"
                      : selectedAnswer === index
                        ? "border-primary bg-primary text-white"
                        : "border-gray-300"
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {showFeedback && (
            <div className={`p-4 rounded-xl mb-4 ${
              isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            }`}>
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${isCorrect ? "text-green-800" : "text-red-800"}`}>
                    {isCorrect ? `Correct! +${currentQuestion.points} points` : "Not quite right"}
                  </p>
                  <p className={`text-sm mt-1 ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!showFeedback ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="w-full"
            >
              Check Answer
            </Button>
          ) : (
            <Button onClick={handleContinue} className="w-full">
              Continue
            </Button>
          )}
        </div>
      </div>
    );
  }

  // SAVING PHASE
  if (phase === "saving") {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Calculating your level...</h2>
        <p className="text-gray-600">Please wait while we analyze your results.</p>
      </div>
    );
  }

  // COMPLETE PHASE
  if (phase === "complete") {
    const levelInfo = levelDescriptions[finalLevel];

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className={`w-24 h-24 ${levelInfo.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Level: {finalLevel}
          </h1>
          <p className="text-xl text-gray-600">
            {levelInfo.title}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{testState.totalScore}</div>
            <div className="text-sm text-gray-500">Points</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{correctCount}/{testState.questionsAnswered.length}</div>
            <div className="text-sm text-gray-500">Correct</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{accuracy}%</div>
            <div className="text-sm text-gray-500">Accuracy</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 ${levelInfo.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 mb-2">Your Personalized Path</h2>
              <p className="text-gray-600">{levelInfo.description}</p>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 text-primary font-medium mb-2">
            <Sparkles className="w-5 h-5" />
            Recommended for you
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {languageName} {finalLevel} Course
          </h3>
          <p className="text-gray-600 text-sm">
            Start with content matched to your current level.
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => router.push(`/learn/${language}/${finalLevel.toLowerCase()}`)}
            className="w-full gap-2"
            size="lg"
          >
            Start {languageName} {finalLevel}
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          {finalLevel !== "A1" && (
            <Button 
              variant="outline"
              onClick={() => router.push(`/learn/${language}/a1`)}
              className="w-full"
            >
              Start from A1 instead
            </Button>
          )}
          
          <Button 
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return null;
}