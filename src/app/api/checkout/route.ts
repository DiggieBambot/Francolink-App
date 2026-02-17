// src/app/api/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, CheckoutPlan, planToSubscription } from "@/lib/stripe";
import { getSetting } from "@/lib/config/settings";

// ------------------------------------------------------------------
// Map plan param to settings key
// ------------------------------------------------------------------

const planToPriceKey: Record<CheckoutPlan, string> = {
  premium_monthly: "stripe_premium_monthly_price_id",
  premium_yearly: "stripe_premium_yearly_price_id",
  premium_plus_monthly: "stripe_premium_plus_monthly_price_id",
  premium_plus_yearly: "stripe_premium_plus_yearly_price_id",
};

// ------------------------------------------------------------------
// Supported Stripe checkout currencies
// Only currencies where you have Stripe Price objects set up
// For Phase 1: charge in USD, display currency is informational only
// ------------------------------------------------------------------

const SUPPORTED_CHARGE_CURRENCIES = ["usd"];

// ------------------------------------------------------------------
// POST /api/checkout
// ------------------------------------------------------------------

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
      return NextResponse.json(
        { error: "You must be logged in to subscribe" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const {
      plan,
      billingPeriod = "monthly",
      displayCurrency = "USD",
      locale = "en",
    } = body as {
      plan: "premium" | "premium_plus";
      billingPeriod?: "monthly" | "yearly";
      displayCurrency?: string;
      locale?: string;
    };

    if (!plan || !["premium", "premium_plus"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Build the checkout plan key
    const checkoutPlan: CheckoutPlan = `${plan}_${billingPeriod}` as CheckoutPlan;

    // Get price ID from admin settings
    const priceId = await getSetting(
      "payments",
      planToPriceKey[checkoutPlan],
      ""
    );

    if (!priceId) {
      console.error(`Price ID not configured for plan: ${checkoutPlan}`);
      return NextResponse.json(
        { error: "This plan is not available yet. Please contact support." },
        { status: 400 }
      );
    }

    // Get user profile to check for existing Stripe customer
    const { data: profile } = await supabase
      .from("users")
      .select("stripe_customer_id, email, name")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profile?.email,
        name: profile?.name || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Get app URL for redirects
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Build locale-aware redirect URLs
    // If locale is 'en' (default), don't add prefix (as-needed strategy)
    const localePrefix = locale && locale !== "en" ? `/${locale}` : "";
    const successUrl = `${appUrl}${localePrefix}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}${localePrefix}/pricing?canceled=true`;

    // Determine Stripe checkout locale
    // https://stripe.com/docs/api/checkout/sessions/create#create_checkout_session-locale
    const stripeLocaleMap: Record<string, string> = {
      en: "en",
      fr: "fr",
      ar: "ar",
    };
    const stripeLocale = stripeLocaleMap[locale] || "auto";

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      locale: stripeLocale as "en" | "fr" | "auto",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: user.id,
        plan: checkoutPlan,
        subscription_plan: planToSubscription[checkoutPlan],
        display_currency: displayCurrency,
        locale: locale,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan: checkoutPlan,
          subscription_plan: planToSubscription[checkoutPlan],
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}