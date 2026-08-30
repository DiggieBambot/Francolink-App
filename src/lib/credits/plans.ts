// The lesson-plan catalogue, as the plan picker needs it.
//
// Everything here is READ-ONLY and priced by the database. The picker shows
// numbers; /api/checkout/subscription re-derives them from the same tables
// before charging anything, so a tampered client can only ever lie to itself.

import { createClient } from "@supabase/supabase-js";

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface PlanPrice {
  lessonsPerWeek: number;
  termMonths: 1 | 3 | 12;
  discountBps: number;
  totalCents: number;
  currency: string;
  /** Whether this row can actually be bought — a missing Stripe Price can't. */
  buyable: boolean;
}

export interface Plan {
  planKey: string;
  name: string;
  description: string | null;
  allowedTiers: string[];
  durationMinutes: number;
  perLessonCents: number;
  /** First-month discount for a brand-new subscriber, in basis points. */
  introDiscountBps: number;
  prices: PlanPrice[];
}

/** A lesson is 50 minutes. See 20260823_credits_simplify.sql. */
export const LESSON_MINUTES = 50;

/** Weeks in a month, matching public.weeks_per_month() exactly. */
export const WEEKS_PER_MONTH = 4.33;

export async function getPlans(): Promise<Plan[]> {
  const db = service();

  const [{ data: plans }, { data: prices }] = await Promise.all([
    db
      .from("subscription_plans")
      .select(
        "plan_key, name, description, allowed_tiers, per_lesson_cents, intro_discount_bps, sort_order"
      )
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    db
      .from("subscription_plan_prices")
      .select(
        "plan_key, lessons_per_week, term_months, discount_bps, total_cents, currency, stripe_price_id"
      ),
  ]);

  if (!plans) return [];

  const byPlan = new Map<string, PlanPrice[]>();
  for (const row of prices ?? []) {
    const list = byPlan.get(row.plan_key) ?? [];
    list.push({
      lessonsPerWeek: row.lessons_per_week,
      termMonths: row.term_months as 1 | 3 | 12,
      discountBps: row.discount_bps,
      totalCents: row.total_cents,
      currency: row.currency || "USD",
      buyable: Boolean(row.stripe_price_id),
    });
    byPlan.set(row.plan_key, list);
  }

  return plans.map((p) => ({
    planKey: p.plan_key as string,
    name: p.name as string,
    description: p.description as string | null,
    allowedTiers: (p.allowed_tiers as string[]) ?? [],
    // Not a column: 20260823_credits_simplify.sql dropped it when it settled
    // that a lesson IS 50 minutes, and per_lesson_cents is priced in that unit.
    durationMinutes: LESSON_MINUTES,
    perLessonCents: p.per_lesson_cents as number,
    introDiscountBps: (p.intro_discount_bps as number) ?? 0,
    prices: (byPlan.get(p.plan_key) ?? []).sort(
      (a, b) => a.lessonsPerWeek - b.lessonsPerWeek || a.termMonths - b.termMonths
    ),
  }));
}

/** Does this student already hold a plan, in any state? Drives the intro offer. */
export async function hasEverSubscribed(userId: string): Promise<boolean> {
  const { count } = await service()
    .from("user_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return (count ?? 0) > 0;
}

/** Is there a live plan right now? Drives the booking gate. */
export async function hasActivePlan(userId: string): Promise<boolean> {
  const { count } = await service()
    .from("user_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["active", "past_due"]);
  return (count ?? 0) > 0;
}

export interface StarterPack {
  packKey: string;
  tier: string;
  lessons: number;
  priceCents: number;
  currency: string;
}

/** The one-off packs on sale, cheapest first. */
export async function getStarterPacks(): Promise<StarterPack[]> {
  const { data } = await service()
    .from("starter_packs")
    .select("pack_key, tier, lessons, price_cents, currency")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  return (data ?? []).map((p) => ({
    packKey: p.pack_key as string,
    tier: p.tier as string,
    lessons: p.lessons as number,
    priceCents: p.price_cents as number,
    currency: (p.currency as string) || "USD",
  }));
}

/** Has this student already used their one starter pack? */
export async function hasUsedStarterPack(userId: string): Promise<boolean> {
  const { count } = await service()
    .from("starter_pack_purchases")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "paid");
  return (count ?? 0) > 0;
}

/**
 * Can this student book anything at all right now?
 *
 * Deliberately tutor-agnostic: it asks whether they hold spendable credits
 * with SOME entitlement, not whether those credits reach one particular
 * tutor. /api/booking/create answers the precise question. This one only
 * decides whether to interrupt somebody with the buying screen, and being
 * slightly generous here costs a clearer error later rather than a lost sale.
 */
export async function canBookWithCredits(userId: string): Promise<boolean> {
  const db = service();
  const [{ data: tiers }, { data: balance }] = await Promise.all([
    db.rpc("student_allowed_tiers", { p_user_id: userId }),
    db.rpc("credit_balance", { p_user_id: userId }),
  ]);
  return Array.isArray(tiers) && tiers.length > 0 && Number(balance ?? 0) > 0;
}
