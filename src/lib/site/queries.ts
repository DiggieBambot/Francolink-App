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
}

export interface TutorProfile extends TutorCard {
  user_id: string;
  bio: string | null;
  speaks: string[];
  qualifications: Qualification[];
  intro_video_url: string | null;
  timezone: string | null;
  invite_code: string | null;
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
  tutor_invite_code: string | null;
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
  users:users!tutor_public_profiles_user_id_fkey ( id, name, avatar_url, tutor_invite_code )
`;

function joinedUser(row: ProfileRow): JoinedUser | null {
  const u = row.users;
  return Array.isArray(u) ? (u[0] ?? null) : u;
}

function toCard(row: ProfileRow): TutorCard {
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
  };
}

/** Every tutor currently listed in the public directory. */
export async function getPublicTutors(): Promise<TutorCard[]> {
  const { data, error } = await serviceClient()
    .from("tutor_public_profiles")
    .select(PROFILE_SELECT)
    .eq("is_public", true)
    .eq("approval_status", "approved")
    .eq("accepts_bookings", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as unknown as ProfileRow[]).map(toCard);
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

  return {
    ...toCard(row),
    user_id: row.user_id,
    bio: row.bio,
    speaks: row.speaks ?? [],
    qualifications: row.qualifications ?? [],
    intro_video_url: row.intro_video_url,
    timezone: row.timezone,
    invite_code: user?.tutor_invite_code ?? null,
    availability: (slots as AvailabilitySlot[]) ?? [],
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
