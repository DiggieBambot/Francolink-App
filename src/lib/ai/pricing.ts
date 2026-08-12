// src/lib/ai/pricing.ts
//
// One rate table for every OpenAI call the app makes, so cost accounting cannot
// drift between the lesson worker and the AI tutor. Previously the worker was
// the only thing that measured what it spent; the tutor — the feature whose
// unit economics actually decide whether a subscription tier is solvent — spent
// money silently.
//
// Rates are USD per 1M tokens and DO go out of date. Check them against
// https://openai.com/api/pricing before drawing conclusions from a cost report.

export const PRICING: Record<string, { in: number; out: number }> = {
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4.1": { in: 2.0, out: 8 },
  "gpt-4.1-mini": { in: 0.4, out: 1.6 },
};

/** Fallback rate for an unrecognised model — the cheapest, so cost is never overstated as a surprise. */
const FALLBACK = PRICING["gpt-4o-mini"];

/** USD cost of a single call. */
export function costOf(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const rate = PRICING[model] ?? FALLBACK;
  return (promptTokens / 1_000_000) * rate.in + (completionTokens / 1_000_000) * rate.out;
}
