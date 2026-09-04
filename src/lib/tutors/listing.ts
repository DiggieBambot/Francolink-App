// Who counts as a FrancoLink tutor.
//
// This is the single most consequential boolean in the product, and until this
// file existed it had no name — it was written out longhand, identically, in
// two routes that had no idea they were asking the same question:
//
//   * api/booking/create  — may this person be booked and paid for?
//   * api/room/[id]/video-token — may this room have live video?
//
// Those must never disagree. A tutor who can take a booking but not video
// sells a live lesson that cannot happen; a tutor with video but no bookings
// costs us Daily minutes against a lesson we take no money for. Same predicate,
// one definition, one place.
//
// It now decides a third and larger thing: WHICH ROOM you get. A listed tutor
// teaches in the Classroom — scheduled, timed, live. Everyone else — and today
// that is most tutor accounts, people teaching students they brought
// themselves — gets the Study Space, which is a room built for sharing
// material rather than a classroom with the video broken off.
//
// Three conditions, all required:
//   approval_status = 'approved'  — a human reviewed and accepted them
//   is_public                     — they are in the directory
//   accepts_bookings              — they are open for business

import { createClient as createServiceClient } from "@supabase/supabase-js";

export interface TutorListing {
  user_id: string;
  slug: string | null;
  tier: string | null;
  trial_available: boolean | null;
  accepts_bookings: boolean | null;
  approval_status: string | null;
  is_public: boolean | null;
}

/** The columns every caller of this module needs. Kept together so a new
    condition is added in one select, not three. */
const LISTING_COLUMNS =
  "user_id, slug, tier, trial_available, accepts_bookings, approval_status, is_public";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * A listing that passed. Narrowing to this is the point: a tutor who is in the
 * directory and open for business necessarily HAS a slug and a tier, so
 * callers past the gate should not have to null-check commercial fields that
 * cannot be null for anyone they are allowed to serve.
 */
export interface ListedTutor extends TutorListing {
  slug: string;
  tier: string;
}

/**
 * The definition itself, as a type guard.
 *
 * Pure, so it can be applied to a row a caller already fetched: the booking
 * route reads the profile by slug and needs the other columns anyway, and
 * re-querying to answer this would be a second round trip for a question the
 * row in hand already answers.
 */
export function isListed(
  profile: TutorListing | null | undefined
): profile is ListedTutor {
  return (
    !!profile &&
    profile.approval_status === "approved" &&
    profile.is_public === true &&
    profile.accepts_bookings === true &&
    // Belt and braces: the directory cannot address a tutor without a slug,
    // and pricing cannot quote one without a tier. Neither should be null on
    // an approved profile, and if one is, that tutor is not servable.
    typeof profile.slug === "string" &&
    typeof profile.tier === "string"
  );
}

/** The listing row for a tutor, or null if they have no public profile. */
export async function listingFor(tutorId: string): Promise<TutorListing | null> {
  const { data } = await service()
    .from("tutor_public_profiles")
    .select(LISTING_COLUMNS)
    .eq("user_id", tutorId)
    .maybeSingle();
  return (data as TutorListing) ?? null;
}

/** The listing row for a tutor by directory slug. */
export async function listingBySlug(slug: string): Promise<TutorListing | null> {
  const { data } = await service()
    .from("tutor_public_profiles")
    .select(LISTING_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  return (data as TutorListing) ?? null;
}

/** Is this tutor a listed FrancoLink tutor? */
export async function isListedTutor(tutorId: string): Promise<boolean> {
  return isListed(await listingFor(tutorId));
}

/**
 * Which room a tutor's sessions are.
 *
 * "classroom" — live, scheduled, video, timed.
 * "space"     — shared material, chat and board, no call.
 */
export type RoomKind = "classroom" | "space";

export async function roomKindFor(tutorId: string): Promise<RoomKind> {
  return (await isListedTutor(tutorId)) ? "classroom" : "space";
}
