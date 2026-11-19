// Google sends the tutor back here after the consent screen.
//
// Checks state, exchanges the code, confirms the calendar scopes were actually
// granted (Google lets people untick boxes), stores the refresh token
// encrypted, and pushes the tutor's upcoming lessons so the calendar is
// populated straight away rather than lesson-by-lesson as they change.

import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  emailFromIdToken,
  exchangeCode,
  forgetAccessToken,
  revokeToken,
} from "@/lib/google-calendar/google";
import { seal } from "@/lib/google-calendar/crypto";
import { pushBooking } from "@/lib/google-calendar/sync";
import { APP_URL } from "@/lib/site/hosts";

export const runtime = "nodejs";

const STATE_COOKIE = "gcal_oauth_state";
const EVENTS_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const FREEBUSY_SCOPE = "https://www.googleapis.com/auth/calendar.freebusy";

function done(status: string) {
  const res = NextResponse.redirect(`${APP_URL}/tutor/settings?gcal=${status}#google-calendar`);
  res.cookies.set(STATE_COOKIE, "", { path: "/api/calendar/google", maxAge: 0 });
  return res;
}

function sameString(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (url.searchParams.get("error")) return done("cancelled");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const [cookieState, cookieUser] = (request.cookies.get(STATE_COOKIE)?.value || "").split(".");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !code || !cookieState || !sameString(state, cookieState) || cookieUser !== user.id) {
    return done("error");
  }

  let tokens;
  try {
    tokens = await exchangeCode(code);
  } catch (e) {
    console.error("[gcal/callback] code exchange failed", e);
    return done("error");
  }

  const granted = new Set(tokens.scope.split(" "));
  const hasEvents = granted.has(EVENTS_SCOPE) || granted.has("https://www.googleapis.com/auth/calendar");
  const hasBusy = hasEvents || granted.has(FREEBUSY_SCOPE);
  if (!hasEvents || !hasBusy || !tokens.refresh_token) {
    // Partial consent is useless to us; give the access back rather than hold it.
    if (tokens.refresh_token) await revokeToken(tokens.refresh_token);
    else await revokeToken(tokens.access_token);
    return done("scopes");
  }

  const db = createServiceClient();

  // Replacing an earlier connection: revoke the old grant so it doesn't linger.
  const { data: old } = await db
    .from("google_calendar_connections")
    .select("refresh_token_enc")
    .eq("user_id", user.id)
    .maybeSingle();
  if (old?.refresh_token_enc) {
    try {
      const { open } = await import("@/lib/google-calendar/crypto");
      const prev = open(old.refresh_token_enc);
      if (prev !== tokens.refresh_token) await revokeToken(prev);
    } catch {
      /* unreadable old token — nothing to revoke */
    }
  }
  forgetAccessToken(user.id);

  const { error } = await db.from("google_calendar_connections").upsert(
    {
      user_id: user.id,
      google_email: emailFromIdToken(tokens.id_token),
      refresh_token_enc: seal(tokens.refresh_token),
      calendar_id: "primary",
      broken_at: null,
      last_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("[gcal/callback] save failed", error);
    return done("error");
  }

  // A fresh connection may point at a different Google account, so forget
  // what we think is already there and push every upcoming lesson again.
  await db.from("google_calendar_events").delete().eq("user_id", user.id);
  const { data: upcoming } = await db
    .from("bookings")
    .select("id")
    .eq("tutor_id", user.id)
    .eq("status", "confirmed")
    .gte("ends_at", new Date().toISOString())
    .limit(100);
  for (const b of upcoming ?? []) await pushBooking(b.id);

  return done("connected");
}
