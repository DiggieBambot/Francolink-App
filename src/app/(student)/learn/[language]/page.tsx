"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Star, Trophy } from "lucide-react";
import { useParams } from "next/navigation";

const LEVELS = [
  {
    id: "a1",
    title: "A1 - Beginner",
    description: "Start here! Learn greetings, basic phrases, and survival French.",
    color: "bg-green-100 text-green-700",
    icon: "🌱",
    lessons: 64,
  },
  {
    id: "a2",
    title: "A2 - Elementary",
    description: "Talk about your past, future plans, and daily routine.",
    color: "bg-blue-100 text-blue-700",
    icon: "🚀",
    lessons: 64,
  },
  {
    id: "b1",
    title: "B1 - Intermediate",
    description: "Express opinions, feelings, and deal with most situations.",
    color: "bg-orange-100 text-orange-700",
    icon: "🔥",
    lessons: 64,
  },
  {
    id: "b2",
    title: "B2 - Upper Intermediate",
    description: "Achieve fluency. Understand complex texts and argue effectively.",
    color: "bg-purple-100 text-purple-700",
    icon: "🎓",
    lessons: 64,
  },
];

export default function LevelSelectPage() {
  const params = useParams();
  const language = (params?.language as string) || "french";
  const langName = language.charAt(0).toUpperCase() + language.slice(1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Choose Your Level
        </h1>
        <p className="text-xl text-gray-600">
          Learning <span className="font-semibold text-primary">{langName}</span>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {LEVELS.map((level) => (
          <Link
            key={level.id}
            href={`/learn/${language}/${level.id}`}
            className="group relative bg-white rounded-2xl p-6 shadow-sm border-2 border-transparent hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${level.color}`}
              >
                {level.icon}
              </div>
              <div className="bg-gray-50 px-3 py-1 rounded-full text-xs font-medium text-gray-500 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {level.lessons} Lessons
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
              {level.title}
            </h3>
            <p className="text-gray-600 mb-6 line-clamp-2">
              {level.description}
            </p>

            <div className="flex items-center text-primary font-medium text-sm">
              Start Level
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
