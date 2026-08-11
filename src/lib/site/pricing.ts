// Lesson prices shown on the website.
//
// FrancoLink sets these, not tutors — a tutor's tier decides what their
// lessons sell for. That's why nothing here reads
// tutor_public_profiles.hourly_rate_cents: that column is a leftover from the
// earlier model where tutors set their own rate, and the website must never
// quote a number the checkout wouldn't charge.

import { createClient } from "@supabase/supabase-js";

export type Tier = "community" | "certified" | "professional";

export interface TierPrice {
  durationMinutes: number;
  priceCents: number;
  isTrial: boolean;
  currency: string;
}

export interface TierPricing {
  tier: Tier;
  /** Normal lessons, cheapest first. */
  lessons: TierPrice[];
  /** The one-off discounted first lesson, if the tier offers one. */
  trial: TierPrice | null;
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

interface Row {
  tier: string;
  duration_minutes: number;
  is_trial: boolean;
  price_cents: number;
  currency: string;
}

/** The whole price list, keyed by tier. */
export async function getPricingByTier(): Promise<Record<Tier, TierPricing>> {
  const empty = (tier: Tier): TierPricing => ({ tier, lessons: [], trial: null });
  const out: Record<Tier, TierPricing> = {
    community: empty("community"),
    certified: empty("certified"),
    professional: empty("professional"),
  };

  const { data, error } = await serviceClient()
    .from("lesson_pricing")
    .select("tier, duration_minutes, is_trial, price_cents, currency")
    .order("duration_minutes", { ascending: true });

  if (error || !data) return out;

  for (const row of data as Row[]) {
    const tier = row.tier as Tier;
    if (!out[tier]) continue;
    const price: TierPrice = {
      durationMinutes: row.duration_minutes,
      priceCents: row.price_cents,
      isTrial: row.is_trial,
      currency: row.currency || "USD",
    };
    if (row.is_trial) out[tier].trial = price;
    else out[tier].lessons.push(price);
  }

  return out;
}

/** Cheapest normal lesson for a tier — the "from $X" figure on a card. */
export function cheapestLesson(pricing: TierPricing | undefined): TierPrice | null {
  if (!pricing || pricing.lessons.length === 0) return null;
  return pricing.lessons.reduce((min, p) => (p.priceCents < min.priceCents ? p : min));
}

export function formatPrice(cents: number, currency = "USD"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export const TIER_LABEL: Record<Tier, string> = {
  community: "Community tutor",
  certified: "Certified tutor",
  professional: "Professional tutor",
};

export const TIER_BLURB: Record<Tier, string> = {
  community:
    "A fluent speaker who teaches conversation and practice, without a formal teaching qualification.",
  certified:
    "Holds a recognised teaching qualification for the language they teach.",
  professional:
    "Qualified, with several years of proven classroom experience and consistently strong student feedback.",
};
