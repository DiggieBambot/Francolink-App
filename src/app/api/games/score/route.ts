// src/app/api/games/score/route.ts
//
// Records a finished mini-game for the signed-in player. One row per game so the
// leaderboard can rank by best score. Fails soft: if the game_scores table isn't
// migrated yet, we return ok:false rather than breaking the game UX.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GAMES = new Set(["maze-chase", "memory-match", "picture-quiz", "listen-find", "quiz-show"]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let body: { game?: string; theme?: string; language?: string; score?: number; level?: number; won?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }

  const game = String(body.game || "");
  const theme = String(body.theme || "").toLowerCase();
  const language = String(body.language || "").toLowerCase();
  const score = Math.max(0, Math.min(1_000_000, Math.round(Number(body.score) || 0)));
  if (!GAMES.has(game) || !theme || !language) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const { error } = await supabase.from("game_scores").insert({
    user_id: user.id,
    game,
    theme,
    language,
    score,
    level_reached: body.level != null ? Math.round(Number(body.level)) : null,
    won: !!body.won,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  return NextResponse.json({ ok: true });
}
