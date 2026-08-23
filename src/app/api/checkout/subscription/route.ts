// Checkout for a live lesson plan.
//
// Separate from /api/checkout, which sells the self-study tiers. They differ in
// ways that would make one route a maze of branches:
//
//   * The price comes from subscription_plan_prices, our own table, not from a
//     settings key. Nothing the client sends decides money -- the body names a
//     plan, a lessons-per-week and a term, and the server prices it.
//   * lessons_per_week is the Stripe subscription QUANTITY, not a separate
//     Price object. One Price per (plan, term) is nine objects to keep in step
//     instead of forty-five.
//   * The resulting subscription is written to user_subscriptions, which is
//     what tells the rest of the system this is a lesson plan and not a
//     self-study one -- including the webhook guard that keeps the legacy
//     referral percentage away from it.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { APP_URL } from "@/lib/site/hosts";

export const runtime = "nodejs";

const Body = z.object({
  plan_key: z.string().trim().min(1).max(40),
  lessons_per_week: z.number().int().min(1).max(20),
  term_months: z.union([z.literal(1), z.literal(3), z.literal(12)]),
  locale: z.string().trim().max(5).optional().default("en"),
});

function service() {
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
      { error: "Sign in to subscribe.", needsLogin: true },
      { status: 401 }
    );
  }

  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "That plan isn't valid." }, { status: 400 });
  }

  const db = service();

  // One live plan per student -- the partial unique index enforces it anyway,
  // but a clear message beats a constraint violation.
  const { data: existing } = await db
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["active", "past_due"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You already have a plan. Change it from your subscription page." },
      { status: 409 }
    );
  }

  // --- price it from our own table -----------------------------------------
  const { data: plan } = await db
    .from("subscription_plans")
    .select("plan_key, name, active")
    .eq("plan_key", input.plan_key)
    .maybeSingle();

  if (!plan?.active) {
    return NextResponse.json(
      { error: "That plan isn't available yet." },
      { status: 404 }
    );
  }

  const { data: price } = await db
    .from("subscription_plan_prices")
    .select("total_cents, stripe_price_id, currency")
    .eq("plan_key", input.plan_key)
    .eq("lessons_per_week", input.lessons_per_week)
    .eq("term_months", input.term_months)
    .maybeSingle();

  if (!price) {
    return NextResponse.json(
      { error: "We don't offer that combination." },
      { status: 400 }
    );
  }

  if (!price.stripe_price_id) {
    // The catalogue row exists but nobody has attached a Stripe Price to it.
    // Failing loudly here beats charging the wrong amount.
    console.error(
      "[checkout/subscription] no stripe_price_id for",
      input.plan_key,
      input.term_months
    );
    return NextResponse.json(
      { error: "That plan isn't ready to buy yet. Please contact support." },
      { status: 503 }
    );
  }

  // --- Stripe customer ------------------------------------------------------
  const { data: profile } = await db
    .from("users")
    .select("stripe_customer_id, email, name")
    .eq("id", user.id)
    .maybeSingle();

  let customerId = profile?.stripe_customer_id as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || profile?.email || undefined,
      name: profile?.name || undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await db
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const localePrefix =
    input.locale && input.locale !== "en" ? `/${input.locale}` : "";

  // Metadata is carried on BOTH the session and the subscription: the webhook
  // sees the session once at checkout and the subscription on every renewal,
  // and it must be able to tell a lesson plan from a self-study one either way.
  const meta = {
    kind: "lesson_subscription",
    supabase_user_id: user.id,
    plan_key: input.plan_key,
    lessons_per_week: String(input.lessons_per_week),
    term_months: String(input.term_months),
  };

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: price.stripe_price_id,
          // The weekly lesson count IS the quantity.
          quantity: input.lessons_per_week,
        },
      ],
      success_url: `${APP_URL}${localePrefix}/student/subscription?welcome=1`,
      cancel_url: `${APP_URL}${localePrefix}/pricing?canceled=1`,
      metadata: meta,
      subscription_data: { metadata: meta },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[checkout/subscription] Stripe session failed", e);
    return NextResponse.json(
      { error: "Couldn't start checkout. Please try again." },
      { status: 500 }
    );
  }
}
