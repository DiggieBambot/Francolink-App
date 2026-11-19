// The signed-in tutor's Google Calendar connection.
//
//   GET    — status for the settings card (never returns the token)
//   PATCH  — toggle pushing lessons / blocking busy times
//   DELETE — disconnect: remove our events, revoke the grant, drop the row

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  accessTokenFor,
  deleteEvent,
  forgetAccessToken,
  isGoogleCalendarConfigured,
  revokeToken,
} from "@/lib/google-calendar/google";
import { open } from "@/lib/google-calendar/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await me();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data } = await createServiceClient()
    .from("google_calendar_connections")
    .select("google_email, push_enabled, block_busy, broken_at, last_error, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    available: isGoogleCalendarConfigured(),
    connected: Boolean(data),
    ...(data
      ? {
          email: data.google_email,
          pushEnabled: data.push_enabled,
          blockBusy: data.block_busy,
          broken: Boolean(data.broken_at),
          error: data.last_error,
        }
      : {}),
  });
}

const Patch = z.object({
  pushEnabled: z.boolean().optional(),
  blockBusy: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const user = await me();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = Patch.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.pushEnabled !== undefined) update.push_enabled = parsed.data.pushEnabled;
  if (parsed.data.blockBusy !== undefined) update.block_busy = parsed.data.blockBusy;

  const { error } = await createServiceClient()
    .from("google_calendar_connections")
    .update(update)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });

  // Turning push back on: the reconcile cron fills in anything missed.
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await me();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const db = createServiceClient();
  const { data: conn } = await db
    .from("google_calendar_connections")
    .select("refresh_token_enc, calendar_id, broken_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (conn) {
    // Take our lesson events back out of their calendar — leaving them behind
    // would mean future cancellations never reach it. Best-effort, upcoming only.
    try {
      const refresh = open(conn.refresh_token_enc);
      if (!conn.broken_at) {
        const token = await accessTokenFor(user.id, refresh);
        const { data: events } = await db
          .from("google_calendar_events")
          .select("google_event_id")
          .eq("user_id", user.id)
          .eq("state", "present")
          .gte("ends_at", new Date().toISOString());
        for (const e of events ?? []) {
          await deleteEvent(token, conn.calendar_id, e.google_event_id).catch(() => {});
        }
      }
      await revokeToken(refresh);
    } catch (e) {
      console.error("[gcal/disconnect] cleanup failed", e);
    }
  }

  forgetAccessToken(user.id);
  await db.from("google_calendar_events").delete().eq("user_id", user.id);
  await db.from("google_calendar_connections").delete().eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
