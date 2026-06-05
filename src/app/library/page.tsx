// Public lesson catalogue — clean & premium category grid. Guest-accessible.

import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { getPublishedLessons } from "@/lib/lessons/public-queries";
import { CATEGORIES } from "@/lib/lessons/categories";
import { getLevelTheme } from "@/lib/lessons/level-theme";
import { GuestCTA } from "@/components/library/guest-cta";
import { PublicShell } from "@/components/layout/public-shell";
import { Container, Eyebrow } from "@/components/ui";
import { LevelExplorer } from "@/components/library/level-explorer";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Lesson Materials | FrancoLink",
  description: "Free French lesson materials — search by level or topic.",
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default async function LibraryPage() {
  const lessons = await getPublishedLessons();

  // Aggregate per category: count, levels present, and a cover photo (first
  // lesson in the category that has a hero image).
  const byCat = new Map<string, { count: number; levels: Set<string>; cover?: string }>();
  for (const l of lessons) {
    const e = byCat.get(l.category) || { count: 0, levels: new Set<string>() };
    e.count++;
    e.levels.add(l.level);
    if (!e.cover && l.hero_image_url) e.cover = l.hero_image_url;
    byCat.set(l.category, e);
  }

  // Lightweight lessons for the client-side level filter.
  const lite = lessons.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    title_translation: l.title_translation,
    level: l.level,
    hero_image_url: l.hero_image_url,
    duration_minutes: l.duration_minutes,
    section_count: l.section_count,
  }));

  return (
    <PublicShell>
      <div className="min-h-screen bg-gray-50">
        <GuestCTA />

        {/* Header / hero */}
        <header className="border-b border-gray-100 bg-white">
          <Container className="max-w-5xl py-14 text-center">
            <Eyebrow>Lesson Library</Eyebrow>
            <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
              Lesson Materials
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
              Free to browse — search by level or interest, then study live with a tutor for the full
              experience.
            </p>

            {/* Search */}
            <form action="/library/search" className="mx-auto mt-8 flex max-w-xl gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 shadow-soft focus-within:border-primary-400">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  name="q"
                  type="text"
                  placeholder="e.g. business, voyage, famille…"
                  className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-gray-400"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-secondary px-6 py-3 text-sm font-heading font-semibold text-white shadow-soft transition hover:bg-secondary-600 hover:shadow-medium"
              >
                Search
              </button>
            </form>
          </Container>
        </header>

        {/* Draggable level filter + category grid (categories when "All") */}
        <Container className="max-w-6xl py-12">
          <LevelExplorer lessons={lite}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const agg = byCat.get(cat.slug);
              const count = agg?.count || 0;
              const levels = agg ? LEVELS.filter((l) => agg.levels.has(l)) : [];
              const cover = agg?.cover;
              return (
                <Link
                  key={cat.slug}
                  href={`/library/${cat.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-medium"
                >
                  {/* Photo header with a colored backdrop so it's never blank
                      (and the white title stays readable while the photo loads) */}
                  <div className={`relative h-44 w-full overflow-hidden bg-gradient-to-br ${cat.gradient}`}>
                    {cover ? (
                      <Image
                        src={cover}
                        alt={cat.name}
                        fill
                        sizes="(max-width:640px) 100vw, 380px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-900/85 via-primary-900/30 to-transparent" />
                    <span className="absolute right-3 top-3 text-2xl drop-shadow">{cat.emoji}</span>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading text-xl font-bold text-white drop-shadow-sm">{cat.name}</h2>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                          {count} lessons
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-sm leading-relaxed text-gray-600">{cat.description}</p>
                    {levels.length ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {levels.map((lv) => {
                          const t = getLevelTheme(lv);
                          return (
                            <span
                              key={lv}
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${t.softBg} ${t.softText}`}
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
          </LevelExplorer>

          {lessons.length === 0 ? (
            <p className="mt-10 text-center text-sm text-gray-500">
              No published lessons yet. Publish lessons from the admin panel to populate the catalogue.
            </p>
          ) : null}
        </Container>
      </div>
    </PublicShell>
  );
}
