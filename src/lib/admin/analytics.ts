// Server-only analytics queries. All run with the SERVICE ROLE (bypassing RLS)
// and are only ever called from role-gated dashboard server components.
// Resilient: if a not-yet-migrated table/column is missing, functions degrade
// to zeros/empties rather than throwing.

import { createClient } from "@supabase/supabase-js";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const DAY = 86400_000;
const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

async function count(table: string, build?: (q: any) => any): Promise<number> {
  const s = svc();
  let q = s.from(table).select("*", { count: "exact", head: true });
  if (build) q = build(q);
  const { count, error } = await q;
  return error ? 0 : count || 0;
}

export interface Overview {
  totalUsers: number;
  students: number;
  tutors: number;
  paidUsers: number;
  newToday: number;
  new7d: number;
  new30d: number;
  dau: number;
  wau: number;
  mau: number;
}

export async function getOverview(): Promise<Overview> {
  const now = Date.now();
  const iso = (ms: number) => new Date(now - ms).toISOString();

  const [totalUsers, students, tutors, paidUsers, newToday, new7d, new30d, dau, wau, mau] = await Promise.all([
    count("users"),
    count("users", (q) => q.eq("role", "USER")),
    count("users", (q) => q.eq("role", "TUTOR")),
    count("users", (q) => q.not("subscription_plan", "is", null).neq("subscription_plan", "FREE")),
    count("users", (q) => q.gte("created_at", dayKey(new Date()))),
    count("users", (q) => q.gte("created_at", iso(7 * DAY))),
    count("users", (q) => q.gte("created_at", iso(30 * DAY))),
    count("users", (q) => q.gte("last_seen_at", iso(1 * DAY))),
    count("users", (q) => q.gte("last_seen_at", iso(7 * DAY))),
    count("users", (q) => q.gte("last_seen_at", iso(30 * DAY))),
  ]);

  return { totalUsers, students, tutors, paidUsers, newToday, new7d, new30d, dau, wau, mau };
}

/** Daily new-signup counts for the last `days` days. */
export async function getSignupsOverTime(days = 30): Promise<{ date: string; count: number }[]> {
  const s = svc();
  const since = new Date(Date.now() - days * DAY).toISOString();
  const { data } = await s.from("users").select("created_at").gte("created_at", since);
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) buckets.set(dayKey(new Date(Date.now() - i * DAY)), 0);
  for (const r of data || []) {
    const k = dayKey(r.created_at);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) || 0) + 1);
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

/** Daily active users (distinct) for the last `days` days, from user_activity. */
export async function getActiveOverTime(days = 30): Promise<{ date: string; count: number }[]> {
  const s = svc();
  const since = new Date(Date.now() - days * DAY).toISOString();
  const { data, error } = await s.from("user_activity").select("user_id, occurred_at").gte("occurred_at", since);
  const buckets = new Map<string, Set<string>>();
  for (let i = days - 1; i >= 0; i--) buckets.set(dayKey(new Date(Date.now() - i * DAY)), new Set());
  if (!error) {
    for (const r of data || []) {
      const k = dayKey(r.occurred_at);
      buckets.get(k)?.add(r.user_id);
    }
  }
  return [...buckets.entries()].map(([date, set]) => ({ date, count: set.size }));
}

export interface Cohort {
  week: string;       // cohort start (YYYY-MM-DD, Monday)
  size: number;
  retention: (number | null)[]; // % active in week 0,1,2,... (0 = signup week)
}

/** Weekly signup cohorts with retention %, computed from user_activity. */
export async function getRetentionCohorts(weeks = 8): Promise<Cohort[]> {
  const s = svc();
  const [{ data: users }, { data: acts, error }] = await Promise.all([
    s.from("users").select("id, created_at"),
    s.from("user_activity").select("user_id, occurred_at"),
  ]);
  if (error || !users) return [];

  // Monday-aligned week index relative to now.
  const weekStart = (d: Date) => {
    const x = new Date(d);
    x.setUTCHours(0, 0, 0, 0);
    const dow = (x.getUTCDay() + 6) % 7; // 0 = Monday
    x.setUTCDate(x.getUTCDate() - dow);
    return x;
  };
  const nowWeek = weekStart(new Date()).getTime();
  const weekIdx = (d: Date | string) => Math.round((nowWeek - weekStart(new Date(d)).getTime()) / (7 * DAY));

  // active weeks per user
  const activeByUser = new Map<string, Set<number>>();
  for (const a of acts || []) {
    if (!activeByUser.has(a.user_id)) activeByUser.set(a.user_id, new Set());
    activeByUser.get(a.user_id)!.add(weekIdx(a.occurred_at));
  }

  // group users into cohorts (only the last `weeks` cohorts)
  const cohorts = new Map<number, string[]>();
  for (const u of users) {
    const ci = weekIdx(u.created_at);
    if (ci < 0 || ci >= weeks) continue;
    if (!cohorts.has(ci)) cohorts.set(ci, []);
    cohorts.get(ci)!.push(u.id);
  }

  const out: Cohort[] = [];
  for (let ci = weeks - 1; ci >= 0; ci--) {
    const members = cohorts.get(ci) || [];
    if (members.length === 0) continue;
    const cohortWeekStart = new Date(nowWeek - ci * 7 * DAY);
    const retention: (number | null)[] = [];
    for (let k = 0; k <= ci; k++) {
      const cohortWeekAbs = ci - k; // absolute week index for offset k
      const activeCount = members.filter((id) => activeByUser.get(id)?.has(cohortWeekAbs)).length;
      retention.push(Math.round((activeCount / members.length) * 100));
    }
    out.push({ week: dayKey(cohortWeekStart), size: members.length, retention });
  }
  return out;
}

/** Acquisition source breakdown (from first-touch signup_source). */
export async function getAcquisition(): Promise<{ source: string; count: number }[]> {
  const s = svc();
  const { data, error } = await s.from("users").select("signup_source");
  if (error) return [];
  const m = new Map<string, number>();
  for (const r of data || []) {
    const src = r.signup_source || "unknown";
    m.set(src, (m.get(src) || 0) + 1);
  }
  return [...m.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);
}

/** Signup → activation funnel. */
export async function getActivationFunnel(): Promise<{ step: string; count: number }[]> {
  const [signed, placement, connected, submitted] = await Promise.all([
    count("users", (q) => q.eq("role", "USER")),
    count("users", (q) => q.eq("role", "USER").eq("placement_test_taken", true)),
    count("users", (q) => q.eq("role", "USER").not("referred_by_tutor_id", "is", null)),
    // distinct students who submitted homework
    (async () => {
      const { data } = await svc().from("homework_submissions").select("student_id");
      return new Set((data || []).map((r) => r.student_id)).size;
    })(),
  ]);
  return [
    { step: "Signed up", count: signed },
    { step: "Took placement", count: placement },
    { step: "Connected to tutor", count: connected },
    { step: "Submitted homework", count: submitted },
  ];
}

/**
 * Activation funnel cross-segmented by acquisition source. Answers "do
 * tutor-invited students activate differently than organic ones?". Each row is a
 * source with the four funnel step counts.
 */
export interface FunnelBySourceRow {
  source: string;
  signed: number;
  placement: number;
  connected: number;
  submitted: number;
}
export async function getActivationFunnelBySource(): Promise<FunnelBySourceRow[]> {
  const s = svc();
  const [{ data: users }, { data: hw }] = await Promise.all([
    s.from("users").select("id, signup_source, placement_test_taken, referred_by_tutor_id").eq("role", "USER"),
    s.from("homework_submissions").select("student_id"),
  ]);
  const submitters = new Set((hw || []).map((r) => r.student_id));
  const by = new Map<string, FunnelBySourceRow>();
  for (const u of users || []) {
    const source = u.signup_source || "unknown";
    const row = by.get(source) || { source, signed: 0, placement: 0, connected: 0, submitted: 0 };
    row.signed++;
    if (u.placement_test_taken) row.placement++;
    if (u.referred_by_tutor_id) row.connected++;
    if (submitters.has(u.id)) row.submitted++;
    by.set(source, row);
  }
  return [...by.values()].sort((a, b) => b.signed - a.signed);
}

/**
 * Granular first-session drop-off between signup and placement, so the exact
 * abandonment point is visible. Counts distinct users who reached each step.
 */
export async function getFirstSessionDropoff(): Promise<{ step: string; count: number }[]> {
  const s = svc();
  const kinds = ["signup_completed", "dashboard_viewed", "placement_started", "placement_completed"];
  const { data } = await s.from("user_activity").select("user_id, kind").in("kind", kinds);
  const distinct = new Map<string, Set<string>>(kinds.map((k) => [k, new Set<string>()]));
  for (const r of data || []) distinct.get(r.kind as string)?.add(r.user_id as string);
  const labels: Record<string, string> = {
    signup_completed: "Signed up",
    dashboard_viewed: "Viewed dashboard",
    placement_started: "Started placement",
    placement_completed: "Completed placement",
  };
  return kinds.map((k) => ({ step: labels[k], count: distinct.get(k)?.size || 0 }));
}

/**
 * Between-lesson return, per signup-week cohort: the % of students who opened the
 * app on a day they had NO scheduled lesson (metadata.had_lesson === false on the
 * daily 'active' event). This is the core habit metric.
 */
export interface NoLessonReturnRow {
  cohort: string; // ISO week start (YYYY-MM-DD, Monday)
  users: number;
  returnedNoLesson: number;
  pct: number;
}
export async function getNoLessonReturnByCohort(weeks = 8): Promise<NoLessonReturnRow[]> {
  const s = svc();
  const since = new Date(Date.now() - weeks * 7 * DAY).toISOString();

  // Cohort = the Monday of the user's signup week.
  const weekStart = (d: Date | string) => {
    const dt = new Date(d);
    const day = (dt.getUTCDay() + 6) % 7; // 0 = Monday
    const monday = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate() - day));
    return monday.toISOString().slice(0, 10);
  };

  const [{ data: users }, { data: acts }] = await Promise.all([
    s.from("users").select("id, created_at").eq("role", "USER").gte("created_at", since),
    s.from("user_activity").select("user_id, metadata").eq("kind", "active").gte("occurred_at", since),
  ]);

  // Students who returned on at least one no-lesson day.
  const returned = new Set<string>();
  for (const a of acts || []) {
    const md = a.metadata as { had_lesson?: boolean } | null;
    if (md && md.had_lesson === false) returned.add(a.user_id as string);
  }

  const cohorts = new Map<string, { users: number; returned: number }>();
  for (const u of users || []) {
    const c = weekStart(u.created_at);
    const row = cohorts.get(c) || { users: 0, returned: 0 };
    row.users++;
    if (returned.has(u.id)) row.returned++;
    cohorts.set(c, row);
  }

  return [...cohorts.entries()]
    .map(([cohort, r]) => ({
      cohort,
      users: r.users,
      returnedNoLesson: r.returned,
      pct: r.users ? Math.round((r.returned / r.users) * 1000) / 10 : 0,
    }))
    .sort((a, b) => (a.cohort < b.cohort ? 1 : -1));
}

/**
 * Onboarding experiment (PRD §3): placement-taken rate for each variant, scoped
 * to users who were actually bucketed (have an onboarding_assigned event). This
 * is the A/B readout — does the fast, lesson-first flow lift the placement rate?
 */
export interface OnboardingExperimentRow {
  variant: string;
  users: number;
  placement: number;
  pct: number;
}
export async function getOnboardingExperiment(): Promise<OnboardingExperimentRow[]> {
  const s = svc();
  const { data: events } = await s
    .from("user_activity")
    .select("user_id, metadata, occurred_at")
    .eq("kind", "onboarding_assigned")
    .order("occurred_at", { ascending: true });

  // First assignment wins (a user's bucket is stable anyway).
  const variantByUser = new Map<string, string>();
  for (const e of events || []) {
    const v = (e.metadata as { variant?: string } | null)?.variant;
    if (v && !variantByUser.has(e.user_id as string)) variantByUser.set(e.user_id as string, v);
  }
  if (variantByUser.size === 0) return [];

  const { data: users } = await s
    .from("users")
    .select("id, placement_test_taken")
    .in("id", [...variantByUser.keys()]);
  const tookPlacement = new Map((users || []).map((u) => [u.id, !!u.placement_test_taken]));

  const buckets = new Map<string, { users: number; placement: number }>();
  for (const [userId, variant] of variantByUser) {
    const row = buckets.get(variant) || { users: 0, placement: 0 };
    row.users++;
    if (tookPlacement.get(userId)) row.placement++;
    buckets.set(variant, row);
  }

  return [...buckets.entries()]
    .map(([variant, r]) => ({
      variant,
      users: r.users,
      placement: r.placement,
      pct: r.users ? Math.round((r.placement / r.users) * 1000) / 10 : 0,
    }))
    .sort((a, b) => a.variant.localeCompare(b.variant));
}

/** Plan distribution + free→paid conversion. */
export async function getRevenue(): Promise<{ plans: { plan: string; count: number }[]; conversion: number }> {
  const s = svc();
  const { data } = await s.from("users").select("subscription_plan").eq("role", "USER");
  const m = new Map<string, number>();
  let paid = 0, total = 0;
  for (const r of data || []) {
    const plan = r.subscription_plan || "FREE";
    m.set(plan, (m.get(plan) || 0) + 1);
    total++;
    if (plan !== "FREE") paid++;
  }
  return {
    plans: [...m.entries()].map(([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count),
    conversion: total ? Math.round((paid / total) * 1000) / 10 : 0,
  };
}
