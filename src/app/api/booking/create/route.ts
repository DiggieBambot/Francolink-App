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
// A subscriber pays with credits instead of Stripe. That path still writes the
// hold first and still prices the lesson from lesson_pricing, because
// price_cents is what the accounts read later; the only difference is that the
// money came out of a plan rather than a card, and there is no checkout to
// redirect to. Whether the student CAN pay that way is decided server-side
// too — a Community plan may not book a Professional tutor.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import {
  BOOKING_DURATIONS,
  HOLD_MINUTES,
  isSlotStillBookable,
} from "@/lib/booking/availability";
import { APP_URL, SITE_URL } from "@/lib/site/hosts";
import { creditEligibility, payBookingWithCredits } from "@/lib/booking/confirm";

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
  if (!stripe) {
    return NextResponse.json(
      { error: "Payments aren't configured yet." },
      { status: 503 }
    );
  }

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
  const { data: profile } = await db
    .from("tutor_public_profiles")
    .select("user_id, slug, tier, trial_available, accepts_bookings, approval_status, is_public")
    .eq("slug", input.tutor_slug)
    .maybeSingle();

  if (
    !profile ||
    !profile.accepts_bookings ||
    profile.approval_status !== "approved" ||
    !profile.is_public
  ) {
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

  // --- trial eligibility, derived not declared -----------------------------
  // Any prior booking that wasn't abandoned means they've used their trial.
  const { count: priorBookings } = await db
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id)
    .not("status", "in", "(expired,cancelled_by_student)");

  // Can this lesson be paid for out of a plan? Decided before pricing, because
  // a subscriber never takes the discounted trial — they are already paying.
  const credit = await creditEligibility(
    user.id,
    profile.tier,
    input.duration_minutes
  );

  const isTrial =
    !credit &&
    Boolean(profile.trial_available) &&
    (priorBookings ?? 0) === 0;

  // --- price, from our own table -------------------------------------------
  const { data: pricing } = await db
    .from("lesson_pricing")
    .select("price_cents, tutor_pay_cents, currency")
    .eq("tier", profile.tier)
    .eq("duration_minutes", input.duration_minutes)
    .eq("is_trial", isTrial)
    .maybeSingle();

  // A trial is only offered at one length; fall back to the normal price
  // rather than refusing the booking outright.
  const { data: fallback } = pricing
    ? { data: null }
    : await db
        .from("lesson_pricing")
        .select("price_cents, tutor_pay_cents, currency")
        .eq("tier", profile.tier)
        .eq("duration_minutes", input.duration_minutes)
        .eq("is_trial", false)
        .maybeSingle();

  const price = pricing ?? fallback;
  if (!price) {
    console.error("[booking/create] no price for", profile.tier, input.duration_minutes);
    return NextResponse.json(
      { error: "We couldn't price that lesson. Please contact support." },
      { status: 500 }
    );
  }
  const chargedAsTrial = Boolean(pricing) && isTrial;

  const start = new Date(input.start);
  const end = new Date(start.getTime() + input.duration_minutes * 60_000);
  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000);

  // --- hold the slot BEFORE talking to Stripe ------------------------------
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
      tutor_pay_cents: price.tutor_pay_cents,
      currency: price.currency || "USD",
      tier: profile.tier,
      is_trial: chargedAsTrial,
      expires_at: expiresAt.toISOString(),
      student_note: input.student_note || null,
    })
    .select("id")
    .single();

  if (insertError || !booking) {
    // 23P01 is the GiST exclusion constraint: someone else won the race for
    // this slot in the milliseconds since we checked. 23505 is the one-trial
    // -per-student index.
    if (insertError?.code === "23P01") {
      return NextResponse.json(
        { error: "That time was just taken. Pick another slot." },
        { status: 409 }
      );
    }
    if (insertError?.code === "23505") {
      return NextResponse.json(
        { error: "You've already used your discounted first lesson." },
        { status: 409 }
      );
    }
    console.error("[booking/create] insert failed", insertError);
    return NextResponse.json({ error: "Couldn't hold that slot." }, { status: 500 });
  }

  // --- paid from a plan? then there is no checkout --------------------------
  if (credit) {
    const paid = await payBookingWithCredits(booking.id, user.id, credit.cost);
    if (paid) {
      return NextResponse.json({
        booking_id: booking.id,
        paid_with: "credit",
        credits_spent: credit.cost,
        credits_left: credit.balance - credit.cost,
      });
    }
    // Fell short between the check and the spend — carry on to Stripe rather
    // than losing the slot the student already holds.
    console.log("[booking/create] credit payment declined, falling back to Stripe");
  }

  // --- Stripe checkout ------------------------------------------------------
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Stripe expires the session on its own too, but ours must be the
      // shorter of the two or the hold would lapse while checkout is open.
      expires_at: Math.floor(expiresAt.getTime() / 1000) + 20 * 60,
      customer_email: user.email ?? undefined,
      client_reference_id: booking.id,
      metadata: { kind: "lesson_booking", booking_id: booking.id },
      // Also on the payment intent, so a refund or dispute can be traced back.
      payment_intent_data: {
        metadata: { kind: "lesson_booking", booking_id: booking.id },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (price.currency || "USD").toLowerCase(),
            unit_amount: price.price_cents,
            product_data: {
              name: `${input.duration_minutes}-minute lesson${chargedAsTrial ? " (first lesson)" : ""}`,
              description: start.toUTCString(),
            },
          },
        },
      ],
      success_url: `${APP_URL}/lessons/booked?id=${booking.id}`,
      cancel_url: `${SITE_URL}/tutors/${profile.slug}`,
    });

    await db
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", booking.id);

    return NextResponse.json({ ok: true, url: session.url, booking_id: booking.id });
  } catch (err) {
    // Release the hold immediately rather than making the student wait out the
    // expiry for a slot nobody is paying for.
    await db
      .from("bookings")
      .update({ status: "expired" })
      .eq("id", booking.id);
    console.error("[booking/create] stripe session failed", err);
    return NextResponse.json(
      { error: "Couldn't start checkout. Please try again." },
      { status: 502 }
    );
  }
}
