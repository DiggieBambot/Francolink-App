// src/components/dashboard/continue-learning.tsx

import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { Button } from "@/components/ui";
import { ProgressBar } from "@/components/ui/progress-bar";
import { createClient } from "@/lib/supabase/server";

// Language config for display
const languageConfig: Record<string, { name: string; flag: string }> = {
  fr: { name: "French", flag: "🇫🇷" },
  es: { name: "Spanish", flag: "🇪🇸" },
  en: { name: "English", flag: "🇬🇧" },
  de: { name: "German", flag: "🇩🇪" },
  french: { name: "French", flag: "🇫🇷" },
  spanish: { name: "Spanish", flag: "🇪🇸" },
  english: { name: "English", flag: "🇬🇧" },
  german: { name: "German", flag: "🇩🇪" },
};

interface ContinueLearningProps {
  course?: {
    id: string;
    title: string;
    language: string;
    level: string;
    flag: string;
    currentLesson: string;
    progress: number;
    estimatedMinutes: number;
  };
  userLanguage?: string;
  userLevel?: string;
}

export function ContinueLearning({ 
  course, 
  userLanguage = "fr",
  userLevel = "a1" 
}: ContinueLearningProps) {
  // Get language info
  const langInfo = languageConfig[userLanguage] || languageConfig.fr;
  
  const defaultCourse = {
    id: `${userLanguage}-${userLevel}`,
    title: `${langInfo.name} Foundations`,
    language: langInfo.name,
    level: userLevel.toUpperCase(),
    flag: langInfo.flag,
    currentLesson: "Getting Started",
    progress: 0,
    estimatedMinutes: 10,
  };

  const displayCourse = course || defaultCourse;

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <h2 className="text-lg font-heading font-bold text-primary mb-4">
        Continue Learning
      </h2>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{displayCourse.flag}</span>
            <div>
              <h3 className="font-heading font-semibold text-primary">
                {displayCourse.title}
              </h3>
              <p className="text-sm text-gray-500">{displayCourse.currentLesson}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Progress</span>
              <span className="font-medium text-primary">{displayCourse.progress}%</span>
            </div>
            <ProgressBar value={displayCourse.progress} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Link href={`/learn/${userLanguage}/${userLevel}`}>
            <Button size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Continue
            </Button>
          </Link>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{displayCourse.estimatedMinutes} min</span>
          </div>
        </div>
      </div>
    </div>
  );
}