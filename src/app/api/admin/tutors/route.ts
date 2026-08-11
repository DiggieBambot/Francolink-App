// Admin control over tutor accounts and applications.
//
// The important action here is `accept_application`: it turns an application
// (which is just a form submission, with no account behind it) into a real
// tutor — auth user, users row, invite code, and a draft listing at the tier
// the reviewer chose. Before this existed, "accepted" was a label that left an
// admin to create the account by hand.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { APP_URL } from "@/lib/site/hosts";

export const runtime = "nodejs";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept_application"), id: z.uuid() }),
  z.object({
    action: z.literal("set_application_status_tier"),
    id: z.uuid(),
    proposed_tier: z.enum(["community", "certified", "professional"]).or(z.literal("")),
  }),
  z.object({
    action: z.literal("set_tier"),
    user_id: z.uuid(),
    tier: z.enum(["community", "certified", "professional"]),
  }),
  z.object({
    action: z.literal("set_bookings"),
    user_id: z.uuid(),
    accepts_bookings: z.boolean(),
  }),
  z.object({
    action: z.literal("set_listing_status"),
    user_id: z.uuid(),
    approval_status: z.enum(["approved", "pending", "rejected"]),
    reason: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal("set_role"),
    user_id: z.uuid(),
    role: z.enum(["TUTOR", "USER"]),
  }),
]);

type Db = ReturnType<typeof serviceClient>;

/** 8-char invite code, unique. Mirrors /api/auth/tutor-setup. */
async function generateInviteCode(db: Db): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = Math.random().toString(36).slice(2, 10).toUpperCase();
    const { data: clash } = await db
      .from("users")
      .select("id")
      .eq("tutor_invite_code", candidate)
      .maybeSingle();
    if (!clash) return candidate;
  }
  throw new Error("Failed to generate a unique invite code");
}

export async function POST(request: Request) {
  const staff = await getDashboardUser();
  if (!isAdmin(staff)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  let input;
  try {
    input = Action.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const db = serviceClient();

  // ------------------------------------------------------------- accept
  if (input.action === "accept_application") {
    const { data: app } = await db
      .from("tutor_applications")
      .select("*")
      .eq("id", input.id)
      .maybeSingle();
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    if (app.created_user_id) {
      return NextResponse.json(
        { error: "This application already has an account." },
        { status: 409 }
      );
    }

    const email = String(app.email).toLowerCase();

    // An in-app application already belongs to an account — promote that one.
    // Otherwise fall back to matching on email, so someone who applied from the
    // website but had already signed up as a student is promoted rather than
    // given a duplicate account they can't log into.
    let userId = (app.applicant_user_id as string | null) ?? undefined;
    if (!userId) {
      const { data: existingRow } = await db
        .from("users")
        .select("id, role")
        .ilike("email", email)
        .maybeSingle();
      userId = existingRow?.id as string | undefined;
    }
    let invited = false;

    if (!userId) {
      const { data: created, error: inviteError } =
        await db.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${APP_URL}/auth/callback`,
          data: { name: app.full_name },
        });
      if (inviteError || !created?.user) {
        console.error("[admin/tutors] invite failed", inviteError);
        return NextResponse.json(
          { error: `Couldn't invite ${email}: ${inviteError?.message ?? "unknown error"}` },
          { status: 500 }
        );
      }
      userId = created.user.id;
      invited = true;
    }

    const inviteCode = await generateInviteCode(db);

    const { error: userError } = await db.from("users").upsert(
      {
        id: userId,
        email,
        name: app.full_name,
        role: "TUTOR",
        tutor_invite_code: inviteCode,
        timezone: app.timezone || null,
        student_limit: 5,
        commission_balance: 0,
      },
      { onConflict: "id" }
    );
    if (userError) {
      console.error("[admin/tutors] users upsert failed", userError);
      return NextResponse.json(
        { error: "Account created but the profile row failed. Check the logs." },
        { status: 500 }
      );
    }

    // Seed a draft listing from what they told us, at the reviewer's tier.
    // It stays unpublished (is_public and accepts_bookings both false) so an
    // admin still reviews the wording before anything goes live.
    const baseSlug =
      String(app.full_name)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "tutor";
    let slug = baseSlug;
    for (let n = 2; n < 50; n++) {
      const { data: clash } = await db
        .from("tutor_public_profiles")
        .select("user_id")
        .eq("slug", slug)
        .maybeSingle();
      if (!clash || clash.user_id === userId) break;
      slug = `${baseSlug}-${n}`;
    }

    await db.from("tutor_public_profiles").upsert(
      {
        user_id: userId,
        slug,
        teaches: app.teaches ?? [],
        levels: app.levels ?? [],
        years_experience: app.years_experience,
        country: app.country || null,
        timezone: app.timezone || null,
        tier: app.proposed_tier || "community",
        approval_status: "pending",
        is_public: false,
        accepts_bookings: false,
      },
      { onConflict: "user_id" }
    );

    const { error: appError } = await db
      .from("tutor_applications")
      .update({ status: "accepted", created_user_id: userId })
      .eq("id", input.id);
    if (appError) {
      console.error("[admin/tutors] application update failed", appError);
    }

    return NextResponse.json({
      ok: true,
      user_id: userId,
      invited,
      message: invited
        ? `Invite sent to ${email}. They set a password, then you can publish their listing.`
        : `${email} already had an account — promoted to FrancoLink tutor. No invite needed.`,
    });
  }

  // ------------------------------------------------------- simple updates
  let error;

  switch (input.action) {
    case "set_application_status_tier":
      ({ error } = await db
        .from("tutor_applications")
        .update({ proposed_tier: input.proposed_tier || null })
        .eq("id", input.id));
      break;

    case "set_tier":
      ({ error } = await db
        .from("tutor_public_profiles")
        .update({ tier: input.tier })
        .eq("user_id", input.user_id));
      break;

    case "set_bookings":
      ({ error } = await db
        .from("tutor_public_profiles")
        .update({ accepts_bookings: input.accepts_bookings })
        .eq("user_id", input.user_id));
      break;

    case "set_listing_status":
      ({ error } = await db
        .from("tutor_public_profiles")
        .update({
          approval_status: input.approval_status,
          rejection_reason:
            input.approval_status === "rejected" ? (input.reason ?? null) : null,
        })
        .eq("user_id", input.user_id));
      break;

    case "set_role":
      ({ error } = await db
        .from("users")
        .update({ role: input.role })
        .eq("id", input.user_id));
      break;
  }

  if (error) {
    console.error(`[admin/tutors] ${input.action} failed`, error);
    return NextResponse.json({ error: "That didn't save." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
