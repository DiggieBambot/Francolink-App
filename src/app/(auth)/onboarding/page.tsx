// src/app/(auth)/onboarding/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/client";
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
  const [isLoading, setIsLoading] = useState(false);

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
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={cn(
              "w-3 h-3 rounded-full transition-colors",
              s === step ? "bg-secondary" : s < step ? "bg-secondary/50" : "bg-gray-200"
            )}
          />
        ))}
      </div>

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
            disabled={!selectedLanguage}
            onClick={() => setStep(2)}
          >
            Continue
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 2: Choose Level */}
      {step === 2 && (
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
            <Button variant="secondary" onClick={() => setStep(1)}>
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedLevel}
              onClick={() => setStep(3)}
            >
              Continue
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Choose Goal */}
      {step === 3 && (
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
            <Button variant="secondary" onClick={() => setStep(2)}>
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

      {/* Step 4: Placement Test Choice */}
      {step === 4 && (
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
            onClick={() => setStep(3)}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </div>
      )}
    </Card>
  );
}