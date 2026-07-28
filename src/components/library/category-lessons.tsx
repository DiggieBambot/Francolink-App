"use client";

import { useState } from "react";
import { getLevelTheme } from "@/lib/lessons/level-theme";
import { isSyllabusCategory } from "@/lib/lessons/syllabus-order";
import { LessonCard } from "./lesson-card";
import type { CatalogueLesson } from "@/lib/lessons/public-queries";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Fixed display order + label for Daily News's sub-sectors (see
// src/lib/daily-news — lessons carry topic_tags: ["Daily News", <sector>, ...]).
const DAILY_NEWS_SECTOR_ORDER = ["technology", "health", "sports", "entertainment", "world", "science"];
const DAILY_NEWS_SECTOR_LABEL: Record<"en" | "fr", Record<string, string>> = {
  en: { technology: "Technology", health: "Health", sports: "Sports", entertainment: "Entertainment", world: "World", science: "Science" },
  fr: { technology: "Technologie", health: "Santé", sports: "Sport", entertainment: "Divertissement", world: "Monde", science: "Science" },
};

function dailyNewsSector(lesson: CatalogueLesson): string {
  return (lesson.topic_tags?.[1] || "news").toLowerCase();
}

const DAILY_NEWS_SLUGS = new Set(["daily-news", "fr-daily-news"]);

// Client-side level filter for a category page, so the page reads no
// request-time searchParams and can be ISR-cached. When `category` is a
// Daily News section, lessons are additionally grouped under sector headings
// (Technology, Health, Sports, ...) instead of one flat grid.
export function CategoryLessons({ lessons, category }: { lessons: CatalogueLesson[]; category?: string }) {
  const [level, setLevel] = useState<string | null>(null);
  const presentLevels = LEVELS.filter((lv) => lessons.some((l) => l.level === lv));
  const shown = level ? lessons.filter((l) => l.level === level) : lessons;
  const grouped = category ? DAILY_NEWS_SLUGS.has(category) : false;
  const numbered = category ? isSyllabusCategory(category) : false;
  const labels = category === "fr-daily-news" ? DAILY_NEWS_SECTOR_LABEL.fr : DAILY_NEWS_SECTOR_LABEL.en;

  const sections = grouped
    ? DAILY_NEWS_SECTOR_ORDER.map((sector) => ({
        sector,
        label: labels[sector] || sector,
        items: shown.filter((l) => dailyNewsSector(l) === sector),
      })).filter((s) => s.items.length > 0)
    : null;

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
      ) : sections ? (
        <div className="space-y-10">
          {sections.map((s) => (
            <div key={s.sector}>
              <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-primary">
                {s.label}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                  {s.items.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {s.items.map((l) => (
                  <LessonCard key={l.id} lesson={l} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((l, i) => (
            <LessonCard key={l.id} lesson={l} sequence={numbered ? i + 1 : undefined} />
          ))}
        </div>
      )}
    </>
  );
}
