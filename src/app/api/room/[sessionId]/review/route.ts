// POST /api/room/[sessionId]/review  { rating, comment? }
//
// The student rates the lesson they just finished.
//
// `lesson_reviews` has existed since the bookings migration in August and
// nothing has ever written to it — the table was designed, migrated, indexed
// for the tutor directory, and then never collected. So every tutor profile
// has been showing no rating not because students dislike them but because
// nobody was ever asked. This is the asking.
//
// The booking is resolved server-side from the session, so a student can only
// review a lesson they actually attended, and the table's `unique(booking_id)`
// means one review per lesson however many times this is called.
//
// A review is NOT public when it is saved: it waits as `pending` until an
// admin approves it in /admin/reviews, and only then reaches the tutor's profile.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rating = Number(body.rating);
  const comment =
    typeof body.comment === "string" ? body.comment.trim().slice(0, 2000) : null;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Pick a rating from 1 to 5." }, { status: 400 });
  }

  const db = svc();

  // The lesson being reviewed is the most recent one this room ran — not
  // "any booking in this room". A pair reuses one room for every lesson they
  // ever have, so keying on the room alone would let today's rating overwrite
  // (or be refused by) one left months ago.
  // A caller that knows which lesson it is asking about (the dashboard
  // prompt) names it; it must still be a started lesson in THIS room.
  const bookingId = typeof body.bookingId === "string" ? body.bookingId : null;
  let query = db
    .from("bookings")
    .select("id, tutor_id, student_id, status, starts_at")
    .eq("room_session_id", sessionId)
    .in("status", ["confirmed", "completed"])
    .lte("starts_at", new Date().toISOString());
  if (bookingId) query = query.eq("id", bookingId);
  const { data: booking } = await query
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json(
      { error: "There's no finished lesson here to review." },
      { status: 404 }
    );
  }

  // Only the student who sat in it. A tutor rating their own lesson is the one
  // way this table could become worthless.
  if (booking.student_id !== user.id) {
    return NextResponse.json(
      { error: "Only the student can review a lesson." },
      { status: 403 }
    );
  }

  const { error } = await db.from("lesson_reviews").upsert(
    {
      booking_id: booking.id,
      student_id: booking.student_id,
      tutor_id: booking.tutor_id,
      rating,
      comment,
      // Every submission, including an edit of one already approved, goes
      // back to the queue: the text an admin approved is not the text that
      // would otherwise go live.
      is_published: false,
      review_status: "pending",
      moderated_at: null,
      moderated_by: null,
    },
    { onConflict: "booking_id" }
  );

  if (error) {
    console.error("[room/review] upsert failed", sessionId, error);
    return NextResponse.json({ error: "Couldn't save your rating." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
