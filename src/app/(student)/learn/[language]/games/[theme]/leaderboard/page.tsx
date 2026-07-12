// src/app/(student)/learn/[language]/games/[theme]/leaderboard/page.tsx
//
// Student-facing standings for a theme: the top 10 best scores for each game
// type, so kids can see where they rank and replay to climb. Scores come from
// the SECURITY DEFINER game_leaderboard() RPC (best score per player).

import Link from "next/link";
import { ArrowLeft, Trophy, Crown, Medal } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { themeBySlug } from "@/lib/games/themes";

interface Props {
  params: Promise<{ language: string; theme: string }>;
}

// Game types that record scores. Add more here as they get wired to submit.
const GAMES = [
  { slug: "maze-chase", title: "Maze Chase", always: true },
  { slug: "quiz-show", title: "Quiz Show", always: false },
  { slug: "picture-quiz", title: "Picture Quiz", always: false },
  { slug: "listen-find", title: "Listen & Find", always: false },
  { slug: "memory-match", title: "Memory Match", always: false },
];

type Row = { user_id: string; name: string; avatar_url: string | null; best_score: number; plays: number };

function rankBadge(i: number) {
  if (i === 0) return <Crown className="h-4 w-4 text-amber-500" />;
  if (i === 1) return <Medal className="h-4 w-4 text-gray-400" />;
  if (i === 2) return <Medal className="h-4 w-4 text-orange-400" />;
  return <span className="text-xs font-bold text-gray-400">{i + 1}</span>;
}

export default async function ThemeLeaderboardPage({ params }: Props) {
  const { language, theme: themeSlug } = await params;
  const theme = themeBySlug(themeSlug);
  if (!theme) return notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const boards = await Promise.all(
    GAMES.map(async (g) => {
      const { data } = await supabase.rpc("game_leaderboard", {
        p_game: g.slug, p_theme: themeSlug, p_language: language, p_limit: 10,
      });
      return { game: g, rows: (data || []) as Row[] };
    })
  );
  const visible = boards.filter((b) => b.game.always || b.rows.length > 0);

  return (
    <div className="space-y-6">
      <Link
        href={`/learn/${language}/games/${themeSlug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to games
      </Link>

      <header className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-3xl shadow-md">
          🏆
        </div>
        <div>
          <div className="text-sm font-medium uppercase tracking-wider text-amber-600">{theme.label}</div>
          <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">Leaderboard</h1>
        </div>
      </header>

      <p className="text-sm text-gray-500">Top 10 best scores. Beat your score to climb the board! 🚀</p>

      <div className="grid gap-5 lg:grid-cols-2">
        {visible.map(({ game, rows }) => (
          <section key={game.slug} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
              <h2 className="flex items-center gap-2 font-heading font-bold text-primary">
                <Trophy className="h-4 w-4 text-amber-500" /> {game.title}
              </h2>
              <Link
                href={`/learn/${language}/games/${themeSlug}/${game.slug}`}
                className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-[#160c33] hover:bg-amber-300"
              >
                Play →
              </Link>
            </div>

            {rows.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No scores yet — be the first! 🎉</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-400 dark:border-gray-700">
                      <th className="px-4 py-2 font-semibold">Rank</th>
                      <th className="px-2 py-2 font-semibold">Player</th>
                      <th className="px-2 py-2 text-center font-semibold">Plays</th>
                      <th className="px-4 py-2 text-right font-semibold">Best score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {rows.map((r, i) => {
                      const me = r.user_id === user.id;
                      return (
                        <tr key={r.user_id} className={me ? "bg-amber-50 dark:bg-amber-900/20" : ""}>
                          <td className="px-4 py-2.5">
                            <span className="flex h-6 w-6 items-center justify-center">{rankBadge(i)}</span>
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-600 text-xs font-semibold text-white">
                                {r.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={r.avatar_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  (r.name || "P").charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className={`truncate ${me ? "font-semibold text-amber-700 dark:text-amber-300" : "text-gray-800 dark:text-gray-200"}`}>
                                {r.name}{me && " (You)"}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-center tabular-nums text-gray-500 dark:text-gray-400">{r.plays}</td>
                          <td className="px-4 py-2.5 text-right font-bold tabular-nums text-gray-900 dark:text-white">{r.best_score.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
