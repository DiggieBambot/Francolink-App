// Server-only queries for the front-facing website (francolink.net).
//
// Uses the service-role key so the pages render for anonymous visitors without
// depending on a session. RLS already restricts these tables to published rows,
// but every query below repeats the filter explicitly — the service role
// bypasses RLS, so the filter here is the one that actually protects a
// tutor who hasn't opted in yet.

import { createClient } from "@supabase/supabase-js";
import type { Tier } from "./pricing";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface Qualification {
  title: string;
  issuer?: string;
  year?: number;
}

export interface AvailabilitySlot {
  weekday: number; // 0 = Sunday … 6 = Saturday
  start_minute: number;
  end_minute: number;
}

export interface TutorCard {
  slug: string;
  name: string;
  headline: string | null;
  photo_url: string | null;
  country: string | null;
  teaches: string[];
  levels: string[];
  specialties: string[];
  years_experience: number | null;
  /** Drives the lesson price — FrancoLink sets prices, tutors don't. */
  tier: Tier;
  trial_available: boolean;
  /** Languages the tutor also speaks — a filter facet, not a selling point. */
  speaks: string[];
  /**
   * Coarse weekly availability, as "weekday-band" keys like "2-evening".
   * Bands are cut in the TUTOR's timezone here and re-cut per viewer in the
   * browser; see availabilityBands(). Empty means we have no schedule for
   * them, which the directory treats as "unknown", never as "never free".
   */
  availability_bands: string[];
}

export interface TutorProfile extends TutorCard {
  user_id: string;
  bio: string | null;
  qualifications: Qualification[];
  intro_video_url: string | null;
  timezone: string | null;
  availability: AvailabilitySlot[];
  testimonials: Testimonial[];
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_role: string | null;
  author_photo: string | null;
  author_country: string | null;
  quote: string;
  rating: number | null;
}

export interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
}

// The joined `users` row Supabase returns alongside a profile.
interface JoinedUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

interface ProfileRow {
  user_id: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  teaches: string[] | null;
  speaks: string[] | null;
  levels: string[] | null;
  specialties: string[] | null;
  qualifications: Qualification[] | null;
  years_experience: number | null;
  photo_url: string | null;
  intro_video_url: string | null;
  country: string | null;
  timezone: string | null;
  tier: string | null;
  trial_available: boolean;
  users: JoinedUser | JoinedUser[] | null;
}

const PROFILE_SELECT = `
  user_id, slug, headline, bio, teaches, speaks, levels, specialties,
  qualifications, years_experience, photo_url, intro_video_url, country,
  timezone, tier, trial_available,
  users:users!tutor_public_profiles_user_id_fkey ( id, name, avatar_url )
`;

function joinedUser(row: ProfileRow): JoinedUser | null {
  const u = row.users;
  return Array.isArray(u) ? (u[0] ?? null) : u;
}

/**
 * Time-of-day bands. Deliberately three and not twenty-four: somebody
 * filtering a directory is asking "can they do evenings", not "are they free
 * at 18:15". Boundaries are local minutes past midnight.
 */
export const TIME_BANDS: { key: string; label: string; from: number; to: number }[] = [
  { key: "morning", label: "Morning", from: 5 * 60, to: 12 * 60 },
  { key: "afternoon", label: "Afternoon", from: 12 * 60, to: 17 * 60 },
  { key: "evening", label: "Evening", from: 17 * 60, to: 23 * 60 },
];

/**
 * Which "weekday-band" keys a set of availability slots covers.
 *
 * A slot counts for a band if it OVERLAPS it at all, rather than having to sit
 * inside it — a tutor free 16:00–18:00 genuinely can teach you in the evening,
 * and requiring containment would hide them from the filter that matters most.
 */
export function availabilityBands(slots: AvailabilitySlot[]): string[] {
  const out = new Set<string>();
  for (const slot of slots) {
    for (const band of TIME_BANDS) {
      if (slot.start_minute < band.to && slot.end_minute > band.from) {
        out.add(`${slot.weekday}-${band.key}`);
      }
    }
  }
  return [...out];
}

function toCard(row: ProfileRow, bands: string[] = []): TutorCard {
  const user = joinedUser(row);
  return {
    slug: row.slug,
    name: user?.name || "FrancoLink tutor",
    headline: row.headline,
    photo_url: row.photo_url || user?.avatar_url || null,
    country: row.country,
    teaches: row.teaches ?? [],
    levels: row.levels ?? [],
    specialties: row.specialties ?? [],
    years_experience: row.years_experience,
    tier: (row.tier as Tier) || "community",
    trial_available: row.trial_available,
    speaks: row.speaks ?? [],
    availability_bands: bands,
  };
}

/** Every tutor currently listed in the public directory. */
export async function getPublicTutors(): Promise<TutorCard[]> {
  const supabase = serviceClient();

  const { data, error } = await supabase
    .from("tutor_public_profiles")
    .select(PROFILE_SELECT)
    .eq("is_public", true)
    .eq("approval_status", "approved")
    .eq("accepts_bookings", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  const rows = data as unknown as ProfileRow[];

  // Availability for the whole directory in ONE query, not one per tutor. The
  // filter rail needs it to answer "who can do Tuesday evening", and N+1 here
  // would be a round-trip per card on a page that is otherwise static.
  const { data: slots } = await supabase
    .from("tutor_availability")
    .select("tutor_id, weekday, start_minute, end_minute")
    .in("tutor_id", rows.map((r) => r.user_id));

  const byTutor = new Map<string, AvailabilitySlot[]>();
  for (const s of (slots ?? []) as (AvailabilitySlot & { tutor_id: string })[]) {
    byTutor.set(s.tutor_id, [...(byTutor.get(s.tutor_id) ?? []), s]);
  }

  return rows.map((row) =>
    toCard(row, availabilityBands(byTutor.get(row.user_id) ?? []))
  );
}

/** One tutor's full public profile, or null if they aren't listed. */
export async function getPublicTutor(slug: string): Promise<TutorProfile | null> {
  const supabase = serviceClient();

  const { data, error } = await supabase
    .from("tutor_public_profiles")
    .select(PROFILE_SELECT)
    .eq("slug", slug)
    .eq("is_public", true)
    .eq("approval_status", "approved")
    .eq("accepts_bookings", true)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as ProfileRow;
  const user = joinedUser(row);

  const [{ data: slots }, { data: quotes }] = await Promise.all([
    supabase
      .from("tutor_availability")
      .select("weekday, start_minute, end_minute")
      .eq("tutor_id", row.user_id)
      .order("weekday", { ascending: true })
      .order("start_minute", { ascending: true }),
    supabase
      .from("testimonials")
      .select("id, author_name, author_role, author_photo, author_country, quote, rating")
      .eq("tutor_id", row.user_id)
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .limit(6),
  ]);

  const availability = (slots as AvailabilitySlot[]) ?? [];

  return {
    ...toCard(row, availabilityBands(availability)),
    user_id: row.user_id,
    bio: row.bio,
    qualifications: row.qualifications ?? [],
    intro_video_url: row.intro_video_url,
    timezone: row.timezone,
    availability,
    testimonials: (quotes as Testimonial[]) ?? [],
  };
}

/** Slugs for generateStaticParams / the sitemap. */
export async function getPublicTutorSlugs(): Promise<string[]> {
  const { data } = await serviceClient()
    .from("tutor_public_profiles")
    .select("slug")
    .eq("is_public", true)
    .eq("approval_status", "approved")
    .eq("accepts_bookings", true);
  return (data ?? []).map((r) => r.slug as string);
}

export async function getTestimonials(limit = 24): Promise<Testimonial[]> {
  const { data } = await serviceClient()
    .from("testimonials")
    .select("id, author_name, author_role, author_photo, author_country, quote, rating")
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Testimonial[]) ?? [];
}

export async function getFaqs(): Promise<Faq[]> {
  const { data } = await serviceClient()
    .from("site_faqs")
    .select("id, category, question, answer")
    .eq("is_published", true)
    .order("category", { ascending: true })
    .order("display_order", { ascending: true });
  return (data as Faq[]) ?? [];
}

/**
 * Which plans can book which tutor tier, straight from the plans table.
 *
 * The rule lives in `subscription_plans.allowed_tiers` and is enforced at
 * booking time in lib/booking/confirm.ts. The directory has to say the same
 * thing, and a hardcoded copy here would drift the first time a plan changes —
 * so this derives it instead.
 */
export async function getPlanNamesByTier(): Promise<Record<string, string[]>> {
  const { data } = await serviceClient()
    .from("subscription_plans")
    .select("name, allowed_tiers, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const out: Record<string, string[]> = {};
  for (const plan of (data ?? []) as { name: string; allowed_tiers: string[] | null }[]) {
    for (const tier of plan.allowed_tiers ?? []) {
      out[tier] = [...(out[tier] ?? []), plan.name];
    }
  }
  return out;
}
