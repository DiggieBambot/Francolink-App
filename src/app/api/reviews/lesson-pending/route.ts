// GET /api/reviews/lesson-pending
//
// "Has this student finished a lesson they have not rated yet?" Drives the
// prompt that follows a lesson around the app, for the many students who leave
// the call (or close the tab) before the in-room rating card ever shows.
//
// Only the most recent lesson counts, once it is over, and only within a
// fortnight. The prompt sends this booking's id with the rating, so the
// review lands on exactly the lesson it asked about.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const WINDOW_DAYS = 14;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ pending: null });

  const db = createServiceClient();
  const now = new Date();
  // The most recent lesson that has STARTED -- the same one the review route
  // resolves -- not the most recent one that has finished. Otherwise, during a
  // lesson, the prompt would ask about the previous one.
  const { data: booking } = await db
    .from("bookings")
    .select("id, tutor_id, room_session_id, starts_at, ends_at")
    .eq("student_id", user.id)
    .in("status", ["confirmed", "completed"])
    .not("room_session_id", "is", null)
    .lte("starts_at", now.toISOString())
    .gte("starts_at", new Date(now.getTime() - WINDOW_DAYS * 86400_000).toISOString())
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!booking) return NextResponse.json({ pending: null });

  // Finished = past its scheduled end, or the tutor ended the room early.
  let finished = new Date(booking.ends_at as string) <= now;
  if (!finished) {
    const { data: room } = await db
      .from("tutor_lesson_sessions")
      .select("ended_at")
      .eq("id", booking.room_session_id)
      .maybeSingle();
    finished =
      !!room?.ended_at && new Date(room.ended_at as string) >= new Date(booking.starts_at as string);
  }
  if (!finished) return NextResponse.json({ pending: null });

  const { data: existing } = await db
    .from("lesson_reviews")
    .select("id")
    .eq("booking_id", booking.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ pending: null });

  const { data: tutor } = await db
    .from("users")
    .select("name")
    .eq("id", booking.tutor_id)
    .maybeSingle();

  return NextResponse.json({
    pending: {
      bookingId: booking.id,
      sessionId: booking.room_session_id,
      tutorName: (tutor?.name as string | null) ?? null,
    },
  });
}
