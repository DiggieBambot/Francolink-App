// Access model for self-study (solo, paced lesson study with progress).
//
//   Browse catalogue + view a lesson  → always free (handled elsewhere).
//   Self-study mode                    → gated by canAccessSelfStudy().
//
// A user can self-study for free if they are a tutor/admin, OR have an active
// subscription, OR are linked to a tutor (the tutor's benefit extends to their
// students). Otherwise they hit the subscription paywall.

export interface AccessUser {
  role?: string | null;
  subscription_plan?: string | null;
  subscription_tier?: string | null;
  subscription_ends_at?: string | null;
  referred_by_tutor_id?: string | null;
}

export type SelfStudyAccess =
  | { allowed: true; reason: "tutor" | "admin" | "subscription" | "linked_to_tutor" }
  | { allowed: false; reason: "needs_subscription" };

function hasActiveSubscription(u: AccessUser): boolean {
  const plan = (u.subscription_plan || u.subscription_tier || "").toLowerCase();
  if (!plan || plan === "free" || plan === "none") return false;
  if (u.subscription_ends_at) {
    return new Date(u.subscription_ends_at).getTime() > Date.now();
  }
  return true; // plan set, no end date → treat as active
}

export function canAccessSelfStudy(u: AccessUser | null | undefined): SelfStudyAccess {
  if (!u) return { allowed: false, reason: "needs_subscription" };
  const role = (u.role || "").toUpperCase();
  if (role === "ADMIN") return { allowed: true, reason: "admin" };
  if (role === "TUTOR") return { allowed: true, reason: "tutor" };
  if (hasActiveSubscription(u)) return { allowed: true, reason: "subscription" };
  if (u.referred_by_tutor_id) return { allowed: true, reason: "linked_to_tutor" };
  return { allowed: false, reason: "needs_subscription" };
}
