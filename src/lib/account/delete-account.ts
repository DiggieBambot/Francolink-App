// src/lib/account/delete-account.ts
//
// A student deleting their own account (required by Google Play, and by
// privacy law generally). Server-only: uses the service-role client.
//
// Two outcomes, decided by whether the student has ever paid for anything:
//
//   - No payment history → the account is deleted outright: the users row
//     (whose foreign keys cascade to the rest) and the login.
//   - Payment history (booked lessons, lesson plans, starter packs) → those
//     records are kept, because bookings.student_id is ON DELETE RESTRICT and
//     tutors' earnings and our accounts depend on them. Instead the person is
//     removed from them: every personal field on the users row is wiped, the
//     login's email is replaced and the login is banned, and all learning and
//     personal data is deleted. What remains identifies nobody.
//
// Either way, billing stops first: an account that cannot have its Stripe
// subscriptions cancelled is not deleted, so nobody is charged for an account
// they were told was gone.
//
// Tutors, admins and staff cannot delete themselves here — payouts, students
// and bookings hang off their accounts — and are pointed at support.

import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe";
import { AVATAR_BUCKET, avatarStoragePath } from "@/lib/storage/avatar";
import { fetchPlayState } from "@/lib/billing/revenuecat";

const SELF_SERVICE_ROLES = new Set(["", "USER", "STUDENT"]);

/** Learning and personal data owned by the student, deleted in both paths. */
const STUDENT_DATA: ReadonlyArray<readonly [table: string, column: string]> = [
  ["ai_tutor_messages", "user_id"],
  ["ai_tutor_corrections", "user_id"],
  ["ai_tutor_conversations", "user_id"],
  ["email_campaign_sends", "user_id"],
  ["enrollments", "user_id"],
  ["exercise_attempts", "user_id"],
  ["game_scores", "user_id"],
  ["homework_submissions", "student_id"],
  ["homework_assignments", "student_id"],
  ["lesson_coverage", "student_id"],
  ["lesson_progress", "user_id"],
  ["lesson_reviews", "student_id"],
  ["notifications", "user_id"],
  ["push_subscriptions", "user_id"],
  ["device_push_tokens", "user_id"],
  ["review_prompts", "user_id"],
  ["tutor_favorites", "student_id"],
  ["tutor_students", "student_id"],
  ["class_requests", "student_id"],
  ["user_achievements", "user_id"],
  ["user_activity", "user_id"],
  ["user_languages", "user_id"],
  ["user_vocabulary", "user_id"],
];

/** Records of money changing hands. Any of these → anonymise, don't delete. */
const PAYMENT_HISTORY: ReadonlyArray<readonly [table: string, column: string]> = [
  ["bookings", "student_id"],
  ["commission_ledger", "student_id"],
  ["user_subscriptions", "user_id"],
  ["starter_pack_purchases", "user_id"],
  ["tutor_lesson_sessions", "student_id"],
  ["live_sessions", "student_id"],
];

/** A lesson that has not happened yet and is paid or being paid for. */
const UPCOMING_BOOKING_STATUSES = ["pending_payment", "confirmed"];

const LIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due", "unpaid", "incomplete"];

export type DeleteAccountResult =
  | { ok: true; mode: "deleted" | "anonymised" }
  | { ok: false; code: "NOT_FOUND" | "ROLE_NOT_ALLOWED" | "UPCOMING_LESSONS" | "PLAY_SUBSCRIPTION" | "BILLING" | "FAILED"; message: string };

export async function deleteStudentAccount(userId: string): Promise<DeleteAccountResult> {
  const db = createServiceClient();

  const { data: user, error: userErr } = await db
    .from("users")
    .select("id, role, avatar_url, stripe_subscription_id, subscription_source")
    .eq("id", userId)
    .maybeSingle();
  if (userErr) return failed("load the account", userErr.message);
  if (!user) return { ok: false, code: "NOT_FOUND", message: "Account not found." };

  if (!SELF_SERVICE_ROLES.has(String(user.role ?? "").toUpperCase())) {
    return {
      ok: false,
      code: "ROLE_NOT_ALLOWED",
      message: "Tutor and staff accounts can't be deleted here. Please contact support@francolink.net and we'll take care of it.",
    };
  }

  // A tutor would be left waiting for a student who no longer exists.
  const { count: upcoming, error: upErr } = await db
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("student_id", userId)
    .in("status", UPCOMING_BOOKING_STATUSES)
    .gt("starts_at", new Date().toISOString());
  if (upErr) return failed("check upcoming lessons", upErr.message);
  if (upcoming) {
    return {
      ok: false,
      code: "UPCOMING_LESSONS",
      message: `You have ${upcoming} upcoming lesson${upcoming === 1 ? "" : "s"} booked. Please cancel ${upcoming === 1 ? "it" : "them"} (or wait until ${upcoming === 1 ? "it's" : "they're"} done) before deleting your account.`,
    };
  }

  // A Google Play subscription can only be cancelled by the customer, in
  // Google Play. Deleting while it still renews would leave Google charging an
  // account that no longer exists, so ask them to turn renewal off first. They
  // keep access to the end of the paid period either way.
  if (user.subscription_source === "google_play") {
    const play = await fetchPlayState(userId);
    if ("error" in play) return failed("check the Google Play subscription", play.error);
    if (play.willRenew) {
      return {
        ok: false,
        code: "PLAY_SUBSCRIPTION",
        message:
          "Your Premium subscription is billed by Google Play and will renew. Please cancel it first in the Google Play app (Profile → Payments & subscriptions → Subscriptions → FrancoLink), then delete your account.",
      };
    }
  }

  // 1. Stop billing.
  const billing = await cancelSubscriptions(db, userId, user.stripe_subscription_id);
  if (!billing.ok) {
    return {
      ok: false,
      code: "BILLING",
      message: "We couldn't cancel your subscription automatically, so your account has not been deleted. Please contact support@francolink.net.",
    };
  }

  // 2. Personal and learning data goes in both paths.
  for (const [table, column] of STUDENT_DATA) {
    const { error } = await db.from(table).delete().eq(column, userId);
    // A table this deployment doesn't have is not a reason to stop.
    if (error && !isMissingTable(error)) return failed(`delete ${table}`, error.message);
  }

  const avatarPath = avatarStoragePath(user.avatar_url);
  if (avatarPath) await db.storage.from(AVATAR_BUCKET).remove([avatarPath]);

  // 3. Delete outright, or anonymise if there are payment records to keep.
  const hasPaymentHistory = await anyRows(db, PAYMENT_HISTORY, userId);
  if (hasPaymentHistory === null) return failed("check payment history", "query failed");

  if (!hasPaymentHistory) {
    const { error: rowErr } = await db.from("users").delete().eq("id", userId);
    // A reference we don't know about can still block the delete; anonymising
    // removes the person just as surely.
    if (!rowErr) {
      const { error: authErr } = await db.auth.admin.deleteUser(userId);
      if (authErr) return failed("delete the login", authErr.message);
      return { ok: true, mode: "deleted" };
    }
  }

  return anonymise(db, userId);
}

async function cancelSubscriptions(
  db: ReturnType<typeof createServiceClient>,
  userId: string,
  selfStudySubId: string | null,
): Promise<{ ok: boolean }> {
  const ids = new Set<string>();
  if (selfStudySubId) ids.add(selfStudySubId);

  const { data: plans, error } = await db
    .from("user_subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .in("status", LIVE_SUBSCRIPTION_STATUSES);
  if (error && !isMissingTable(error)) return { ok: false };
  for (const p of plans ?? []) if (p.stripe_subscription_id) ids.add(p.stripe_subscription_id);

  if (ids.size === 0) return { ok: true };
  if (!stripe) return { ok: false };

  for (const id of ids) {
    try {
      await stripe.subscriptions.cancel(id);
    } catch (err) {
      const code = (err as Stripe.errors.StripeError)?.code;
      // Already gone in Stripe is the outcome we want.
      if (code !== "resource_missing") return { ok: false };
    }
  }
  return { ok: true };
}

async function anonymise(db: ReturnType<typeof createServiceClient>, userId: string): Promise<DeleteAccountResult> {
  const placeholder = `deleted-${userId}@deleted.invalid`;

  const { error: rowErr } = await db
    .from("users")
    .update({
      email: placeholder,
      name: "Deleted user",
      avatar_url: null,
      is_active: false,
      subscription_plan: "FREE",
      stripe_subscription_id: null,
      subscription_ends_at: null,
      subscription_source: null,
      referred_by_tutor_id: null,
      tutor_invite_code: null,
      calendar_feed_token: null,
      payout_details: null,
      timezone: null,
      learning_goals: [], // text[] NOT NULL

      learning_goal_other: null,
      signup_source: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      landing_path: null,
      referrer_host: null,
      last_seen_at: null,
      email_marketing_opt_out: true,
    })
    .eq("id", userId);
  if (rowErr) return failed("anonymise the account", rowErr.message);

  // Keep the login row (records reference it) but make it unusable and free
  // the real email address for a future sign-up.
  const { error: authErr } = await db.auth.admin.updateUserById(userId, {
    email: placeholder,
    email_confirm: true,
    password: crypto.randomUUID() + crypto.randomUUID(),
    user_metadata: {},
    ban_duration: "876000h",
  });
  if (authErr) return failed("disable the login", authErr.message);

  return { ok: true, mode: "anonymised" };
}

async function anyRows(
  db: ReturnType<typeof createServiceClient>,
  tables: ReadonlyArray<readonly [string, string]>,
  userId: string,
): Promise<boolean | null> {
  for (const [table, column] of tables) {
    const { count, error } = await db.from(table).select(column, { count: "exact", head: true }).eq(column, userId);
    if (error) {
      if (isMissingTable(error)) continue;
      return null;
    }
    if (count) return true;
  }
  return false;
}

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return error.code === "42P01" || error.code === "PGRST205" || /does not exist|Could not find the table/i.test(error.message ?? "");
}

function failed(step: string, detail: string): DeleteAccountResult {
  console.error(`[delete-account] failed to ${step}: ${detail}`);
  return {
    ok: false,
    code: "FAILED",
    message: "Something went wrong deleting your account. Nothing was charged. Please try again, or contact support@francolink.net.",
  };
}
