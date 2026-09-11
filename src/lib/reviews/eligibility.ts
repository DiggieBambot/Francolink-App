// Who gets asked for a review, and when.
//
// The rule that matters is not the threshold -- it is that we ask after a win
// the user can feel, never on arrival and never at a paywall. A prompt shown to
// someone mid-frustration costs a review AND some goodwill; the same prompt one
// lesson later is free. So eligibility is deliberately conservative: earn the
// ask, then ask once.

import { createClient } from "@supabase/supabase-js";

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

/**
 * Deep link that opens Trustpilot's "write a review" form for our domain,
 * pre-scoped so the user never has to search for us. Overridable because the
 * Trustpilot business unit slug is the kind of thing that changes once, at the
 * worst possible moment, and should not need a deploy.
 */
export const TRUSTPILOT_REVIEW_URL =
  process.env.NEXT_PUBLIC_TRUSTPILOT_REVIEW_URL || "https://www.trustpilot.com/evaluate/www.francolink.net";

/** Consecutive-day streak that counts as "this is working for me". */
const STREAK_THRESHOLD = 7;
/** Roughly a dozen completed lessons/games, for people who study in bursts. */
const XP_THRESHOLD = 750;
/** Never ask an account younger than this, however fast they burned through it. */
const MIN_ACCOUNT_AGE_DAYS = 5;
/** Two unanswered asks is the limit. A third is nagging. */
const MAX_TIMES_SHOWN = 2;

export type PromptStatus = "pending" | "snoozed" | "positive" | "negative" | "declined";

export interface PromptDecision {
  /** Should the client render the card right now? */
  show: boolean;
  /** Why it was earned -- surfaced in the card's copy so the ask feels specific. */
  reason?: "streak" | "progress";
  /** The streak value, when that is what earned it. */
  streak?: number;
  trustpilotUrl: string;
}

const NO: PromptDecision = { show: false, trustpilotUrl: TRUSTPILOT_REVIEW_URL };

/**
 * Decide whether to show the review prompt to a user. Reads state and
 * eligibility in two cheap queries. Never throws -- a failure here must not
 * take down the dashboard it renders inside.
 */
export async function decidePrompt(userId: string): Promise<PromptDecision> {
  if (!userId) return NO;
  const s = svc();

  try {
    const { data: state } = await s
      .from("review_prompts")
      .select("status, times_shown, snooze_until")
      .eq("user_id", userId)
      .maybeSingle();

    if (state) {
      // Answered, either way -- we are done with this user for good.
      if (state.status !== "pending" && state.status !== "snoozed") return NO;
      if ((state.times_shown ?? 0) >= MAX_TIMES_SHOWN) return NO;
      if (state.snooze_until && new Date(state.snooze_until) > new Date()) return NO;
    }

    const { data: u } = await s
      .from("users")
      .select("current_streak, total_xp, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (!u) return NO;

    const ageDays = u.created_at
      ? (Date.now() - new Date(u.created_at).getTime()) / 86_400_000
      : 0;
    if (ageDays < MIN_ACCOUNT_AGE_DAYS) return NO;

    const streak = u.current_streak ?? 0;
    const xp = u.total_xp ?? 0;

    // Streak wins the tie: "12 days in a row" is a far better opening line than
    // "you've earned some XP", so prefer it whenever both are true.
    if (streak >= STREAK_THRESHOLD) {
      return { show: true, reason: "streak", streak, trustpilotUrl: TRUSTPILOT_REVIEW_URL };
    }
    if (xp >= XP_THRESHOLD) {
      return { show: true, reason: "progress", trustpilotUrl: TRUSTPILOT_REVIEW_URL };
    }
    return NO;
  } catch (e) {
    console.error("[reviews] decidePrompt failed:", (e as Error).message);
    return NO;
  }
}

/** Bump the render counter. Called once, when the card actually appears. */
export async function markShown(userId: string): Promise<void> {
  try {
    const s = svc();
    const { data } = await s
      .from("review_prompts")
      .select("times_shown")
      .eq("user_id", userId)
      .maybeSingle();
    await s.from("review_prompts").upsert(
      {
        user_id: userId,
        status: "pending",
        times_shown: (data?.times_shown ?? 0) + 1,
        snooze_until: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (e) {
    console.error("[reviews] markShown failed:", (e as Error).message);
  }
}

/** Record the user's answer. `feedback` only applies to the negative branch. */
export async function recordAnswer(
  userId: string,
  status: PromptStatus,
  opts: { feedback?: string; snoozeDays?: number } = {}
): Promise<void> {
  try {
    const patch: Record<string, unknown> = {
      user_id: userId,
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "snoozed") {
      const days = opts.snoozeDays ?? 14;
      patch.snooze_until = new Date(Date.now() + days * 86_400_000).toISOString();
    }
    // Trimmed and capped: this lands in an admin inbox, not a document store.
    if (opts.feedback) patch.feedback = opts.feedback.trim().slice(0, 2000);
    if (status === "positive") patch.sent_at = new Date().toISOString();

    await svc().from("review_prompts").upsert(patch, { onConflict: "user_id" });
  } catch (e) {
    console.error("[reviews] recordAnswer failed:", (e as Error).message);
  }
}
