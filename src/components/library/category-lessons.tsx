"use client";

import { useState } from "react";
import { getLevelTheme } from "@/lib/lessons/level-theme";
import { LessonCard } from "./lesson-card";
import type { CatalogueLesson } from "@/lib/lessons/public-queries";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Client-side level filter for a category page, so the page reads no
// request-time searchParams and can be ISR-cached.
export function CategoryLessons({ lessons }: { lessons: CatalogueLesson[] }) {
  const [level, setLevel] = useState<string | null>(null);
  const presentLevels = LEVELS.filter((lv) => lessons.some((l) => l.level === lv));
  const shown = level ? lessons.filter((l) => l.level === level) : lessons;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setLevel(null)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
            !level ? "bg-primary text-white shadow-soft" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          All levels
        </button>
        {presentLevels.map((lv) => {
          const t = getLevelTheme(lv);
          const active = level === lv;
          return (
            <button
              key={lv}
              type="button"
              onClick={() => setLevel(lv)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                active ? `${t.accentBg} text-white shadow-soft` : `border border-gray-200 bg-white ${t.accentText} hover:bg-gray-50`
              }`}
            >
              {lv}
            </button>
          );
        })}
        <span className="ml-auto text-sm font-medium text-gray-500">{shown.length} lessons</span>
      </div>

      {shown.length === 0 ? (
        <p className="py-16 text-center text-gray-500">No lessons here yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((l) => (
            <LessonCard key={l.id} lesson={l} />
          ))}
        </div>
      )}
    </>
  );
}
