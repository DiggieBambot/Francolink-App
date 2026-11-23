// Where a student goes to book a paid lesson with a specific tutor.
//
// The paid flow starts on the tutor's public profile slot picker
// (`/tutors/<slug>#book` on the marketing site): pick a time → /book → login →
// /start (starter pack or plan) → /api/booking/create. This returns that URL
// for each tutor that can actually be booked there right now — a listed,
// approved profile that accepts bookings AND at least one open slot. Tutors
// without one get no entry; callers fall back to something else (the
// dashboard's "request a class" form, or skipping the email).

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getBookableSlots } from "@/lib/booking/availability";
import { SITE_URL } from "@/lib/site/hosts";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export function tutorBookUrl(slug: string): string {
  return `${SITE_URL}/tutors/${encodeURIComponent(slug)}#book`;
}

/**
 * tutorId → slot-picker URL, for the tutors in `tutorIds` that have open slots.
 * Best-effort: any failure for a tutor just leaves them out.
 */
export async function tutorBookingLinks(tutorIds: string[]): Promise<Map<string, string>> {
  const links = new Map<string, string>();
  const ids = [...new Set(tutorIds.filter(Boolean))];
  if (ids.length === 0) return links;

  const { data: profiles } = await svc()
    .from("tutor_public_profiles")
    .select("user_id, slug")
    .in("user_id", ids)
    .eq("is_public", true)
    .eq("approval_status", "approved")
    .eq("accepts_bookings", true);

  await Promise.all(
    (profiles || [])
      .filter((p) => p.slug)
      .map(async (p) => {
        try {
          const { slots } = await getBookableSlots(p.user_id as string);
          if (slots.length > 0) links.set(p.user_id as string, tutorBookUrl(p.slug as string));
        } catch (e) {
          console.error("[book-link] availability failed for", p.user_id, e);
        }
      })
  );
  return links;
}
