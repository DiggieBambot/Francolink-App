// src/components/dashboard/course-card.tsx

import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ChevronRight } from "lucide-react";

interface CourseCardProps {
  id: string;           // Should be format: "fr-a1" or just "fr"
  title: string;
  flag: string;
  level: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  language?: string;    // Optional: explicit language code
}

export function CourseCard({
  id,
  title,
  flag,
  level,
  progress,
  totalLessons,
  completedLessons,
  language,
}: CourseCardProps) {
  // Build the correct href
  // If language is provided, use it; otherwise parse from id
  let href = `/learn/${id}`;
  
  if (language && level) {
    href = `/learn/${language}/${level.toLowerCase()}`;
  } else if (id.includes("-")) {
    // id format: "fr-a1" or "french-a1"
    const [lang, lvl] = id.split("-");
    href = `/learn/${lang}/${lvl}`;
  }

  return (
    <Link
      href={href}
      className="block bg-white rounded-2xl shadow-soft p-6 hover:shadow-medium hover:-translate-y-1 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{flag}</span>
          <div>
            <h3 className="font-heading font-bold text-primary">{title}</h3>
            <p className="text-sm text-gray-500">Level {level}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {completedLessons} / {totalLessons} lessons
          </span>
          <span className="font-medium text-primary">{progress}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>
    </Link>
  );
}