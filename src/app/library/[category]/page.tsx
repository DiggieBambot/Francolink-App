// Category page: lessons in one category, filterable by CEFR level.

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublishedLessons } from "@/lib/lessons/public-queries";
import { CATEGORY_BY_SLUG } from "@/lib/lessons/categories";
import { getLevelTheme } from "@/lib/lessons/level-theme";
import { LessonCard } from "@/components/library/lesson-card";
import { PublicShell } from "@/components/layout/public-shell";
import { Container } from "@/components/ui";

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
  const cover = inCat.find((l) => l.hero_image_url)?.hero_image_url;

  return (
    <PublicShell>
      <div className="min-h-screen bg-gray-50">
        {/* Photo banner */}
        <header className="relative overflow-hidden">
          <div className={`relative h-56 w-full bg-gradient-to-br sm:h-64 ${cat.gradient}`}>
            {cover ? (
              <Image src={cover} alt={cat.name} fill priority sizes="100vw" className="object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-900/50 to-primary-900/20" />
            <Container className="absolute inset-x-0 bottom-0 max-w-6xl pb-7">
              <Link href="/library" className="inline-flex items-center gap-1 text-sm font-medium text-white/85 hover:text-white">
                <ArrowLeft className="h-4 w-4" /> All materials
              </Link>
              <div className="mt-3 flex items-center gap-4">
                <span className="text-5xl drop-shadow">{cat.emoji}</span>
                <div>
                  <h1 className="font-heading text-3xl font-extrabold text-white drop-shadow-sm sm:text-4xl">{cat.name}</h1>
                  <p className="mt-1 max-w-xl text-sm text-white/85">{cat.description}</p>
                </div>
              </div>
            </Container>
          </div>
        </header>

        <Container className="max-w-6xl py-8">
          {/* Level filter */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Link
              href={`/library/${category}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                !level ? "bg-primary text-white shadow-soft" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
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
                  className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                    active ? `${t.accentBg} text-white shadow-soft` : `border border-gray-200 bg-white ${t.accentText} hover:bg-gray-50`
                  }`}
                >
                  {lv}
                </Link>
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
        </Container>
      </div>
    </PublicShell>
  );
}
