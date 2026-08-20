// A tutor's own listing on francolink.net/tutors.
//
// The tutor controls the content and whether they want to be listed at all;
// an admin controls whether it goes live. Any edit to a profile that was
// already approved sends it back to 'pending' — otherwise a tutor could pass
// review with one bio and then swap in another.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import { isValidTimezone } from "@/lib/booking/slots";
import { revalidateTutorPages } from "@/lib/site/revalidate";

/**
 * RLS on tutor_public_profiles / tutor_availability only permits
 * `auth.uid() = user_id`, which is right for a tutor editing themselves but
 * blocks an admin authoring someone else's listing. The admin path therefore
 * writes with the service role, gated by the explicit role check below.
 */
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export const runtime = "nodejs";

const Qualification = z.object({
  title: z.string().trim().min(1).max(160),
  issuer: z.string().trim().max(160).optional(),
  year: z.number().int().min(1950).max(2100).optional(),
});

const Body = z.object({
  headline: z.string().trim().max(200).optional().default(""),
  bio: z.string().trim().max(4000).optional().default(""),
  teaches: z.array(z.string().trim().min(2).max(5)).max(6).default([]),
  speaks: z.array(z.string().trim().min(2).max(5)).max(10).default([]),
  levels: z.array(z.string().trim().max(4)).max(6).default([]),
  specialties: z.array(z.string().trim().max(80)).max(25).default([]),
  qualifications: z.array(Qualification).max(10).default([]),
  years_experience: z.number().int().min(0).max(70).nullable().default(null),
  photo_url: z.string().url().max(500).nullable().default(null),
  intro_video_url: z.string().url().max(500).nullable().default(null),
  country: z.string().trim().max(80).optional().default(""),
  // Must be a real IANA zone: every slot calculation runs it through Intl,
  // which throws on anything else and would take the public page down.
  timezone: z
    .string()
    .trim()
    .max(60)
    .optional()
    .default("")
    .refine((tz) => tz === "" || isValidTimezone(tz), {
      message: "Pick a timezone from the list.",
    }),
  trial_available: z.boolean().default(true),
  is_public: z.boolean().default(false),
  // Admin-only: author a profile for another tutor, and optionally publish it
  // without a round trip through the review queue. Ignored for tutors.
  user_id: z.uuid().optional(),
  approve: z.boolean().optional(),
  // Admin-only commercial controls. A tutor cannot set their own tier (it
  // decides their pay) nor switch themselves on for bookings.
  tier: z.enum(["community", "certified", "professional"]).optional(),
  accepts_bookings: z.boolean().optional(),
});

/** "Marie-Claire Dupont" → "marie-claire-dupont" */
function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "tutor"
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: me } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .maybeSingle();
  const callerRole = (me?.role || "").toUpperCase();

  let input;
  try {
    input = Body.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Some fields aren't valid.", detail: String(err) },
      { status: 400 }
    );
  }

  // Whose profile is this? A tutor may only ever write their own; an admin may
  // author any tutor's, which is how the directory gets populated in practice.
  const editingSomeoneElse = Boolean(input.user_id && input.user_id !== user.id);
  if (editingSomeoneElse && callerRole !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  if (!editingSomeoneElse && callerRole !== "TUTOR" && callerRole !== "ADMIN") {
    return NextResponse.json({ error: "Tutors only" }, { status: 403 });
  }

  const targetId = editingSomeoneElse ? input.user_id! : user.id;
  let targetName = me?.name ?? "";

  // A tutor may only write a listing once we've accepted their application.
  // Having a TUTOR account just means they can teach students they brought
  // themselves; being listed on francolink.net is a separate thing we approve.
  // Admins are exempt — they author listings on a tutor's behalf, and the
  // accept flow seeds the row before the tutor ever opens the editor.
  if (!editingSomeoneElse && callerRole !== "ADMIN") {
    const [{ data: accepted }, { data: existingProfile }] = await Promise.all([
      supabase
        .from("tutor_applications")
        .select("id")
        .eq("applicant_user_id", user.id)
        .eq("status", "accepted")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("tutor_public_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    // An existing row means an admin already created one for them (via the
    // accept flow or by hand), so editing it is fine.
    if (!accepted && !existingProfile) {
      return NextResponse.json(
        {
          error:
            "Apply to become a FrancoLink tutor first — we review every application before a profile can go live.",
          needsApplication: true,
        },
        { status: 403 }
      );
    }
  }

  if (editingSomeoneElse) {
    const { data: target } = await supabase
      .from("users")
      .select("id, name, role")
      .eq("id", targetId)
      .maybeSingle();
    // ADMIN is allowed here too: the founder teaches, and forcing a role
    // change just to appear in the directory would cost them the admin panel.
    const targetRole = (target?.role || "").toUpperCase();
    if (!target || (targetRole !== "TUTOR" && targetRole !== "ADMIN")) {
      return NextResponse.json(
        { error: "That user can't be listed as a tutor" },
        { status: 400 }
      );
    }
    targetName = target.name ?? "";
  }

  // Only an admin can decide a profile is approved. A tutor's own save always
  // re-enters the queue, so they can't pass review and then swap the content.
  const approvalStatus =
    callerRole === "ADMIN" && input.approve ? "approved" : "pending";

  // Reads and writes of the profile row itself go through `db`; `supabase`
  // stays user-scoped for anything about the caller.
  const db = editingSomeoneElse ? serviceClient() : supabase;


  const { data: existing } = await db
    .from("tutor_public_profiles")
    .select("slug")
    .eq("user_id", targetId)
    .maybeSingle();

  // Slug is assigned once and never changes — inbound links must keep working.
  let slug = existing?.slug;
  if (!slug) {
    const base = slugify(targetName || "tutor");
    slug = base;
    for (let n = 2; n < 50; n++) {
      const { data: clash } = await db
        .from("tutor_public_profiles")
        .select("user_id")
        .eq("slug", slug)
        .maybeSingle();
      if (!clash) break;
      slug = `${base}-${n}`;
    }
  }

  const { error: upsertError } = await db
    .from("tutor_public_profiles")
    .upsert(
      {
        user_id: targetId,
        slug,
        headline: input.headline || null,
        bio: input.bio || null,
        teaches: input.teaches,
        speaks: input.speaks,
        levels: input.levels,
        specialties: input.specialties,
        qualifications: input.qualifications,
        years_experience: input.years_experience,
        photo_url: input.photo_url,
        intro_video_url: input.intro_video_url,
        country: input.country || null,
        timezone: input.timezone || null,
        trial_available: input.trial_available,
        // Only an admin may move these; a tutor's save leaves them untouched.
        ...(callerRole === "ADMIN" && input.tier ? { tier: input.tier } : {}),
        ...(callerRole === "ADMIN" && input.accepts_bookings !== undefined
          ? { accepts_bookings: input.accepts_bookings }
          : {}),
        is_public: input.is_public,
        approval_status: approvalStatus,
        rejection_reason: null,
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.error("[tutor/public-profile] upsert failed", upsertError);
    return NextResponse.json({ error: "Couldn't save your profile." }, { status: 500 });
  }


  // The listing just changed — drop the website's cached copies so the change
  // (or the un-publishing that a re-review causes) is visible immediately.
  revalidateTutorPages(slug);

  return NextResponse.json({ ok: true, slug, approval_status: approvalStatus });
}
