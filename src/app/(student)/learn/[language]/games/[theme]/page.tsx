// src/app/(student)/learn/[language]/games/[theme]/page.tsx
//
// Once a theme is picked, choose a game type (Picture Quiz / Listen & Find /
// Memory Match). The theme's emoji + label sit at the top so the user knows
// which theme will be played.

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Camera, Headphones, Layers, Trophy, Rocket } from "lucide-react";
import { notFound } from "next/navigation";
import { themeBySlug, themeIcon } from "@/lib/games/themes";

interface Props {
  params: Promise<{ language: string; theme: string }>;
}

const GAMES = [
  { slug: "quiz-show",    title: "Quiz Show",     tagline: "Beat the clock. Build a streak.", icon: Trophy, gradient: "from-fuchsia-500 to-purple-600" },
  { slug: "word-race",    title: "Word Race",     tagline: "Answer fast — outrun the robot!", icon: Rocket, gradient: "from-rose-500 to-red-600" },
  { slug: "picture-quiz", title: "Picture Quiz",  tagline: "See a picture, tap the word.", icon: Camera, gradient: "from-amber-400 to-orange-500" },
  { slug: "listen-find",  title: "Listen & Find", tagline: "Hear a word, tap the picture.", icon: Headphones, gradient: "from-sky-400 to-blue-500" },
  { slug: "memory-match", title: "Memory Match",  tagline: "Flip cards. Pair word with picture.", icon: Layers, gradient: "from-emerald-400 to-teal-500" },
];

export default async function ThemePage({ params }: Props) {
  const { language, theme: themeSlug } = await params;
  const theme = themeBySlug(themeSlug);
  if (!theme) return notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/learn/${language}/games`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> All themes
      </Link>

      <header className="flex items-center gap-4">
        <div className={`h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} p-1.5 shadow-md`}>
          <Image
            src={themeIcon(theme.slug)}
            alt=""
            width={64}
            height={64}
            className="h-full w-full rounded-xl bg-white/95 object-cover"
            unoptimized
          />
        </div>
        <div>
          <div className="text-sm font-medium uppercase tracking-wider text-amber-600">{theme.label}</div>
          <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">Pick a game</h1>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => {
          const Icon = g.icon;
          return (
            <Link
              key={g.slug}
              href={`/learn/${language}/games/${theme.slug}/${g.slug}`}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${g.gradient} p-6 text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl`}
            >
              <Icon className="mb-4 h-10 w-10 opacity-90 transition-transform group-hover:scale-110" />
              <h2 className="font-heading text-xl font-bold">{g.title}</h2>
              <p className="mt-1 text-sm text-white/90">{g.tagline}</p>
              <span className="mt-4 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                Play →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
