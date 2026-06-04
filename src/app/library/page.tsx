// Public lesson catalogue — Engoo-style category grid. Guest-accessible.

import Link from "next/link";
import { getPublishedLessons } from "@/lib/lessons/public-queries";
import { CATEGORIES } from "@/lib/lessons/categories";
import { getLevelTheme } from "@/lib/lessons/level-theme";
import { GuestCTA } from "@/components/library/guest-cta";
import { PublicShell } from "@/components/layout/public-shell";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Lesson Materials | FrancoLink",
  description: "Free French lesson materials — search by level or topic.",
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default async function LibraryPage() {
  const lessons = await getPublishedLessons();

  // Aggregate per category: count + which levels are present.
  const byCat = new Map<string, { count: number; levels: Set<string> }>();
  for (const l of lessons) {
    const e = byCat.get(l.category) || { count: 0, levels: new Set<string>() };
    e.count++;
    e.levels.add(l.level);
    byCat.set(l.category, e);
  }

  return (
    <PublicShell>
    <div className="min-h-screen bg-slate-50">
      <GuestCTA />
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Lesson Materials</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            FrancoLink materials are free to browse. Search by level or interest, then study with a
            tutor for the full experience.
          </p>

          {/* CEFR level scale */}
          <div className="mx-auto mt-8 flex max-w-md items-center justify-between">
            {LEVELS.map((lv, i) => {
              const t = getLevelTheme(lv);
              return (
                <div key={lv} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`h-4 w-4 rounded-full ${t.accentBg}`} />
                    <span className="text-[11px] font-semibold text-slate-500">{lv}</span>
                  </div>
                  {i < LEVELS.length - 1 ? <span className="h-0.5 flex-1 bg-slate-200" /> : null}
                </div>
              );
            })}
          </div>
          <div className="mx-auto mt-1 flex max-w-md justify-between px-1 text-[10px] uppercase tracking-wide text-slate-400">
            <span>Beginner</span>
            <span>Intermediate</span>
            <span>Advanced</span>
          </div>

          {/* Search */}
          <form action="/library/search" className="mx-auto mt-8 flex max-w-xl gap-2">
            <input
              name="q"
              type="text"
              placeholder="e.g. business, voyage, famille…"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Search
            </button>
          </form>
        </div>
      </header>

      {/* Category grid */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const agg = byCat.get(cat.slug);
            const count = agg?.count || 0;
            const levels = agg ? LEVELS.filter((l) => agg.levels.has(l)) : [];
            return (
              <Link
                key={cat.slug}
                href={`/library/${cat.slug}`}
                className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`flex h-32 items-center justify-center bg-gradient-to-br ${cat.gradient}`}>
                  <span className="text-6xl drop-shadow-sm transition group-hover:scale-110">
                    {cat.emoji}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">{cat.name}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {count} lessons
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{cat.description}</p>
                  {levels.length ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {levels.map((lv) => {
                        const t = getLevelTheme(lv);
                        return (
                          <span
                            key={lv}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${t.softBg} ${t.softText}`}
                          >
                            {lv}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>

        {lessons.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-500">
            No published lessons yet. Publish lessons from the admin panel to populate the catalogue.
          </p>
        ) : null}
      </main>
    </div>
    </PublicShell>
  );
}
