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

  // Tell both sides. This sits here rather than at the two call sites for the
  // same reason the room does: credits and Stripe must produce the same lesson,
  // and the guard above means a retried webhook can't mail anybody twice.
  // Imported lazily so the mail stack isn't pulled into every module that only
  // wants creditEligibility.
  try {
    const { notifyBookingConfirmed } = await import("@/lib/booking/notify");
    await notifyBookingConfirmed(bookingId);
  } catch (e) {
    console.error("[booking/confirm] notify failed", bookingId, e);
  }

  return true;
}

export interface CreditEligibility {
  /** Null when the credits came from a starter pack rather than a plan. */
  subscriptionId: string | null;
  planKey: string | null;
  /** Credits the lesson costs: 1 for 50 minutes, 0.5 for 25. */
  cost: number;
  balance: number;
}

/**
 * Can this student pay for this lesson out of the credits they hold?
 *
 * Three things have to hold, all checked server-side: their credits are
 * entitled to this tutor's TIER, the balance stretches to the lesson, and the
 * lesson has a cost at all.
 *
 * Entitlement used to mean "has a live subscription whose plan covers this
 * tier". Since 20260902_starter_pack.sql a student can also hold credits from
 * a starter pack, which has no subscription behind it, so the question is
 * asked of student_allowed_tiers() instead -- it unions every live source.
 * Without that a pack buyer would hold three credits they could not spend.
 *
 * Returns null when any of it fails; the caller decides what to do next.
 */
export async function creditEligibility(
  studentId: string,
  tutorTier: string,
  durationMinutes: number
): Promise<CreditEligibility | null> {
  const db = service();

  const { data: tiers, error } = await db.rpc("student_allowed_tiers", {
    p_user_id: studentId,
  });

  if (error) {
    // Fail CLOSED. Treating an entitlement lookup failure as "yes" would give
    // away lessons; treating it as "no" costs a booking we can retry.
    console.error("[booking/confirm] entitlement lookup failed", error);
    return null;
  }

  // A Community entitlement may not book a Professional tutor. Without this
  // the cheaper plan would buy the more expensive tutor's time at a loss.
  if (!Array.isArray(tiers) || !tiers.includes(tutorTier)) return null;

  const cost = creditCost(durationMinutes);
  const balance = await creditBalance(studentId);

  if (balance < cost) return null;

  // The subscription is looked up only to label the spend; a pack buyer has
  // none and that is fine.
  const { data: sub } = await db
    .from("user_subscriptions")
    .select("id, plan_key")
    .eq("user_id", studentId)
    .in("status", ["active", "past_due"])
    .maybeSingle();

  return {
    subscriptionId: sub?.id ?? null,
    planKey: sub?.plan_key ?? null,
    cost,
    balance,
  };
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

/**
 * Has this student still got their one discounted first lesson?
 *
 * Any prior booking that wasn't abandoned spends it — 'expired' and
 * 'cancelled_by_student' don't count, because neither is a lesson the student
 * actually received. Derived from history rather than stored on the user, so
 * it cannot drift out of step with the bookings it describes.
 */
export async function isTrialEligible(studentId: string): Promise<boolean> {
  const { count } = await service()
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .not("status", "in", "(expired,cancelled_by_student)");
  return (count ?? 0) === 0;
}
