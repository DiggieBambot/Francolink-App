// The tutor marketplace funnel, computed in one place for every page that
// shows it: admin Live Lessons, the admin Users tab and the tutor's own
// Insights page. Same numbers everywhere, by construction.
//
//   directory view -> profile view -> booking click -> checkout started
//     -> paid -> first lesson completed -> came back for another
//
// Before checkout comes from tutor_profile_events (anonymous visitors too).
// From checkout on comes from bookings: a booking row exists from the moment
// a student reaches Stripe, so "started checkout" and "abandoned" are already
// recorded there.
//
// Server-only: pass a service-role client.
import type { SupabaseClient } from "@supabase/supabase-js";
import { isDemoEmail } from "@/lib/demo";

/** An admin can re-send "Invite to apply" to the same person after this long. */
export const APPLY_INVITE_COOLDOWN_DAYS = 14;

export type ListingStatus = "listed" | "pending" | "rejected" | "hidden" | "not_applied";

export const LISTING_LABEL: Record<ListingStatus, string> = {
  listed: "Listed",
  pending: "Applied · pending",
  rejected: "Rejected",
  hidden: "Approved · hidden",
  not_applied: "Not applied",
};

/** Same rule as the public directory (getPublicTutors in lib/site/queries). */
export async function getListingStatuses(
  db: SupabaseClient
): Promise<Map<string, { status: ListingStatus; slug: string }>> {
  const { data } = await db
    .from("tutor_public_profiles")
    .select("user_id, slug, is_public, approval_status, accepts_bookings");
  const out = new Map<string, { status: ListingStatus; slug: string }>();
  for (const p of data ?? []) {
    let status: ListingStatus;
    if (p.approval_status === "pending") status = "pending";
    else if (p.approval_status === "rejected") status = "rejected";
    else if (p.is_public && p.accepts_bookings) status = "listed";
    else status = "hidden";
    out.set(p.user_id as string, { status, slug: p.slug as string });
  }
  return out;
}

export interface TutorNumbers {
  views: number;
  uniqueVisitors: number;
  slotClicks: number;
  favoritesAdded: number;
  favoritesRemoved: number;
  checkouts: number;
  abandoned: number;
  paid: number;
  completed: number;
  firstLessons: number;
  repeatStudents: number;
  revenueCents: number;
  tutorPayCents: number;
}

export interface Funnel {
  directoryViews: number;
  total: TutorNumbers;
  perTutor: Map<string, TutorNumbers>;
  bySource: { source: string; views: number; slotClicks: number }[];
  byDay: { day: string; views: number }[];
  /** Earliest event we have; numbers before this date don't exist. */
  trackingSince: string | null;
}

const PAID = new Set(["confirmed", "completed", "no_show_student"]);

export function emptyNumbers(): TutorNumbers {
  return {
    views: 0, uniqueVisitors: 0, slotClicks: 0, favoritesAdded: 0, favoritesRemoved: 0,
    checkouts: 0, abandoned: 0, paid: 0, completed: 0, firstLessons: 0, repeatStudents: 0,
    revenueCents: 0, tutorPayCents: 0,
  };
}

/** Share of `b` out of `a`, as a whole percentage, or null when `a` is 0. */
export function pct(b: number, a: number): number | null {
  return a > 0 ? Math.round((b / a) * 100) : null;
}

/**
 * @param tutorIds limit to these tutors (e.g. listed ones, or one tutor).
 *                 Omit for every tutor.
 */
export async function getTutorFunnel(
  db: SupabaseClient,
  { since, tutorIds }: { since: Date; tutorIds?: string[] }
): Promise<Funnel> {
  const sinceIso = since.toISOString();
  const only = tutorIds ? new Set(tutorIds) : null;
  const inScope = (id: string | null) => !!id && (!only || only.has(id));

  const [eventsRes, firstEventRes, bookingsRes, paidAllRes] = await Promise.all([
    db
      .from("tutor_profile_events")
      .select("tutor_id, kind, visitor_id, source, created_at")
      .gte("created_at", sinceIso)
      .limit(100000),
    db.from("tutor_profile_events").select("created_at").order("created_at").limit(1),
    db
      .from("bookings")
      .select("tutor_id, student_id, status, price_cents, tutor_pay_cents, created_at, expires_at")
      .gte("created_at", sinceIso)
      .limit(50000),
    // All-time paid bookings: needed to tell a first lesson from a repeat.
    db
      .from("bookings")
      .select("tutor_id, student_id, status, starts_at")
      .in("status", Array.from(PAID))
      .limit(100000),
  ]);

  // Demo students and tutors never count.
  const ids = new Set<string>();
  for (const b of [...(bookingsRes.data ?? []), ...(paidAllRes.data ?? [])]) {
    ids.add(b.student_id);
    ids.add(b.tutor_id);
  }
  const demo = new Set<string>();
  if (ids.size) {
    const { data: people } = await db.from("users").select("id, email").in("id", Array.from(ids));
    for (const p of people ?? []) if (isDemoEmail(p.email)) demo.add(p.id);
  }

  const perTutor = new Map<string, TutorNumbers>();
  const total = emptyNumbers();
  const get = (id: string) => {
    let n = perTutor.get(id);
    if (!n) perTutor.set(id, (n = emptyNumbers()));
    return n;
  };
  const add = (id: string, key: keyof TutorNumbers, v = 1) => {
    get(id)[key] += v;
    total[key] += v;
  };

  // ---- Before checkout: events ----
  let directoryViews = 0;
  const visitors = new Map<string, Set<string>>();
  const allVisitors = new Set<string>();
  const sources = new Map<string, { views: number; slotClicks: number }>();
  const days = new Map<string, number>();
  for (const e of eventsRes.data ?? []) {
    if (e.kind === "directory_view") {
      directoryViews++;
      continue;
    }
    if (!inScope(e.tutor_id)) continue;
    const t = e.tutor_id as string;
    const src = sources.get(e.source || "direct") ?? { views: 0, slotClicks: 0 };
    if (e.kind === "profile_view") {
      add(t, "views");
      if (!visitors.has(t)) visitors.set(t, new Set());
      visitors.get(t)!.add(e.visitor_id);
      allVisitors.add(e.visitor_id);
      src.views++;
      const d = (e.created_at as string).slice(0, 10);
      days.set(d, (days.get(d) ?? 0) + 1);
    } else if (e.kind === "slot_selected") {
      add(t, "slotClicks");
      src.slotClicks++;
    } else if (e.kind === "favorite_added") add(t, "favoritesAdded");
    else if (e.kind === "favorite_removed") add(t, "favoritesRemoved");
    if (e.kind === "profile_view" || e.kind === "slot_selected") sources.set(e.source || "direct", src);
  }
  for (const [t, v] of visitors) get(t).uniqueVisitors = v.size;
  total.uniqueVisitors = allVisitors.size;

  // ---- Checkout onward: bookings ----
  const now = Date.now();
  for (const b of bookingsRes.data ?? []) {
    if (!inScope(b.tutor_id) || demo.has(b.student_id) || demo.has(b.tutor_id)) continue;
    add(b.tutor_id, "checkouts");
    if (b.status === "expired" || (b.status === "pending_payment" && b.expires_at && Date.parse(b.expires_at) < now)) {
      add(b.tutor_id, "abandoned");
    }
    if (PAID.has(b.status)) {
      add(b.tutor_id, "paid");
      add(b.tutor_id, "revenueCents", b.price_cents);
      add(b.tutor_id, "tutorPayCents", b.tutor_pay_cents);
    }
  }

  // First lessons and repeat students, per tutor-student pair.
  const pairs = new Map<string, string[]>(); // "tutor|student" -> lesson start times
  for (const b of paidAllRes.data ?? []) {
    if (!inScope(b.tutor_id) || demo.has(b.student_id) || demo.has(b.tutor_id)) continue;
    const k = `${b.tutor_id}|${b.student_id}`;
    if (!pairs.has(k)) pairs.set(k, []);
    pairs.get(k)!.push(b.starts_at as string);
  }
  const nowIso = new Date().toISOString();
  for (const [k, starts] of pairs) {
    const tutor = k.split("|")[0];
    starts.sort();
    const past = starts.filter((s) => s <= nowIso);
    if (past.length && past[0] >= sinceIso) add(tutor, "firstLessons");
    // Came back: two or more paid lessons, at least one of them in range.
    if (starts.length >= 2 && starts[starts.length - 1] >= sinceIso) add(tutor, "repeatStudents");
    add(tutor, "completed", past.filter((s) => s >= sinceIso).length);
  }

  return {
    directoryViews,
    total,
    perTutor,
    bySource: Array.from(sources.entries())
      .map(([source, v]) => ({ source, ...v }))
      .sort((a, b) => b.views - a.views),
    byDay: Array.from(days.entries())
      .map(([day, views]) => ({ day, views }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    trackingSince: (firstEventRes.data?.[0]?.created_at as string | undefined) ?? null,
  };
}
