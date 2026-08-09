// Who may run a multi-learner classroom.
//
// Group classes are a paid differentiator, so the entitlement check lives here
// rather than being inlined at each call site — the room, the new-session form
// and the server action all have to agree on the answer.
//
// There are two premium signals in this codebase and they belong to different
// eras, so we accept either:
//
//   * users.tutor_plan — the live one. Every tutor row has it (today: mostly
//     'FREE', with 'pro' in use).
//   * tutor_public_profiles.tier — the marketplace/booking model added in
//     20260805_bookings.sql. That table has no rows yet, so on its own it would
//     gate the feature to nobody.
//
// When the marketplace goes live and tiers are populated, this can collapse to
// the tier check alone.

import { createClient as createServiceClient } from "@supabase/supabase-js";

/** users.tutor_plan values that include group classes. Compared case-insensitively. */
const GROUP_PLANS = ["pro", "premium", "premium_plus"];

/** tutor_public_profiles.tier values that include group classes. */
const GROUP_TIERS = ["professional"];

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * True when this tutor is entitled to open a group room.
 *
 * Reads with the service client: a tutor's own tier lives in
 * tutor_public_profiles, which is readable for published profiles but not
 * necessarily for one the tutor is still setting up.
 */
export async function tutorCanRunGroups(tutorId: string): Promise<boolean> {
  const svc = service();

  const [{ data: user }, { data: profile }] = await Promise.all([
    svc.from("users").select("tutor_plan").eq("id", tutorId).maybeSingle(),
    svc
      .from("tutor_public_profiles")
      .select("tier")
      .eq("user_id", tutorId)
      .maybeSingle(),
  ]);

  const plan = String(user?.tutor_plan || "").toLowerCase();
  const tier = String(profile?.tier || "").toLowerCase();

  return GROUP_PLANS.includes(plan) || GROUP_TIERS.includes(tier);
}
