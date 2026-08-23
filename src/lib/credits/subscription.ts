// The lifecycle of a live lesson plan: starting one, and ending one.
//
// Kept out of the Stripe webhook route because both operations touch the credit
// ledger, and the ledger is money. The webhook decides WHICH of these to call;
// what each one does to a student's balance lives here.

import type Stripe from "stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { creditBalance } from "@/lib/credits/ledger";
import { reverseReferralBounty } from "@/lib/credits/referral";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Monday of the current week in a timezone, as YYYY-MM-DD. */
function localWeekStart(timezone: string | null): string {
  try {
    const local = new Date(
      new Date().toLocaleString("en-US", { timeZone: timezone || "UTC" })
    );
    local.setDate(local.getDate() - ((local.getDay() + 6) % 7));
    const m = String(local.getMonth() + 1).padStart(2, "0");
    const d = String(local.getDate()).padStart(2, "0");
    return `${local.getFullYear()}-${m}-${d}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * A checkout completed: write the plan and grant its first week immediately.
 *
 * Granting here rather than waiting for the cron matters — a student who has
 * just paid lands on the site expecting to book, and telling them to come back
 * on Monday is how a subscription gets cancelled on day one.
 *
 * Idempotent: Stripe redelivers, and a second call finds the subscription row
 * already present and returns. Credits are money, so this must be true.
 */
export async function activateLessonPlan(
  session: Stripe.Checkout.Session
): Promise<void> {
  const db = service();

  const userId = session.metadata?.supabase_user_id;
  const planKey = session.metadata?.plan_key;
  const lessonsPerWeek = Number(session.metadata?.lessons_per_week || 0);
  const termMonths = Number(session.metadata?.term_months || 0);

  const stripeSubId =
    typeof session.subscription === "string" ? session.subscription : null;

  if (!userId || !planKey || !lessonsPerWeek || !termMonths || !stripeSubId) {
    console.error("[plan] checkout missing metadata", session.id, session.metadata);
    return;
  }

  // Already handled? Stripe retries, and so does the dashboard's "resend".
  const { data: existing } = await db
    .from("user_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", stripeSubId)
    .maybeSingle();

  if (existing) {
    console.log("[plan] already activated:", stripeSubId);
    return;
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + termMonths);

  const { data: sub, error } = await db
    .from("user_subscriptions")
    .insert({
      user_id: userId,
      plan_key: planKey,
      lessons_per_week: lessonsPerWeek,
      term_months: termMonths,
      status: "active",
      stripe_subscription_id: stripeSubId,
      stripe_customer_id:
        typeof session.customer === "string" ? session.customer : null,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      started_at: now.toISOString(),
    })
    .select("id")
    .single();

  if (error || !sub) {
    // 23505 is the one-live-plan-per-student index: they already have one.
    console.error("[plan] activation insert failed", stripeSubId, error);
    return;
  }

  // A lesson plan also unlocks the self-study material.
  await db
    .from("users")
    .update({ subscription_plan: "PREMIUM_PLUS" })
    .eq("id", userId);

  // First week's credits, right now.
  const { data: student } = await db
    .from("users")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();

  const { error: grantError } = await db.rpc("grant_weekly_credits", {
    p_subscription_id: sub.id,
    p_week: localWeekStart(student?.timezone ?? null),
  });

  if (grantError) {
    // The plan is live and paid for; the cron will grant on its next run.
    console.error("[plan] first grant failed for", sub.id, grantError);
  }

  console.log(
    `[plan] activated ${planKey} ${lessonsPerWeek}/week for ${termMonths}mo -> user ${userId}`
  );
}

/**
 * A plan ended. Expire what is left and mark it closed.
 *
 * Unused credits do NOT survive the plan that granted them — they were an
 * allowance for a period of service, not a balance the student owns. That
 * distinction is also what keeps them from being stored value, so the copy and
 * the code have to agree on it.
 *
 * Any refund owed is handled separately by subscription_refund_due(): a
 * cancellation inside the 14-day withdrawal window, or mid-term, is money back,
 * and that is a decision a human or the cancel flow makes, not this handler.
 */
export async function endLessonPlan(
  stripeSub: Stripe.Subscription
): Promise<void> {
  const db = service();

  const { data: sub } = await db
    .from("user_subscriptions")
    .select("id, user_id, status")
    .eq("stripe_subscription_id", stripeSub.id)
    .maybeSingle();

  if (!sub) {
    console.log("[plan] cancellation for unknown subscription:", stripeSub.id);
    return;
  }

  if (sub.status === "canceled" || sub.status === "expired") return;

  const balance = await creditBalance(sub.user_id);

  if (balance > 0) {
    const { error } = await db.from("lesson_credits").insert({
      user_id: sub.user_id,
      subscription_id: sub.id,
      delta: -balance,
      reason: "subscription_ended",
      note: "plan ended; unused allowance expired",
    });

    if (error) console.error("[plan] expiring credits failed", sub.id, error);
  }

  await db
    .from("user_subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
    })
    .eq("id", sub.id);

  // A student who never completed a lesson earned nobody a bounty. One who did
  // keeps it -- reverseReferralBounty only acts inside the refund window.
  if (
    stripeSub.cancel_at_period_end === false &&
    stripeSub.status === "canceled"
  ) {
    const { count } = await db
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("student_id", sub.user_id)
      .eq("status", "completed");

    if ((count ?? 0) === 0) {
      await reverseReferralBounty(sub.user_id, "plan ended with no lesson taken");
    }
  }

  // Self-study access reverts; the lesson plan was what granted it.
  await db
    .from("users")
    .update({ subscription_plan: "FREE" })
    .eq("id", sub.user_id);

  console.log(`[plan] ended ${sub.id}, expired ${balance} credit(s)`);
}
