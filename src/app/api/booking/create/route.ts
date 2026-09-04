// Books a lesson: hold the slot, then send the student to Stripe.
//
// Ordering matters and is deliberate. The booking row is written FIRST, as
// `pending_payment` with a short expiry, and only then is a Stripe session
// created. Doing it the other way round would let two students pay for the
// same slot before either row existed.
//
// Nothing the client sends decides money. The duration and the tutor come from
// the request; the PRICE is looked up server-side from lesson_pricing using the
// tutor's tier, and whether this is a discounted trial is derived from the
// student's own booking history — never from a flag in the body.
//
// The student price and the tutor's pay are two separate lookups and always
// have been snapshot onto the row. Since 20260828_tutor_ladder.sql the pay
// side is no longer a flat tier rate: tutor_pay_cents() raises it to the rung
// the tutor has earned. That comes out of take, never out of the price.
//
// Lessons are paid for out of a PLAN, not one at a time. A student with no
// live plan is refused here and sent to the picker; there is no per-lesson
// Stripe path in this route at all. Lessons are paid for with CREDITS, and
// credits come from one of two places: a subscription, or the one-off starter
// pack a student buys before they have a plan (20260902_starter_pack.sql).
//
// The single discounted trial lesson is gone. Three separately-sold trials
// netted less than one — Stripe's fixed fee lands on each charge and each
// lesson grossed about two dollars — so the same three lessons are sold as one
// pack instead, which nets ten times as much and is one decision rather than
// three places to drop out.
//
// The hold is still written BEFORE the credits are spent, for the same reason
// it used to be written before Stripe: two students must not be able to hold
// the same slot. Whether the student CAN pay from their plan is decided
// server-side too — a Community plan may not book a Professional tutor.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  BOOKING_DURATIONS,
  HOLD_MINUTES,
  isSlotStillBookable,
} from "@/lib/booking/availability";
import { creditEligibility, payBookingWithCredits } from "@/lib/booking/confirm";
import { hasActivePlan } from "@/lib/credits/plans";
import { isListed, listingBySlug } from "@/lib/tutors/listing";

export const runtime = "nodejs";

const Body = z.object({
  tutor_slug: z.string().trim().min(1).max(80),
  start: z.string().datetime(),
  duration_minutes: z.number().int().refine((d) => BOOKING_DURATIONS.includes(d), {
    message: "Unsupported lesson length",
  }),
  student_note: z.string().trim().max(500).optional().default(""),
});

function serviceClient() {
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
    return NextResponse.json(
      { error: "Sign in to book a lesson.", needsLogin: true },
      { status: 401 }
    );
  }

  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "That booking isn't valid." }, { status: 400 });
  }

  const db = serviceClient();

  // --- who, and are they actually bookable --------------------------------
  // Same predicate the room uses to decide whether this tutor teaches in a
  // Classroom or a Study Space — see lib/tutors/listing.ts. They must never
  // disagree: a tutor who can be booked but gets no video sells a live lesson
  // that cannot happen.
  const profile = await listingBySlug(input.tutor_slug);

  if (!isListed(profile)) {
    return NextResponse.json({ error: "That tutor isn't taking bookings." }, { status: 404 });
  }

  if (profile.user_id === user.id) {
    return NextResponse.json(
      { error: "You can't book a lesson with yourself." },
      { status: 400 }
    );
  }

  // --- is this specific slot still free ------------------------------------
  // Re-checked server-side: the page the student is looking at may be minutes
  // stale, and the request could have been hand-made.
  const free = await isSlotStillBookable(
    profile.user_id,
    input.start,
    input.duration_minutes
  );
  if (!free) {
    return NextResponse.json(
      { error: "That time was just taken. Pick another slot." },
      { status: 409 }
    );
  }

  // --- can this lesson be paid for out of a plan? --------------------------
  // This is the gate, and it is the real one. /book redirects a planless
  // student to the picker, but a redirect is only a suggestion to anybody
  // posting straight at this route.
  const credit = await creditEligibility(
    user.id,
    profile.tier,
    input.duration_minutes
  );

  if (!credit) {
    // Two different failures wear the same shape here, and the student needs
    // to be told which: no plan at all, or a plan that doesn't reach this
    // tutor / has run out of lessons this month.
    const planned = await hasActivePlan(user.id);
    return NextResponse.json(
      planned
        ? {
            error:
              "Your plan doesn't cover this tutor, or you're out of lessons. " +
              "Check your subscription.",
            needsUpgrade: true,
          }
        : {
            error: "Get lessons first — start with a 3-lesson pack or a plan.",
            needsPlan: true,
            next: `/start`,
          },
      { status: 402 }
    );
  }


  // --- price, from our own table -------------------------------------------
  const { data: price } = await db
    .from("lesson_pricing")
    .select("price_cents, tutor_pay_cents, currency")
    .eq("tier", profile.tier)
    .eq("duration_minutes", input.duration_minutes)
    .eq("is_trial", false)
    .maybeSingle();

  if (!price) {
    console.error("[booking/create] no price for", profile.tier, input.duration_minutes);
    return NextResponse.json(
      { error: "We couldn't price that lesson. Please contact support." },
      { status: 500 }
    );
  }

  // What the TUTOR is paid is not simply the tier rate any more. It is the
  // tier rate raised to whatever rung of the incentive ladder they have
  // earned (20260828_tutor_ladder.sql), so a tutor 200 reliable lessons in
  // earns more than one on their first day at the same tier.
  //
  // The student price is untouched by this: the ladder is paid out of take,
  // not out of the learner. And the function never returns less than the tier
  // base, so a missing steps row cannot underpay anybody.
  const { data: ladderPay, error: payError } = await db.rpc("tutor_pay_cents", {
    p_tutor: profile.user_id,
    p_duration: input.duration_minutes,
    p_is_trial: false,
  });
  if (payError) {
    // Fall back to the flat tier rate rather than refusing the booking. An
    // underpaid tutor is a thing we can correct; a lost lesson is not.
    console.error("[booking/create] ladder pay lookup failed", payError);
  }
  const tutorPayCents =
    typeof ladderPay === "number" && ladderPay > 0
      ? ladderPay
      : price.tutor_pay_cents;

  const start = new Date(input.start);
  const end = new Date(start.getTime() + input.duration_minutes * 60_000);
  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000);

  // --- hold the slot BEFORE spending the credit ----------------------------
  const { data: booking, error: insertError } = await db
    .from("bookings")
    .insert({
      tutor_id: profile.user_id,
      student_id: user.id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      duration_minutes: input.duration_minutes,
      status: "pending_payment",
      price_cents: price.price_cents,
      tutor_pay_cents: tutorPayCents,
      currency: price.currency || "USD",
      tier: profile.tier,
      is_trial: false,
      expires_at: expiresAt.toISOString(),
      student_note: input.student_note || null,
    })
    .select("id")
    .single();

  if (insertError || !booking) {
    // 23P01 is the GiST exclusion constraint: someone else won the race for
    // this slot in the milliseconds since we checked. The one-trial-per-student
    // index (23505) cannot fire now that is_trial is always false, but the row
    // it guards still exists, so the branch stays.
    if (insertError?.code === "23P01" || insertError?.code === "23505") {
      return NextResponse.json(
        { error: "That time was just taken. Pick another slot." },
        { status: 409 }
      );
    }
    console.error("[booking/create] insert failed", insertError);
    return NextResponse.json({ error: "Couldn't hold that slot." }, { status: 500 });
  }

  // --- pay from the credits -------------------------------------------------
  // credit is non-null: the gate above returned 402 otherwise.
  const paid = await payBookingWithCredits(booking.id, user.id, credit.cost);

  if (!paid) {
    // The balance moved between the eligibility check and the spend — another
    // tab booked at the same moment. Release the hold immediately rather than
    // leaving a slot nobody has paid for parked until it expires.
    await db.from("bookings").update({ status: "expired" }).eq("id", booking.id);
    return NextResponse.json(
      { error: "You're out of lessons for now. They top up weekly." },
      { status: 402 }
    );
  }

  return NextResponse.json({
    booking_id: booking.id,
    paid_with: "credit",
    credits_spent: credit.cost,
    credits_left: credit.balance - credit.cost,
  });
}
