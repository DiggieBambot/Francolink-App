// src/app/(auth)/onboarding/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/client";
import { onboardingVariant, type OnboardingVariant } from "@/lib/flags";
import { Button, Card } from "@/components/ui";
import { ChevronRight, ChevronLeft, Loader2, Brain, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const languages = [
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "German", flag: "🇩🇪" },
];

const levels = [
  { value: "beginner", label: "Complete Beginner", description: "I've never learned this language" },
  { value: "basic", label: "Some Basics", description: "I know a few words and phrases" },
  { value: "intermediate", label: "Intermediate", description: "I can have simple conversations" },
  { value: "advanced", label: "Advanced", description: "I'm comfortable but want to improve" },
];

/**
 * Why the learner is here. Slugs are stable — they're written to
 * users.learning_goals and read back by tutor matching — while labels are
 * free to change. "Select all that apply": most people have two or three.
 */
const learningGoals = [
  { value: "career", label: "Grow your career", emoji: "💼" },
  { value: "university", label: "Thrive at university", emoji: "🎓" },
  { value: "exam", label: "Prepare for an exam", emoji: "📝" },
  { value: "fun", label: "Just for fun", emoji: "🎉" },
  { value: "travel", label: "Travel abroad", emoji: "🌍" },
  { value: "family", label: "Talk with family & friends", emoji: "🗣️" },
];

const goals = [
  { value: 5, label: "5 min/day", description: "Casual" },
  { value: 10, label: "10 min/day", description: "Regular" },
  { value: 15, label: "15 min/day", description: "Serious" },
  { value: 30, label: "30 min/day", description: "Intense" },
];

// Language display names for UI
const languageNames: Record<string, string> = {
  fr: "French",
  es: "Spanish",
  en: "English",
  de: "German",
};

// Map short codes to URL slugs for routing
const languageSlugs: Record<string, string> = {
  fr: "french",
  es: "spanish",
  en: "english",
  de: "german",
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedGoal, setSelectedGoal] = useState(15);
  const [selectedLearningGoals, setSelectedLearningGoals] = useState<string[]>([]);
  const [otherGoal, setOtherGoal] = useState("");
  const [otherOpen, setOtherOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [variant, setVariant] = useState<OnboardingVariant>("control");

  // Assign the onboarding experiment bucket once, on mount. Deterministic per
  // user, so the analytics can re-derive the same bucket later.
  useEffect(() => {
    let done = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (done || !user) return;
      const v = onboardingVariant(user.id);
      setVariant(v);
      trackEvent("onboarding_assigned", { once: "onboarding_assigned", metadata: { variant: v } });
    })();
    return () => { done = true; };
  }, [supabase]);

  // Fast variant: skip the level/goal/placement screens entirely and drop the
  // student straight into their first A1 lesson with sensible defaults. Placement
  // is deferred — the dashboard's "find your level" banner picks it up later.
  const handleFastStart = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("users")
          .update({ daily_goal_minutes: 15, learning_language: selectedLanguage })
          .eq("id", user.id);
        await supabase
          .from("user_languages")
          .upsert(
            { user_id: user.id, language_code: selectedLanguage, is_active: true, placement_taken: false },
            { onConflict: "user_id,language_code" }
          );
      }
      const slug = languageSlugs[selectedLanguage] || selectedLanguage;
      router.push(`/learn/${slug}/a1`);
      router.refresh();
    } catch (error) {
      console.error("Error starting fast onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Save daily goal AND learning language to database
        await supabase
          .from("users")
          .update({
            daily_goal_minutes: selectedGoal,
            learning_language: selectedLanguage,
          })
          .eq("id", user.id);

        // Written on its own rather than folded into the update above: these
        // two columns arrive with a migration, and if it hasn't been applied
        // yet a combined update would take the language and daily goal down
        // with it. A missing goal is survivable; a lost language isn't.
        const { error: goalsError } = await supabase
          .from("users")
          .update({
            learning_goals:
              otherOpen && otherGoal.trim()
                ? [...selectedLearningGoals, "other"]
                : selectedLearningGoals,
            learning_goal_other: otherOpen && otherGoal.trim() ? otherGoal.trim() : null,
          })
          .eq("id", user.id);
        if (goalsError) console.error("Could not save learning goals:", goalsError);

        trackEvent("onboarding_goals_selected", {
          metadata: {
            goals: selectedLearningGoals,
            has_other: otherOpen && Boolean(otherGoal.trim()),
          },
        });

        // Create user_languages row for the selected language
        await supabase
          .from("user_languages")
          .upsert({
            user_id: user.id,
            language_code: selectedLanguage,
            is_active: true,
            placement_taken: false,
          }, { onConflict: "user_id,language_code" });
      }

      // Move to step 4 (placement test choice)
      setStep(4);
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipPlacement = async () => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Mark placement as skipped, default to A1
        await supabase
          .from("users")
          .update({
            placement_test_taken: true,
            placement_test_level: "A1",
            placement_test_score: 0,
            learning_language: selectedLanguage,
          })
          .eq("id", user.id);

        // Create/update user_languages row
        await supabase
          .from("user_languages")
          .upsert({
            user_id: user.id,
            language_code: selectedLanguage,
            is_active: true,
            placement_taken: true,
            placement_level: "A1",
            placement_score: 0,
            placement_taken_at: new Date().toISOString(),
          }, { onConflict: "user_id,language_code" });
      }

      trackEvent("placement_completed", { metadata: { level: "A1", score: 0, skipped: true } });

      // Redirect to the selected language using slug for route
      const slug = languageSlugs[selectedLanguage] || selectedLanguage;
      router.push(`/learn/${slug}/a1`);
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePlacementTest = () => {
    // Pass language as query parameter
    router.push(`/placement-test?lang=${selectedLanguage}`);
  };

  const selectedLanguageName = languageNames[selectedLanguage] || "your language";

  return (
    <Card className="w-full max-w-lg">
      {/* Progress Indicator — hidden in the fast variant (single step). */}
      {variant === "control" && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                s === step ? "bg-secondary" : s < step ? "bg-secondary/50" : "bg-gray-200"
              )}
            />
          ))}
        </div>
      )}

      {/* Step 1: Choose Language */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary text-center mb-2">
            What do you want to learn?
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Choose your target language
          </p>

          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer",
                  selectedLanguage === lang.code
                    ? "border-secondary bg-secondary-50"
                    : "border-gray-200 hover:border-secondary/50"
                )}
              >
                <span className="text-4xl">{lang.flag}</span>
                <span className="font-heading font-semibold text-primary text-lg">
                  {lang.name}
                </span>
              </button>
            ))}
          </div>

          <Button
            className="w-full mt-8"
            disabled={!selectedLanguage || isLoading}
            onClick={variant === "fast" ? handleFastStart : () => setStep(2)}
          >
            {variant === "fast" ? (isLoading ? "Starting…" : "Start learning") : "Continue"}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          {variant === "fast" && (
            <p className="mt-3 text-center text-xs text-gray-400">
              Jump right in — we&apos;ll help you find your exact level after your first lesson.
            </p>
          )}
        </div>
      )}

      {/* Step 2: Learning goals — what they're here for, not just how they'll
          practise. Multi-select: a learner preparing for the DELF is usually
          also travelling. */}
      {step === 2 && (
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary text-center mb-2">
            What are your learning goals?
          </h1>
          <p className="text-gray-600 text-center mb-8">Select all that apply</p>

          <div className="flex flex-wrap gap-2.5 justify-center">
            {learningGoals.map((goal) => {
              const on = selectedLearningGoals.includes(goal.value);
              return (
                <button
                  key={goal.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setSelectedLearningGoals((prev) =>
                      prev.includes(goal.value)
                        ? prev.filter((g) => g !== goal.value)
                        : [...prev, goal.value]
                    )
                  }
                  className={cn(
                    "px-4 py-2.5 rounded-xl border-2 font-heading font-semibold text-sm transition-all cursor-pointer inline-flex items-center gap-2",
                    on
                      ? "border-secondary bg-secondary-50 text-primary"
                      : "border-gray-200 text-gray-600 hover:border-secondary/50"
                  )}
                >
                  <span aria-hidden="true">{goal.emoji}</span>
                  {goal.label}
                </button>
              );
            })}

            <button
              type="button"
              aria-pressed={otherOpen}
              onClick={() => setOtherOpen((v) => !v)}
              className={cn(
                "px-4 py-2.5 rounded-xl border-2 font-heading font-semibold text-sm transition-all cursor-pointer",
                otherOpen
                  ? "border-secondary bg-secondary-50 text-primary"
                  : "border-gray-200 text-gray-600 hover:border-secondary/50"
              )}
            >
              Other goal…
            </button>
          </div>

          {otherOpen && (
            <input
              type="text"
              value={otherGoal}
              onChange={(e) => setOtherGoal(e.target.value)}
              maxLength={120}
              autoFocus
              placeholder="Tell us in a few words"
              className="w-full mt-4 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-secondary focus:outline-none text-primary"
            />
          )}

          <p className="mt-6 text-sm text-gray-500 text-center">
            We match you with tutors based on your goal, level and availability.
          </p>

          <div className="flex gap-3 mt-8">
            <Button variant="secondary" onClick={() => setStep(1)}>
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={
                selectedLearningGoals.length === 0 &&
                !(otherOpen && otherGoal.trim())
              }
              onClick={() => {
                // "Other" with nothing typed is not a goal — drop it rather
                // than storing a slug the matcher can't do anything with.
                if (otherOpen && !otherGoal.trim()) setOtherOpen(false);
                setStep(3);
              }}
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Choose Level */}
      {step === 3 && (
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary text-center mb-2">
            What&apos;s your current level?
          </h1>
          <p className="text-gray-600 text-center mb-8">
            We&apos;ll personalize your experience
          </p>

          <div className="space-y-3">
            {levels.map((level) => (
              <button
                key={level.value}
                onClick={() => setSelectedLevel(level.value)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer",
                  selectedLevel === level.value
                    ? "border-secondary bg-secondary-50"
                    : "border-gray-200 hover:border-secondary/50"
                )}
              >
                <span className="font-heading font-semibold text-primary block">
                  {level.label}
                </span>
                <span className="text-sm text-gray-500">{level.description}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-8">
            <Button variant="secondary" onClick={() => setStep(2)}>
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedLevel}
              onClick={() => setStep(4)}
            >
              Continue
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Choose Goal */}
      {step === 4 && (
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary text-center mb-2">
            Set your daily goal
          </h1>
          <p className="text-gray-600 text-center mb-8">
            How much time can you commit each day?
          </p>

          <div className="grid grid-cols-2 gap-3">
            {goals.map((goal) => (
              <button
                key={goal.value}
                onClick={() => setSelectedGoal(goal.value)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-center cursor-pointer",
                  selectedGoal === goal.value
                    ? "border-secondary bg-secondary-50"
                    : "border-gray-200 hover:border-secondary/50"
                )}
              >
                <span className="font-heading font-bold text-primary text-xl block">
                  {goal.label}
                </span>
                <span className="text-sm text-gray-500">{goal.description}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-8">
            <Button variant="secondary" onClick={() => setStep(3)}>
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleComplete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Setting up...
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Placement Test Choice */}
      {step === 5 && (
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary text-center mb-2">
            How would you like to start?
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Take a quick {selectedLanguageName} test or start from the beginning
          </p>

          <div className="space-y-4">
            <button
              onClick={handleTakePlacementTest}
              className="w-full p-6 bg-white border-2 border-primary rounded-xl hover:bg-primary/5 transition text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Take {selectedLanguageName} Placement Test</div>
                  <div className="text-sm text-gray-500">Find your level (5-10 min)</div>
                </div>
              </div>
            </button>

            <button
              onClick={handleSkipPlacement}
              disabled={isLoading}
              className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">
                    {isLoading ? "Setting up..." : "Start from Beginning"}
                  </div>
                  <div className="text-sm text-gray-500">Begin with {selectedLanguageName} A1 basics</div>
                </div>
              </div>
            </button>
          </div>

          <Button
            variant="secondary"
            className="w-full mt-6"
            onClick={() => setStep(4)}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </div>
      )}
    </Card>
  );
}