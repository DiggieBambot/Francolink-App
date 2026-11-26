// "As low as" figures for live lessons, for the homepage's pricing section.
//
// Read from the same tables the checkout charges from (subscription plans,
// their term prices, and public starter packs), so the shop window can never
// quote less than a student could actually pay. Every number here is the
// LOWEST real price per 50-minute lesson, with the condition that gets it.

import { getPlans, getStarterPacks, WEEKS_PER_MONTH } from "@/lib/credits/plans";

export interface LivePlanPrice {
  planKey: string;
  name: string;
  allowedTiers: string[];
  /** Month-to-month price of one lesson. */
  monthlyPerLessonCents: number;
  /** The cheapest price of one lesson, on the longest discounted term. */
  lowestPerLessonCents: number;
  /** The term (months) that gives the lowest price. */
  lowestTermMonths: number;
  /** One lesson a week on that term, per month. */
  lowestMonthlyCents: number;
  /** Lessons-per-week options on sale, ascending. */
  lessonsPerWeek: number[];
  /** Discount per term in basis points, e.g. { 3: 1000, 12: 2000 }. */
  termDiscounts: Record<number, number>;
}

export interface StarterPackPrice {
  tier: string;
  lessons: number;
  priceCents: number;
  perLessonCents: number;
}

export interface LiveLessonPrices {
  plans: LivePlanPrice[];
  packs: StarterPackPrice[];
  /** The single lowest per-lesson price anywhere, or null with no data. */
  lowestCents: number | null;
}

export async function getLiveLessonPrices(): Promise<LiveLessonPrices> {
  const [plans, packs] = await Promise.all([
    getPlans().catch(() => []),
    getStarterPacks().catch(() => []),
  ]);

  const planPrices: LivePlanPrice[] = plans
    .flatMap((p): LivePlanPrice[] => {
      // Only rows that can actually be bought set a public price.
      const rows = p.prices.filter((r) => r.buyable);
      const usable = rows.length > 0 ? rows : p.prices;
      if (usable.length === 0) return [];

      let best = usable[0];
      for (const r of usable) if (r.discountBps > best.discountBps) best = r;
      const lowest = Math.round((p.perLessonCents * (10000 - best.discountBps)) / 10000);

      const termDiscounts: Record<number, number> = {};
      for (const r of usable) termDiscounts[r.termMonths] = r.discountBps;

      return [{
        planKey: p.planKey,
        name: p.name,
        allowedTiers: p.allowedTiers,
        monthlyPerLessonCents: p.perLessonCents,
        lowestPerLessonCents: lowest,
        lowestTermMonths: best.termMonths,
        lowestMonthlyCents: Math.round(lowest * WEEKS_PER_MONTH),
        lessonsPerWeek: [...new Set(usable.map((r) => r.lessonsPerWeek))].sort((a, b) => a - b),
        termDiscounts,
      }];
    })
    .sort((a, b) => a.lowestPerLessonCents - b.lowestPerLessonCents);

  const packPrices: StarterPackPrice[] = packs
    .filter((p) => p.lessons > 0)
    .map((p) => ({
      tier: p.tier,
      lessons: p.lessons,
      priceCents: p.priceCents,
      perLessonCents: Math.round(p.priceCents / p.lessons),
    }))
    .sort((a, b) => a.perLessonCents - b.perLessonCents);

  const all = [
    ...planPrices.map((p) => p.lowestPerLessonCents),
    ...packPrices.map((p) => p.perLessonCents),
  ];

  return {
    plans: planPrices,
    packs: packPrices,
    lowestCents: all.length > 0 ? Math.min(...all) : null,
  };
}

/** $8, $8.50, $108.25: whole dollars drop the cents. */
export function usd(cents: number): string {
  const v = cents / 100;
  return `$${Number.isInteger(v) ? v : v.toFixed(2)}`;
}
