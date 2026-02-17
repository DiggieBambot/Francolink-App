// src/lib/stripe/index.ts

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

// Plan types for checkout
export type CheckoutPlan =
  | "premium_monthly"
  | "premium_yearly"
  | "premium_plus_monthly"
  | "premium_plus_yearly";

// Map plan to subscription_plan value in database
export const planToSubscription: Record<CheckoutPlan, string> = {
  premium_monthly: "PREMIUM",
  premium_yearly: "PREMIUM",
  premium_plus_monthly: "PREMIUM_PLUS",
  premium_plus_yearly: "PREMIUM_PLUS",
};

// Map plan to billing period
export const planToPeriod: Record<CheckoutPlan, string> = {
  premium_monthly: "monthly",
  premium_yearly: "yearly",
  premium_plus_monthly: "monthly",
  premium_plus_yearly: "yearly",
};