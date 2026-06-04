// Category page: lessons in one category, filterable by CEFR level.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublishedLessons } from "@/lib/lessons/public-queries";
import { CATEGORY_BY_SLUG } from "@/lib/lessons/categories";
import { getLevelTheme } from "@/lib/lessons/level-theme";
import { LessonCard } from "@/components/library/lesson-card";
import { PublicShell } from "@/components/layout/public-shell";

export const dynamic = "force-dynamic";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = CATEGORY_BY_SLUG[category];
  return { title: cat ? `${cat.name} | FrancoLink` : "Lessons | FrancoLink" };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const { category } = await params;
  const { level } = await searchParams;
  const cat = CATEGORY_BY_SLUG[category];
  if (!cat) notFound();

  const all = await getPublishedLessons();
  const inCat = all.filter((l) => l.category === category);
  const presentLevels = LEVELS.filter((lv) => inCat.some((l) => l.level === lv));
  const shown = level ? inCat.filter((l) => l.level === level) : inCat;

  return (
    <PublicShell>
    <div className="min-h-screen bg-slate-50">
      <header className={`bg-gradient-to-br ${cat.gradient}`}>
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Link href="/library" className="inline-flex items-center gap-1 text-sm text-white/90 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All materials
          </Link>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-5xl drop-shadow">{cat.emoji}</span>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-sm">{cat.name}</h1>
              <p className="mt-1 max-w-xl text-sm text-white/90">{cat.description}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Level filter */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Link
            href={`/library/${category}`}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              !level ? "bg-slate-900 text-white" : "border bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            All levels
          </Link>
          {presentLevels.map((lv) => {
            const t = getLevelTheme(lv);
            const active = level === lv;
            return (
              <Link
                key={lv}
                href={`/library/${category}?level=${lv}`}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  active ? `${t.accentBg} text-white` : `border bg-white ${t.accentText} hover:bg-slate-50`
                }`}
              >
                {lv}
              </Link>
            );
          })}
          <span className="ml-auto text-sm text-slate-500">{shown.length} lessons</span>
        </div>

        {shown.length === 0 ? (
          <p className="py-16 text-center text-slate-500">No lessons here yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((l) => (
              <LessonCard key={l.id} lesson={l} />
            ))}
          </div>
        )}
      </main>
    </div>
    </PublicShell>
  );
}
