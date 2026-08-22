// Confirming a booking, and paying for one with credits.
//
// There are now two ways a held slot becomes a real lesson: a Stripe checkout
// completing, and a subscriber spending credits. They must end in exactly the
// same state -- same room, same cleared hold -- so the transition lives here
// rather than being written twice and drifting.

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { creditBalance, creditCost, spendCredits, InsufficientCredits } from "@/lib/credits/ledger";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Move a held booking to `confirmed`, provisioning the shared room.
 *
 * Returns false when the booking was not in `pending_payment` -- already
 * settled by a retry, an admin, or the other payment path. Callers should
 * treat that as success-by-someone-else, not an error.
 */
export async function confirmBooking(
  bookingId: string,
  extra: Record<string, unknown> = {}
): Promise<boolean> {
  const db = service();

  const { data: booking } = await db
    .from("bookings")
    .select("id, tutor_id, student_id, status, room_session_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || booking.status !== "pending_payment") return false;

  // One shared room per tutor/student pair, reused across their lessons.
  let roomId = booking.room_session_id as string | null;
  if (!roomId) {
    try {
      const { getOrCreateLessonSpace } = await import("@/lib/lessons/lesson-space");
      const space = await getOrCreateLessonSpace(booking.tutor_id, booking.student_id);
      roomId = space.id;
    } catch (e) {
      // A missing room must not lose a paid booking -- confirm anyway and let
      // the next room visit sort it out.
      console.error("[booking/confirm] room provisioning failed for", bookingId, e);
    }
  }

  const { error } = await db
    .from("bookings")
    .update({
      status: "confirmed",
      room_session_id: roomId,
      expires_at: null,
      ...extra,
    })
    .eq("id", bookingId)
    .eq("status", "pending_payment");

  if (error) {
    console.error("[booking/confirm] update failed", bookingId, error);
    return false;
  }

  // Connect the pair so the room and homework tools see the relationship.
  // The Stripe webhook does this itself rather than calling through here --
  // that path is live and working, and an upsert twice is harmless, whereas
  // rewriting a payment handler that cannot be tested from here is not.
  const { error: linkError } = await db.from("tutor_students").upsert(
    {
      tutor_id: booking.tutor_id,
      student_id: booking.student_id,
      status: "active",
    },
    { onConflict: "tutor_id,student_id" }
  );

  if (linkError) {
    // The lesson is paid for and confirmed; a missing link is recoverable and
    // must not undo that.
    console.error("[booking/confirm] tutor_students link failed", bookingId, linkError);
  }

  return true;
}

export interface CreditEligibility {
  subscriptionId: string;
  planKey: string;
  /** Credits the lesson costs: 1 for 50 minutes, 0.5 for 25. */
  cost: number;
  balance: number;
}

/**
 * Can this student pay for this lesson with their plan?
 *
 * Three things have to hold, and all three are checked server-side: they have
 * a live subscription, its plan covers this tutor's tier, and the balance
 * stretches to the lesson. Returns null when any of them fails -- the caller
 * falls back to Stripe rather than refusing the booking.
 */
export async function creditEligibility(
  studentId: string,
  tutorTier: string,
  durationMinutes: number
): Promise<CreditEligibility | null> {
  const db = service();

  const { data: sub } = await db
    .from("user_subscriptions")
    .select("id, plan_key, status")
    .eq("user_id", studentId)
    .in("status", ["active", "past_due"])
    .maybeSingle();

  if (!sub) return null;

  const { data: plan } = await db
    .from("subscription_plans")
    .select("allowed_tiers")
    .eq("plan_key", sub.plan_key)
    .maybeSingle();

  // A Community plan may not book a Professional tutor. Without this the
  // cheaper plan would buy the more expensive tutor's time at a loss.
  if (!plan?.allowed_tiers?.includes(tutorTier)) return null;

  const cost = creditCost(durationMinutes);
  const balance = await creditBalance(studentId);

  if (balance < cost) return null;

  return { subscriptionId: sub.id, planKey: sub.plan_key, cost, balance };
}

/**
 * Spend credits on a held booking and confirm it.
 *
 * The spend happens FIRST. If it throws the booking stays held and expires on
 * its own, which is the safe direction: a confirmed lesson nobody paid for
 * still owes the tutor their fee.
 *
 * Returns false when the credits could not be spent, so the caller can fall
 * through to Stripe.
 */
export async function payBookingWithCredits(
  bookingId: string,
  studentId: string,
  cost: number
): Promise<boolean> {
  let ledgerId: number;

  try {
    ledgerId = await spendCredits(studentId, cost, bookingId, "booking");
  } catch (err) {
    if (err instanceof InsufficientCredits) {
      // Raced against another booking, or a rollover clamp landed in between.
      console.log("[booking/credits] balance fell short for", studentId, err.message);
      return false;
    }
    console.error("[booking/credits] spend failed", bookingId, err);
    return false;
  }

  const ok = await confirmBooking(bookingId, {
    paid_with: "credit",
    credit_ledger_id: ledgerId,
  });

  if (!ok) {
    // Someone else settled the booking between the spend and the confirm.
    // Hand the credits back rather than charging for a lesson we did not sell.
    const { refundCredits } = await import("@/lib/credits/ledger");
    await refundCredits(studentId, cost, "admin_adjustment", {
      bookingId,
      note: "spend reversed: booking was already settled",
    });
    return false;
  }

  return true;
}
