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

const Slot = z.object({
  weekday: z.number().int().min(0).max(6),
  start_minute: z.number().int().min(0).max(1440),
  end_minute: z.number().int().min(0).max(1440),
});

const Body = z.object({
  headline: z.string().trim().max(200).optional().default(""),
  bio: z.string().trim().max(4000).optional().default(""),
  teaches: z.array(z.string().trim().min(2).max(5)).max(6).default([]),
  speaks: z.array(z.string().trim().min(2).max(5)).max(10).default([]),
  levels: z.array(z.string().trim().max(4)).max(6).default([]),
  specialties: z.array(z.string().trim().max(80)).max(10).default([]),
  qualifications: z.array(Qualification).max(10).default([]),
  years_experience: z.number().int().min(0).max(70).nullable().default(null),
  photo_url: z.string().url().max(500).nullable().default(null),
  intro_video_url: z.string().url().max(500).nullable().default(null),
  country: z.string().trim().max(80).optional().default(""),
  timezone: z.string().trim().max(60).optional().default(""),
  trial_available: z.boolean().default(true),
  is_public: z.boolean().default(false),
  availability: z.array(Slot).max(60).default([]),
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

  const invalidSlot = input.availability.find(
    (s) => s.end_minute <= s.start_minute
  );
  if (invalidSlot) {
    return NextResponse.json(
      { error: "Each availability slot must end after it starts." },
      { status: 400 }
    );
  }

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

  // Availability is a full replace — simpler and safer than diffing slots.
  await db.from("tutor_availability").delete().eq("tutor_id", targetId);
  if (input.availability.length > 0) {
    const { error: slotError } = await db.from("tutor_availability").insert(
      input.availability.map((s) => ({ ...s, tutor_id: targetId }))
    );
    if (slotError) {
      console.error("[tutor/public-profile] availability insert failed", slotError);
      return NextResponse.json(
        { error: "Profile saved, but your availability didn't save." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, slug, approval_status: approvalStatus });
}
