// Personal ICS feed: every lesson for whoever owns this token.
//
// Calendar clients cannot send an Authorization header, so the token in the URL
// is the whole credential. Consequences, all deliberate:
//   * The token is random and revocable, never the user's id.
//   * A bad token returns 404, not 401 — a different response would confirm
//     which tokens exist.
//   * The response is marked private and no-store so no shared cache holds
//     someone's schedule.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  toCalendarEvent,
  toIcsCalendar,
  type BookingForCalendar,
} from "@/lib/booking/calendar";
import { APP_URL } from "@/lib/site/hosts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Row extends BookingForCalendar {
  tutor_id: string;
  student_id: string;
  room_session_id: string | null;
  tutor: { name: string | null } | { name: string | null }[] | null;
  student: { name: string | null } | { name: string | null }[] | null;
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: raw } = await params;
  // Subscribers commonly append .ics; accept both forms.
  const token = raw.replace(/\.ics$/i, "");

  if (!token || token.length < 20) {
    return new NextResponse("Not found", { status: 404 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: owner } = await db
    .from("users")
    .select("id, name, role")
    .eq("calendar_feed_token", token)
    .maybeSingle();

  if (!owner) return new NextResponse("Not found", { status: 404 });

  // Recent past plus everything upcoming: a calendar with no history looks
  // broken, but there's no reason to ship years of it.
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 30);

  const { data: bookings } = await db
    .from("bookings")
    .select(
      `id, starts_at, ends_at, status, duration_minutes, tutor_id, student_id, room_session_id,
       tutor:users!bookings_tutor_id_fkey ( name ),
       student:users!bookings_student_id_fkey ( name )`
    )
    .or(`tutor_id.eq.${owner.id},student_id.eq.${owner.id}`)
    .gte("starts_at", from.toISOString())
    .not("status", "in", "(pending_payment,expired)")
    .order("starts_at");

  const events = ((bookings ?? []) as unknown as Row[]).map((b) => {
    const audience = b.tutor_id === owner.id ? "tutor" : "student";
    return toCalendarEvent(
      {
        id: b.id,
        starts_at: b.starts_at,
        ends_at: b.ends_at,
        status: b.status,
        duration_minutes: b.duration_minutes,
        tutor_name: one(b.tutor)?.name ?? null,
        student_name: one(b.student)?.name ?? null,
        room_url: b.room_session_id ? `${APP_URL}/room/${b.room_session_id}` : null,
      },
      audience,
      APP_URL
    );
  });

  const ics = toIcsCalendar(events, "FrancoLink lessons");

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="francolink.ics"',
      // Someone's lesson schedule must never sit in a shared cache.
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
