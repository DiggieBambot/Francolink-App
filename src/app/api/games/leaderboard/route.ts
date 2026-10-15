// src/app/api/games/leaderboard/route.ts
//
// Returns the best-score ranking for a given game type + theme + language via
// the game_leaderboard() SQL function, plus the caller's own rank if signed in.
//
// Query: ?game=maze-chase&theme=animals&lang=french&limit=20

import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/supabase/request-auth";

type Row = { user_id: string; name: string; avatar_url: string | null; best_score: number; plays: number; last_played: string };

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const game = url.searchParams.get("game") || "";
  const theme = (url.searchParams.get("theme") || "").toLowerCase();
  const language = (url.searchParams.get("lang") || "").toLowerCase();
  const limit = Math.min(50, Math.max(3, Number(url.searchParams.get("limit") || 20)));
  if (!game || !theme || !language) {
    return NextResponse.json({ board: [], error: "missing params" }, { status: 400 });
  }

  // Website (cookie) or mobile app (bearer token); signed out still gets the board.
  const { user, supabase } = await getRequestAuth(req);
  const { data, error } = await supabase.rpc("game_leaderboard", {
    p_game: game, p_theme: theme, p_language: language, p_limit: limit,
  });
  if (error) return NextResponse.json({ board: [], error: error.message }, { status: 200 });

  const board = (data || []) as Row[];
  const myRank = user ? board.findIndex((r) => r.user_id === user.id) : -1;

  return NextResponse.json({ board, me: user?.id ?? null, myRank });
}
