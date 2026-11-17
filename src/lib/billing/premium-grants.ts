// Hand-granted Premium for business pilots and seats (docs/PLAN-business.md).
//
// The lesson paywall reads users.subscription_plan only, so ending a grant
// means writing FREE back. Every grant is recorded in premium_grants
// (supabase/migrations/20261116_premium_grants.sql) and expireDueGrants() runs
// daily from /api/cron/expire-grants.
//
// Ownership rules, so a grant never fights a real subscription:
//   - Never grant over a paying user (Stripe, Google Play, or a live lesson plan).
//   - A grant leaves subscription_source NULL, so a later purchase takes over.
//   - Only downgrade a user who is still source-NULL, has no Stripe
//     subscription, no live lesson plan, and no other unexpired grant.

import type { SupabaseClient } from "@supabase/supabase-js";

export type GrantPlan = "PREMIUM";

export type GrantOutcome =
  | { email: string; status: "granted" | "extended"; userId: string; endsAt: string }
  | { email: string; status: "not_found" | "already_paying" | "error"; detail?: string };

type UserRow = {
  id: string;
  email: string | null;
  subscription_plan: string | null;
  subscription_source: string | null;
  stripe_subscription_id: string | null;
};

async function hasLiveLessonPlan(db: SupabaseClient, userId: string): Promise<boolean> {
  const { count } = await db
    .from("user_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");
  return (count ?? 0) > 0;
}

function isPaying(u: UserRow): boolean {
  return (
    u.subscription_source === "stripe" ||
    u.subscription_source === "google_play" ||
    !!u.stripe_subscription_id
  );
}

/** Escape LIKE wildcards so an email is matched literally (case-insensitively). */
function likeLiteral(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function grantPremium(
  db: SupabaseClient,
  args: {
    emails: string[];
    endsAt: Date;
    reason: string;
    organization: string | null;
    grantedBy: string;
  }
): Promise<GrantOutcome[]> {
  const out: GrantOutcome[] = [];
  const endsAtIso = args.endsAt.toISOString();

  for (const raw of args.emails) {
    const email = raw.trim().toLowerCase();
    if (!email) continue;

    const { data: users, error } = await db
      .from("users")
      .select("id, email, subscription_plan, subscription_source, stripe_subscription_id")
      .ilike("email", likeLiteral(email))
      .limit(2);
    if (error) {
      out.push({ email, status: "error", detail: error.message });
      continue;
    }
    const user = (users as UserRow[] | null)?.[0];
    if (!user) {
      // Learners create their own accounts; they have to sign up first.
      out.push({ email, status: "not_found" });
      continue;
    }
    if (isPaying(user) || (await hasLiveLessonPlan(db, user.id))) {
      out.push({ email, status: "already_paying" });
      continue;
    }

    const { count: existing } = await db
      .from("premium_grants")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active");

    const { error: insErr } = await db.from("premium_grants").insert({
      user_id: user.id,
      plan: "PREMIUM",
      ends_at: endsAtIso,
      organization: args.organization,
      reason: args.reason,
      granted_by: args.grantedBy,
    });
    if (insErr) {
      out.push({ email, status: "error", detail: insErr.message });
      continue;
    }

    // The latest unexpired grant decides the end date shown on the account.
    const latestEnd = await latestActiveGrantEnd(db, user.id);
    const { error: upErr } = await db
      .from("users")
      .update({
        subscription_plan: "PREMIUM",
        subscription_ends_at: latestEnd ?? endsAtIso,
        subscription_started_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .is("subscription_source", null);
    if (upErr) {
      out.push({ email, status: "error", detail: upErr.message });
      continue;
    }

    out.push({
      email,
      status: (existing ?? 0) > 0 ? "extended" : "granted",
      userId: user.id,
      endsAt: latestEnd ?? endsAtIso,
    });
  }
  return out;
}

async function latestActiveGrantEnd(db: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await db
    .from("premium_grants")
    .select("ends_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1);
  return data?.[0]?.ends_at ?? null;
}

/**
 * Put a user back on FREE if nothing else entitles them. Returns true if the
 * user was downgraded.
 */
async function downgradeIfOnlyGrant(db: SupabaseClient, userId: string): Promise<boolean> {
  if (await latestActiveGrantEnd(db, userId)) return false; // another grant still runs

  const { data: user } = await db
    .from("users")
    .select("id, email, subscription_plan, subscription_source, stripe_subscription_id")
    .eq("id", userId)
    .maybeSingle();
  if (!user) return false;
  if (isPaying(user as UserRow)) return false;
  if (await hasLiveLessonPlan(db, userId)) return false;
  if ((user.subscription_plan || "FREE") === "FREE") return false;

  const { error } = await db
    .from("users")
    .update({ subscription_plan: "FREE", subscription_ends_at: new Date().toISOString() })
    .eq("id", userId)
    .is("subscription_source", null)
    .is("stripe_subscription_id", null);
  return !error;
}

export async function revokeGrant(db: SupabaseClient, grantId: string): Promise<{ ok: boolean; downgraded: boolean; error?: string }> {
  const { data: grant, error } = await db
    .from("premium_grants")
    .update({ status: "revoked", ended_at: new Date().toISOString() })
    .eq("id", grantId)
    .eq("status", "active")
    .select("user_id")
    .maybeSingle();
  if (error) return { ok: false, downgraded: false, error: error.message };
  if (!grant) return { ok: false, downgraded: false, error: "Grant not found or already ended" };
  const downgraded = await downgradeIfOnlyGrant(db, grant.user_id);
  return { ok: true, downgraded };
}

/** Daily: end every active grant whose end date has passed. */
export async function expireDueGrants(
  db: SupabaseClient,
  opts: { dryRun?: boolean; limit?: number } = {}
): Promise<{ due: number; expired: number; downgraded: number }> {
  const { data: due } = await db
    .from("premium_grants")
    .select("id, user_id")
    .eq("status", "active")
    .lte("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: true })
    .limit(opts.limit ?? 500);

  const rows = due ?? [];
  if (opts.dryRun) return { due: rows.length, expired: 0, downgraded: 0 };

  let expired = 0;
  let downgraded = 0;
  const users = new Set<string>();
  for (const g of rows) {
    const { error } = await db
      .from("premium_grants")
      .update({ status: "expired", ended_at: new Date().toISOString() })
      .eq("id", g.id)
      .eq("status", "active");
    if (!error) {
      expired++;
      users.add(g.user_id);
    }
  }
  for (const userId of users) {
    if (await downgradeIfOnlyGrant(db, userId)) downgraded++;
  }
  return { due: rows.length, expired, downgraded };
}
