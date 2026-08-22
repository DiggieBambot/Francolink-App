// Cancelling a lesson.
//
// The rule was set in 20260805_bookings.sql and is unchanged: free
// cancellation up to 12 hours before the start, nothing back inside that
// window. What is new is that a lesson may have been paid for with a credit
// rather than a card, so "refund" means two different operations.
//
//   student cancels, > 12h    credit returned / card refunded   tutor unpaid
//   student cancels, < 12h    credit consumed / no refund       tutor PAID
//   tutor cancels, any time   credit returned / card refunded   tutor unpaid
//
// The inside-12h case pays the tutor deliberately: they held the slot and
// turned other work away. That is also why the booking is left at
// 'cancelled_by_student' rather than deleted — the completion sweeper reads
// status, and the tutor's pay is the sum of tutor_pay_cents over lessons that
// count.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { refundCredits } from "@/lib/credits/ledger";

export const runtime = "nodejs";

/** Matches the free-cancellation window promised at booking time. */
const FREE_CANCELLATION_HOURS = 12;

const Body = z.object({
  booking_id: z.string().uuid(),
  reason: z.string().trim().max(500).optional().default(""),
});

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "That request isn't valid." }, { status: 400 });
  }

  const db = service();

  const { data: booking } = await db
    .from("bookings")
    .select(
      "id, tutor_id, student_id, status, starts_at, duration_minutes, paid_with, price_cents, stripe_payment_intent_id"
    )
    .eq("id", input.booking_id)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "No such lesson." }, { status: 404 });
  }

  const isStudent = booking.student_id === user.id;
  const isTutor = booking.tutor_id === user.id;

  if (!isStudent && !isTutor) {
    return NextResponse.json({ error: "That isn't your lesson." }, { status: 403 });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json(
      { error: `This lesson can't be cancelled (it's ${booking.status}).` },
      { status: 409 }
    );
  }

  const hoursUntil =
    (new Date(booking.starts_at).getTime() - Date.now()) / 3_600_000;

  // A tutor cancelling is always the student's gain: they lose the slot through
  // no fault of their own, so the money comes back however late it is.
  const refundable = isTutor || hoursUntil >= FREE_CANCELLATION_HOURS;

  const { error: updateError } = await db
    .from("bookings")
    .update({
      status: isTutor ? "cancelled_by_tutor" : "cancelled_by_student",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      refund_status: refundable ? "full" : "none",
    })
    .eq("id", booking.id)
    .eq("status", "confirmed"); // lost a race? then leave it alone

  if (updateError) {
    console.error("[booking/cancel] update failed", booking.id, updateError);
    return NextResponse.json({ error: "Couldn't cancel that lesson." }, { status: 500 });
  }

  if (!refundable) {
    return NextResponse.json({
      cancelled: true,
      refunded: false,
      message: `Cancelled. This was inside the ${FREE_CANCELLATION_HOURS}-hour window, so the lesson still counts.`,
    });
  }

  // --- give it back --------------------------------------------------------
  if (booking.paid_with === "credit") {
    const cost = booking.duration_minutes >= 50 ? 1 : 0.5;
    await refundCredits(
      booking.student_id,
      cost,
      isTutor ? "tutor_cancelled" : "cancellation_refund",
      { bookingId: booking.id }
    );

    return NextResponse.json({
      cancelled: true,
      refunded: true,
      credits_returned: cost,
    });
  }

  if (booking.stripe_payment_intent_id && stripe) {
    try {
      await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        reason: "requested_by_customer",
      });
    } catch (e) {
      // The lesson is cancelled either way; a failed refund is a support job,
      // not a reason to leave the slot blocked.
      console.error("[booking/cancel] Stripe refund failed", booking.id, e);
      await db
        .from("bookings")
        .update({ refund_status: "failed" })
        .eq("id", booking.id);

      return NextResponse.json({
        cancelled: true,
        refunded: false,
        message: "Lesson cancelled. The refund needs a moment — we're on it.",
      });
    }
  }

  return NextResponse.json({ cancelled: true, refunded: true });
}
