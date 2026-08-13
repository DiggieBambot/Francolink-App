// Issues (or rotates) the caller's personal calendar feed URL.
//
// Generated on demand rather than backfilled for everyone — a token nobody has
// subscribed to is just an extra secret sitting in the database.

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import { APP_URL } from "@/lib/site/hosts";

export const runtime = "nodejs";

const Body = z.object({
  /** Revoke the existing token and mint a new one. */
  rotate: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let input = { rotate: false };
  try {
    input = Body.parse(await request.json().catch(() => ({})));
  } catch {
    /* defaults are fine */
  }

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: me } = await db
    .from("users")
    .select("calendar_feed_token")
    .eq("id", user.id)
    .maybeSingle();

  let token = me?.calendar_feed_token as string | null;

  if (!token || input.rotate) {
    // 32 random bytes, url-safe. This is a bearer credential in a URL, so it
    // has to be long enough that guessing is hopeless.
    token = randomBytes(32).toString("base64url");
    const { error } = await db
      .from("users")
      .update({ calendar_feed_token: token })
      .eq("id", user.id);
    if (error) {
      console.error("[calendar/subscribe] token write failed", error);
      return NextResponse.json(
        { error: "Couldn't create your calendar link." },
        { status: 500 }
      );
    }
  }

  const url = `${APP_URL}/api/calendar/${token}.ics`;

  return NextResponse.json({
    ok: true,
    url,
    // webcal:// makes most desktop clients subscribe on click rather than
    // downloading a one-off snapshot.
    webcal: url.replace(/^https?:\/\//, "webcal://"),
    rotated: Boolean(input.rotate),
  });
}
