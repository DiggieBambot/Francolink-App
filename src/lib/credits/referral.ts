// Referral pay on live lesson plans.
//
// The legacy model (percentage of every invoice, forever) still governs
// self-study subscriptions and lives in the Stripe webhook. This module is the
// lesson-plan side: one flat bounty, once per referred student.
//
// Why it is paid HERE and not from the invoice:
//
//   The bounty is awarded when the student completes their FIRST LESSON, not
//   when their first payment clears. Same gate, two jobs -- it is the moment
//   the referral has actually worked, and it is what stops a tutor recruiting
//   accounts that pay once and never turn up.
//
// Reversal: if the plan is refunded under the 14-day withdrawal right, the
// bounty goes back with it. See reverseReferralBounty.

import { createClient as createServiceClient } from "@supabase/supabase-js";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function setting(key: string, fallback: string): Promise<string> {
  const { data } = await service()
    .from("app_settings")
    .select("value")
    .eq("category", "commissions")
    .eq("key", key)
    .maybeSingle();

  return data?.value ?? fallback;
}

/** The bounty for a plan, in dollars. Unknown plans pay the community rate. */
async function bountyFor(planKey: string): Promise<number> {
  const key =
    planKey === "professional"
      ? "lesson_plan_bounty_professional"
      : "lesson_plan_bounty_community";

  const raw = await setting(key, planKey === "professional" ? "20.00" : "10.00");
  const amount = parseFloat(raw);

  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

/**
 * Award the one-time referral bounty, if one is owed.
 *
 * Safe to call after every completed lesson: a unique partial index on
 * (tutor_id, student_id) where kind = 'lesson_plan_bounty' means the second
 * and later calls insert nothing. That is deliberate -- the caller should not
 * have to know whether this student's first lesson was this one.
 *
 * Never throws. A referral bounty failing must not fail the lesson that
 * triggered it.
 */
export async function awardReferralBounty(studentId: string): Promise<void> {
  try {
    const svc = service();

    if ((await setting("lesson_plan_bounty_enabled", "true")) !== "true") return;

    const { data: student } = await svc
      .from("users")
      .select("id, referred_by_tutor_id")
      .eq("id", studentId)
      .maybeSingle();

    // No referrer, or self-referral. Both are no-ops rather than errors.
    if (!student?.referred_by_tutor_id) return;
    if (student.referred_by_tutor_id === studentId) return;

    // The bounty is for putting a student on a LESSON PLAN. A student with no
    // live subscription has not earned anyone one.
    const { data: sub } = await svc
      .from("user_subscriptions")
      .select("plan_key")
      .eq("user_id", studentId)
      .in("status", ["active", "past_due"])
      .maybeSingle();

    if (!sub) return;

    const amount = await bountyFor(sub.plan_key);
    if (amount <= 0) return;

    const { error } = await svc.from("commission_ledger").insert({
      tutor_id: student.referred_by_tutor_id,
      student_id: studentId,
      kind: "lesson_plan_bounty",
      amount,
      status: "paid",
    });

    if (error) {
      // 23505 is the unique index doing its job: already paid. Anything else
      // is worth seeing in the logs.
      if (error.code !== "23505") {
        console.error("referral: bounty insert failed", error);
      }
      return;
    }

    await adjustTutorBalance(student.referred_by_tutor_id, amount);

    console.log(
      `referral: $${amount.toFixed(2)} bounty -> tutor ${student.referred_by_tutor_id} for student ${studentId}`
    );
  } catch (err) {
    console.error("referral: awardReferralBounty threw", err);
  }
}

/**
 * Take the bounty back when the plan that earned it is refunded.
 *
 * Writes an offsetting ledger row rather than deleting the original: the
 * unique index would otherwise let the bounty be earned a second time, and a
 * payment that was made and reversed is not the same as one that never
 * happened.
 */
export async function reverseReferralBounty(
  studentId: string,
  reason: string
): Promise<void> {
  try {
    const svc = service();

    const { data: paid } = await svc
      .from("commission_ledger")
      .select("id, tutor_id, amount")
      .eq("student_id", studentId)
      .eq("kind", "lesson_plan_bounty")
      .gt("amount", 0)
      .maybeSingle();

    if (!paid) return;

    // Already reversed?
    const { count } = await svc
      .from("commission_ledger")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("kind", "lesson_plan_bounty")
      .lt("amount", 0);

    if ((count ?? 0) > 0) return;

    await svc.from("commission_ledger").insert({
      tutor_id: paid.tutor_id,
      student_id: studentId,
      kind: "lesson_plan_bounty",
      amount: -Math.abs(paid.amount),
      status: "paid",
      description: `Bounty reversed: ${reason}`,
    });

    await adjustTutorBalance(paid.tutor_id, -Math.abs(paid.amount));
  } catch (err) {
    console.error("referral: reverseReferralBounty threw", err);
  }
}

/** Move a tutor's running balance by `delta` dollars. */
async function adjustTutorBalance(tutorId: string, delta: number): Promise<void> {
  const svc = service();

  const { data: tutor } = await svc
    .from("users")
    .select("commission_balance")
    .eq("id", tutorId)
    .maybeSingle();

  const current = parseFloat(String(tutor?.commission_balance ?? "0")) || 0;
  const next = Math.round((current + delta) * 100) / 100;

  await svc
    .from("users")
    .update({ commission_balance: next })
    .eq("id", tutorId);
}

/**
 * True when this Stripe subscription is a live LESSON PLAN rather than a
 * self-study subscription.
 *
 * The webhook uses this to keep the legacy percentage commission away from
 * lesson-plan revenue. Without it, every renewal invoice would quietly skim
 * 5% off margin that is already half committed to the teaching tutor's wages,
 * and nothing in the system would report that it had happened.
 */
export async function isLessonPlanSubscription(
  stripeSubscriptionId: string | null
): Promise<boolean> {
  if (!stripeSubscriptionId) return false;

  const { data } = await service()
    .from("user_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  return !!data;
}
