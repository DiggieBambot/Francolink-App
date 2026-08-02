// src/app/(student)/learn/[language]/games/page.tsx
//
// Theme picker. Server-rendered: counts are computed once (shared with the
// themes API) so the first paint shows the same themes a client fetch would.

import Link from "next/link";
import Image from "next/image";
import { themeIcon } from "@/lib/games/themes";
import { getThemeCounts } from "@/lib/games/theme-counts";

interface Props {
  params: Promise<{ language: string }>;
}

export default async function GamesLobbyPage({ params }: Props) {
  const { language } = await params;
  const langName = language.charAt(0).toUpperCase() + language.slice(1);
  const themes = await getThemeCounts(language);

  return (
    <div className="space-y-6">
      <header>
        <div className="text-sm font-medium uppercase tracking-wider text-amber-600">Games</div>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          Pick a theme to play with
        </h1>
        <p className="mt-1 text-gray-600">
          Quick rounds drawn from your {langName} vocabulary. Tap a theme, then choose a game.
        </p>
      </header>

      {themes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
          No themed vocabulary is ready for {langName} games yet. Check back soon!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {themes.map((t) => (
            <Link
              key={t.slug}
              href={`/learn/${language}/games/${t.slug}/learn`}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.gradient} p-5 text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl`}
            >
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white/95 p-1.5 shadow-sm">
                <Image
                  src={themeIcon(t.slug)}
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full rounded-xl object-cover transition-transform group-hover:scale-105"
                  unoptimized
                />
              </div>
              <h2 className="mt-3 font-heading text-lg font-bold">{t.label}</h2>
              <div className="mt-1 text-xs text-white/85">{t.count} words</div>
              <span className="mt-4 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                Play →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
