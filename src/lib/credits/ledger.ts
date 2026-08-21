// Lesson credits — the one place that reads and writes the credit ledger.
//
// Schema and the money rules behind it: supabase/migrations/20260822_lesson_credits.sql
// Product design: docs/PLAN-subscriptions.md
//
// Two things this module deliberately does NOT do:
//
//   * It never computes a balance in JavaScript. `credit_balance()` is a SQL
//     function over an append-only table; summing rows here would drift the
//     moment a second process writes.
//
//   * It never inserts a spend row directly. `spend_credits()` takes a
//     per-student advisory lock so two simultaneous bookings cannot both spend
//     the last credit. An insert from here would skip that lock.
//
// Everything uses the service client: the RLS policies let a student READ their
// own ledger and nothing more. A client able to insert could mint itself
// lessons.

import { createClient as createServiceClient } from "@supabase/supabase-js";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Reasons the ledger accepts. Mirrors the CHECK constraint on lesson_credits.reason. */
export type CreditReason =
  | "weekly_grant"
  | "signup_grant"
  | "booking"
  | "cancellation_refund"
  | "tutor_cancelled"
  | "tutor_no_show"
  | "rollover_expiry"
  | "subscription_ended"
  | "admin_adjustment";

export interface CreditEntry {
  id: number;
  delta: number;
  reason: CreditReason;
  booking_id: string | null;
  note: string | null;
  created_at: string;
}

export interface CreditSummary {
  balance: number;
  /** Null when the student has no subscription — they may still hold admin-issued credits. */
  lessonsPerWeek: number | null;
  planKey: string | null;
  planName: string | null;
  status: string | null;
  /** Credits spent since the most recent weekly grant. */
  usedThisWeek: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/** Current spendable balance. Cheap enough to call on every page render. */
export async function creditBalance(userId: string): Promise<number> {
  const { data, error } = await service().rpc("credit_balance", {
    p_user_id: userId,
  });

  if (error) {
    console.error("credits: balance lookup failed", error);
    return 0;
  }

  return Number(data ?? 0);
}

/**
 * Everything the sidebar pill and /student/subscription need, in one round trip.
 *
 * `usedThisWeek` counts spends since the last grant rather than since Monday:
 * the grant is what resets the allowance, and it lands on the student's own
 * Monday, so calendar arithmetic here would disagree with the ledger for
 * anyone not on UTC.
 */
export async function creditSummary(userId: string): Promise<CreditSummary> {
  const svc = service();

  const [{ data: balance }, { data: sub }, { data: lastGrant }] = await Promise.all([
    svc.rpc("credit_balance", { p_user_id: userId }),
    svc
      .from("user_subscriptions")
      .select(
        "plan_key, lessons_per_week, status, current_period_end, cancel_at_period_end, subscription_plans(name)"
      )
      .eq("user_id", userId)
      .in("status", ["active", "past_due"])
      .maybeSingle(),
    svc
      .from("lesson_credits")
      .select("created_at")
      .eq("user_id", userId)
      .in("reason", ["weekly_grant", "signup_grant"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let usedThisWeek = 0;

  if (lastGrant?.created_at) {
    const { data: spends } = await svc
      .from("lesson_credits")
      .select("delta")
      .eq("user_id", userId)
      .eq("reason", "booking")
      .gte("created_at", lastGrant.created_at);

    usedThisWeek = (spends ?? []).reduce((n, r) => n + Math.abs(r.delta), 0);
  }

  const planName =
    (sub as { subscription_plans?: { name?: string } | null } | null)
      ?.subscription_plans?.name ?? null;

  return {
    balance: Number(balance ?? 0),
    lessonsPerWeek: sub?.lessons_per_week ?? null,
    planKey: sub?.plan_key ?? null,
    planName,
    status: sub?.status ?? null,
    usedThisWeek,
    currentPeriodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
  };
}

/** How many credits a lesson of this length costs. Plans are priced in 25s. */
export function creditCost(durationMinutes: number): number {
  return durationMinutes >= 50 ? 2 : 1;
}

export class InsufficientCredits extends Error {
  constructor(readonly have: number, readonly need: number) {
    super(`insufficient credits: have ${have}, need ${need}`);
    this.name = "InsufficientCredits";
  }
}

/**
 * Spend credits against a booking.
 *
 * Throws `InsufficientCredits` rather than returning false: a caller that
 * forgets to check a boolean creates a free lesson, and the tutor still gets
 * paid for it. Call this INSIDE the same request that creates the booking, and
 * roll the booking back if it throws.
 *
 * Returns the ledger row id, to store on `bookings.credit_ledger_id`.
 */
export async function spendCredits(
  userId: string,
  amount: number,
  bookingId: string,
  reason: CreditReason = "booking"
): Promise<number> {
  const { data, error } = await service().rpc("spend_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_booking_id: bookingId,
    p_reason: reason,
  });

  if (error) {
    // The SQL function raises with errcode check_violation when the balance is
    // short. Anything else is a genuine failure worth surfacing as one.
    if (error.code === "23514" || /insufficient credits/.test(error.message)) {
      const have = await creditBalance(userId);
      throw new InsufficientCredits(have, amount);
    }
    throw error;
  }

  return Number(data);
}

/**
 * Give credits back. Used by the cancellation and no-show paths.
 *
 * Refunds are plain inserts, not `spend_credits` with a negative amount — there
 * is no balance to check, and no race to lose: crediting is always safe.
 */
export async function refundCredits(
  userId: string,
  amount: number,
  reason: CreditReason,
  opts: { bookingId?: string; note?: string; subscriptionId?: string } = {}
): Promise<void> {
  if (amount <= 0) return;

  const { error } = await service().from("lesson_credits").insert({
    user_id: userId,
    subscription_id: opts.subscriptionId ?? null,
    delta: amount,
    reason,
    booking_id: opts.bookingId ?? null,
    note: opts.note ?? null,
  });

  if (error) throw error;
}

/**
 * Admin-issued credits. This is what makes the whole booking-with-credits path
 * testable before any Stripe wiring exists: issue credits by hand, let real
 * students book real lessons, and confirm the economics before money moves.
 */
export async function issueCredits(
  userId: string,
  amount: number,
  note: string,
  issuedBy: string
): Promise<void> {
  if (amount === 0) throw new Error("issueCredits: amount must not be zero");

  const { error } = await service().from("lesson_credits").insert({
    user_id: userId,
    delta: amount,
    reason: "admin_adjustment",
    note,
    created_by: issuedBy,
  });

  if (error) throw error;
}

/** Ledger history for /student/subscription and the admin user page. */
export async function creditHistory(
  userId: string,
  limit = 50
): Promise<CreditEntry[]> {
  const { data, error } = await service()
    .from("lesson_credits")
    .select("id, delta, reason, booking_id, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("credits: history lookup failed", error);
    return [];
  }

  return (data ?? []) as CreditEntry[];
}
