// Server-side application of the signup risk rules.
//
// The Postgres auth hook (supabase/migrations/20260821_signup_risk.sql) blocks
// the worst signups before an account exists. This is the second layer: it runs
// on our own routes, where the decision that matters is not "may this account
// exist" but "does this account get to appear in a real tutor's class list and
// send them an email". A borderline signup lands as `pending` instead — the
// tutor still sees it under Students and can accept, but nothing is auto-
// connected and no "X asked to join your class" mail goes out unprompted.
//
// Scoring itself lives in ./signup-risk so it stays pure and testable.

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { assessSignup, AUTO_DECLINE_THRESHOLD, type SignupRisk } from "./signup-risk";

export type { SignupRisk };

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Score an existing account by id, using whatever the risk columns already
 * hold plus a fresh look at the name and email. Falls back to "allow" if the
 * user can't be read — a lookup failure must not lock a real student out.
 */
export async function assessUser(userId: string): Promise<SignupRisk> {
  const service = svc();
  const { data: user } = await service
    .from("users")
    .select("email, name, risk_score, risk_status")
    .eq("id", userId)
    .maybeSingle();

  if (!user?.email) return { score: 0, verdict: "allow", reasons: [] };

  const fresh = assessSignup({ email: user.email, name: user.name });

  // The auth hook may already have marked this account at signup, before the
  // profile row existed. Honour the harsher of the two.
  if (user.risk_status === "review" && fresh.verdict === "allow") {
    return { score: user.risk_score ?? 4, verdict: "review", reasons: ["flagged_at_signup"] };
  }
  return fresh;
}

/** Persist the verdict on the account, so admin can see and sort by it. */
export async function recordRisk(userId: string, risk: SignupRisk): Promise<void> {
  await svc()
    .from("users")
    .update({
      risk_score: risk.score,
      risk_reasons: risk.reasons,
      risk_status: risk.verdict === "allow" ? "clear" : "review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (risk.verdict !== "allow") {
    await svc().from("signup_risk_log").insert({
      email: `user:${userId}`,
      score: risk.score,
      verdict: risk.verdict,
      reasons: risk.reasons,
    });
  }
}

/**
 * The connection status a student should get when joining a tutor.
 *
 *   active   — clean, connects and mails the tutor exactly as before.
 *   pending  — borderline. The tutor is asked; they know their own students
 *              better than a heuristic does.
 *   declined — confidently spam. Turned away without bothering the tutor, but
 *              the row is still written so it appears under "Automatically
 *              declined" and can be undone in one click. No mail either way.
 *   blocked  — no row at all.
 *
 * The gap between pending and declined is the whole point: a tutor drowning in
 * scripted requests is not being helped by a queue of them, and a heuristic
 * confident enough to auto-decline should still have to show its work.
 */
export async function joinStatusFor(
  userId: string
): Promise<{ status: "active" | "pending" | "declined"; blocked: boolean; risk: SignupRisk }> {
  const risk = await assessUser(userId);
  if (risk.verdict !== "allow") await recordRisk(userId, risk);

  const status =
    risk.verdict === "allow"
      ? "active"
      : risk.score >= AUTO_DECLINE_THRESHOLD
        ? "declined"
        : "pending";

  return { status, blocked: risk.verdict === "block", risk };
}
