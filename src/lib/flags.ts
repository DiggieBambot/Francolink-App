// Lightweight, dependency-free feature flags.
//
// Onboarding experiment (PRD §3): a deterministic 50/50 split with NO storage —
// a user's bucket is a pure function of their id, so the client (which flow to
// render) and the analytics (which bucket to count) always agree without a DB
// column or extra round-trip.
//
// Kill switch: set NEXT_PUBLIC_ONBOARDING_EXPERIMENT="off" to force everyone to
// the control (current) flow. Readable on both client and server.

export type OnboardingVariant = "control" | "fast";

export function onboardingExperimentEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ONBOARDING_EXPERIMENT !== "off";
}

/** Stable per-user bucket. Same input → same variant, everywhere. */
export function onboardingVariant(userId: string | null | undefined): OnboardingVariant {
  if (!userId || !onboardingExperimentEnabled()) return "control";
  // FNV-1a hash → even/odd bucket.
  let h = 2166136261;
  for (let i = 0; i < userId.length; i++) {
    h ^= userId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2 === 0 ? "control" : "fast";
}
