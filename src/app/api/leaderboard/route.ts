// src/app/api/leaderboard/route.ts
//
// The XP leaderboard for the mobile app's Ranks tab — the same query as the
// website's /student/leaderboard page: the top 50 by total XP, narrowed to the
// learner's classmates when they joined through a tutor. Runs as the caller
// (row-level security applies), from a session cookie or the app's bearer
// token. Emails are never returned.
import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { user, supabase } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase
    .from("users")
    .select("referred_by_tutor_id")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("users")
    .select("id, name, total_xp, current_streak, avatar_url, current_level")
    .not("total_xp", "is", null)
    .order("total_xp", { ascending: false })
    .limit(50);
  if (me?.referred_by_tutor_id) query = query.eq("referred_by_tutor_id", me.referred_by_tutor_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const board = (data ?? []).map((u) => ({
    id: u.id,
    name: u.name || "Learner",
    xp: u.total_xp ?? 0,
    streak: u.current_streak ?? 0,
    avatarUrl: u.avatar_url,
    level: u.current_level,
  }));
  return NextResponse.json({
    board,
    me: user.id,
    myRank: board.findIndex((r) => r.id === user.id),
    scope: me?.referred_by_tutor_id ? "classmates" : "everyone",
  });
}
