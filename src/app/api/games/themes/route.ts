// src/app/api/games/themes/route.ts
//
// Returns the list of vocabulary themes for the requested language, each with
// a real count of game-eligible items. A theme's count is the larger of its
// curated set (French only) and its lesson-derived pool, so a fully curated
// theme is listed even when no published lesson covers it. Themes with fewer
// than MIN_ITEMS are hidden so we don't show a card for a game that would fail
// to start.
//
// Query:
//   ?lang=french        (route slug — required)

import { NextRequest, NextResponse } from "next/server";
import { getThemeCounts } from "@/lib/games/theme-counts";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const langSlug = url.searchParams.get("lang") || "french";

  try {
    const themes = await getThemeCounts(langSlug);
    return NextResponse.json({ themes });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load themes" }, { status: 500 });
  }
}
