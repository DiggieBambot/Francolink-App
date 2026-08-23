// Weekly credit grant.
//
// A plan promises N lessons per week, so credits arrive weekly rather than as
// one lump per billing period. Granting 130 credits up front for an annual plan
// would be a liability the student could burn in a month while we keep paying
// tutors for every lesson taught.
//
// The week is the student's own, not UTC. A Monday grant that lands on Sunday
// evening for a student in Auckland is a week they were told they had and did
// not get.
//
// grant_weekly_credits() is idempotent on (subscription, week): it takes a row
// lock, checks last_grant_week, and returns 0 if the week is already paid. So
// running this hourly is safe and is in fact how students in every timezone get
// their Monday — each subscription is granted on the first run after midnight
// Monday where they live.
//
// Query params:
//   ?dry=1   — report who is due, change nothing
//   ?id=...  — grant one subscription, for testing

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const MAX_PER_RUN = 500;

function authorized(req: Request): boolean {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return (
    (!!process.env.CRON_SECRET && token === process.env.CRON_SECRET) ||
    (!!process.env.SUPABASE_SERVICE_ROLE_KEY &&
      token === process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

/**
 * The Monday of the local week for a timezone, as a YYYY-MM-DD date.
 *
 * Returns null if the zone is unusable, so one bad timezone string on one user
 * row cannot stop the whole run.
 */
function localWeekStart(timezone: string | null): string | null {
  const tz = timezone || "UTC";

  try {
    // What day is it where they are, right now?
    const local = new Date(
      new Date().toLocaleString("en-US", { timeZone: tz })
    );
    // getDay(): 0 = Sunday. Shift so Monday is the start of the week.
    const daysSinceMonday = (local.getDay() + 6) % 7;
    local.setDate(local.getDate() - daysSinceMonday);

    const y = local.getFullYear();
    const m = String(local.getMonth() + 1).padStart(2, "0");
    const d = String(local.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    console.error("[cron/grant-credits] unusable timezone:", timezone);
    return null;
  }
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const onlyId = url.searchParams.get("id");

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // past_due is deliberately excluded: a failed payment pauses new credits but
  // does not touch the ones already granted, so lessons already booked go ahead.
  let query = svc
    .from("user_subscriptions")
    .select("id, user_id, plan_key, lessons_per_week, last_grant_week")
    .eq("status", "active")
    .limit(MAX_PER_RUN);

  if (onlyId) query = query.eq("id", onlyId);

  const { data: subs, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = subs || [];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, granted: 0, checked: 0 });
  }

  // One lookup for every student's timezone rather than one per subscription.
  const { data: users } = await svc
    .from("users")
    .select("id, timezone")
    .in(
      "id",
      rows.map((s) => s.user_id)
    );

  const tzOf = new Map((users || []).map((u) => [u.id, u.timezone as string | null]));

  const due: { id: string; week: string; lessons: number }[] = [];

  for (const sub of rows) {
    const week = localWeekStart(tzOf.get(sub.user_id) ?? null);
    if (!week) continue;

    // Cheap pre-filter. grant_weekly_credits() re-checks this under a lock --
    // this only avoids the round trip for the great majority already granted.
    if (sub.last_grant_week && sub.last_grant_week >= week) continue;

    due.push({ id: sub.id, week, lessons: sub.lessons_per_week });
  }

  if (dry) {
    return NextResponse.json({
      dry: true,
      checked: rows.length,
      wouldGrant: due.length,
      credits: due.reduce((n, d) => n + d.lessons, 0),
      sample: due.slice(0, 20),
    });
  }

  let granted = 0;
  let credits = 0;

  for (const d of due) {
    const { data, error: grantError } = await svc.rpc("grant_weekly_credits", {
      p_subscription_id: d.id,
      p_week: d.week,
    });

    if (grantError) {
      // One bad subscription must not stop the rest of the run.
      console.error("[cron/grant-credits] grant failed for", d.id, grantError);
      continue;
    }

    const n = Number(data ?? 0);
    if (n > 0) {
      granted += 1;
      credits += n;
    }
  }

  console.log(
    `[cron/grant-credits] granted ${credits} credit(s) across ${granted} subscription(s)`
  );

  return NextResponse.json({ ok: true, checked: rows.length, granted, credits });
}
