// Starts "Connect Google Calendar": sends the tutor to Google's consent screen.
//
// CSRF: a random `state` goes both into the Google URL and into a short-lived
// httpOnly cookie; the callback refuses any code whose state doesn't match, so
// nobody can trick a tutor's browser into linking someone else's calendar.

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { authorizeUrl, isGoogleCalendarConfigured } from "@/lib/google-calendar/google";
import { APP_URL } from "@/lib/site/hosts";

export const runtime = "nodejs";

// Next.js route files may only export handlers and config, so the callback
// declares the same name itself.
const STATE_COOKIE = "gcal_oauth_state";

export async function GET() {
  const back = `${APP_URL}/tutor/settings`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${APP_URL}/login`);

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  const role = (me?.role || "").toUpperCase();
  if (role !== "TUTOR" && role !== "ADMIN") {
    return NextResponse.redirect(`${back}?gcal=forbidden`);
  }

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.redirect(`${back}?gcal=unavailable`);
  }

  const state = randomBytes(24).toString("base64url");
  const res = NextResponse.redirect(authorizeUrl(state, user.email ?? undefined));
  res.cookies.set(STATE_COOKIE, `${state}.${user.id}`, {
    httpOnly: true,
    secure: APP_URL.startsWith("https"),
    sameSite: "lax", // must survive the top-level redirect back from Google
    path: "/api/calendar/google",
    maxAge: 600,
  });
  return res;
}
