import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { Button } from "@/components/ui";
import { ProgressBar } from "@/components/ui/progress-bar";

interface ContinueLearningProps {
  course?: {
    id: string;
    title: string;
    language: string;
    flag: string;
    currentLesson: string;
    progress: number;
    estimatedMinutes: number;
  };
}

export function ContinueLearning({ course }: ContinueLearningProps) {
  const defaultCourse = {
    id: "french-a1",
    title: "French Foundations",
    language: "French",
    flag: "🇫🇷",
    currentLesson: "Greetings & Introductions",
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
          <Link href={`/learn/${displayCourse.id}`}>
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