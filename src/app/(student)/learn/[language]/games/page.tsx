// src/app/(student)/learn/[language]/games/page.tsx
//
// Lobby for the kids' games. Lists the three MVP games as big tappable cards.
// Sits inside the existing Learn flow so the user's current language context
// carries through.

import Link from "next/link";
import { Camera, Headphones, Layers } from "lucide-react";

interface Props {
  params: Promise<{ language: string }>;
}

const GAMES = [
  {
    slug: "picture-quiz",
    title: "Picture Quiz",
    tagline: "See a picture, tap the right word.",
    icon: Camera,
    gradient: "from-amber-400 to-orange-500",
  },
  {
    slug: "listen-find",
    title: "Listen & Find",
    tagline: "Hear a word, tap the matching picture.",
    icon: Headphones,
    gradient: "from-sky-400 to-blue-500",
  },
  {
    slug: "memory-match",
    title: "Memory Match",
    tagline: "Flip cards. Pair the picture with the word.",
    icon: Layers,
    gradient: "from-emerald-400 to-teal-500",
  },
];

export default async function GamesLobbyPage({ params }: Props) {
  const { language } = await params;
  const langName = language.charAt(0).toUpperCase() + language.slice(1);

  return (
    <div className="space-y-6">
      <header>
        <div className="text-sm font-medium uppercase tracking-wider text-amber-600">
          Games
        </div>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          Have fun while you learn {langName}
        </h1>
        <p className="mt-1 text-gray-600">
          Quick, playful rounds drawn from your vocabulary. Great for warm-ups,
          breaks, or a five-minute burst with a kid.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {GAMES.map((g) => {
          const Icon = g.icon;
          return (
            <Link
              key={g.slug}
              href={`/learn/${language}/games/${g.slug}`}
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
