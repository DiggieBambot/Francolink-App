// src/app/api/checkout/upgrade/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { getSetting } from "@/lib/config/settings";

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is enabled
    const stripeEnabled = await getSetting("features", "stripe_enabled", false);
    
    if (!stripeEnabled) {
      return NextResponse.json(
        { error: "Payments are not available yet. Please check back soon!" },
        { status: 503 }
      );
    }

    // Check if Stripe client is initialized
    if (!stripe) {
      console.error("Stripe client not initialized - missing STRIPE_SECRET_KEY");
      return NextResponse.json(
        { error: "Payment system is not configured. Please contact support." },
        { status: 503 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select(
        "stripe_customer_id, stripe_subscription_id, subscription_plan, subscription_period"
      )
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found. Please subscribe first." },
        { status: 400 }
      );
    }

    if (profile.subscription_plan !== "PREMIUM") {
      return NextResponse.json(
        { error: "This upgrade is only available for Premium subscribers" },
        { status: 400 }
      );
    }

    // Get the current subscription
    const subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id
    );

    if (subscription.status !== "active") {
      return NextResponse.json(
        { error: "Your subscription is not active" },
        { status: 400 }
      );
    }

    // Determine which Premium+ price to use based on current billing period
    const isYearly = profile.subscription_period === "yearly";
    const newPriceKey = isYearly
      ? "stripe_premium_plus_yearly_price_id"
      : "stripe_premium_plus_monthly_price_id";

    const newPriceId = await getSetting("payments", newPriceKey, "");

    if (!newPriceId) {
      return NextResponse.json(
        { error: "Premium+ plan is not available yet" },
        { status: 400 }
      );
    }

    // Update the subscription to Premium+
    const updatedSubscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "create_prorations",
        metadata: {
          supabase_user_id: user.id,
          plan: isYearly ? "premium_plus_yearly" : "premium_plus_monthly",
          subscription_plan: "PREMIUM_PLUS",
        },
      }
    );

    // Update user in database
    await supabase
      .from("users")
      .update({
        subscription_plan: "PREMIUM_PLUS",
      })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      message: "Successfully upgraded to Premium+",
      subscription_id: updatedSubscription.id,
    });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json(
      { error: "Failed to process upgrade" },
      { status: 500 }
    );
  }
}