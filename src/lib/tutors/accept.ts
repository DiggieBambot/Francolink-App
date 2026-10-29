// Turning a tutor application into a working FrancoLink tutor, and telling
// them what to do next. Shared by the Tutors panel's Accept button and the
// Website → Applications status dropdown, so "accepted" means the same thing
// whichever screen an admin used.

import type { SupabaseClient } from "@supabase/supabase-js";
import { APP_URL } from "@/lib/site/hosts";
import { notifyUser } from "@/lib/notifications/create";
import { sendTransactionalEmail, firstNameOf } from "@/lib/email/transactional";
import { emailShell } from "@/lib/email/shell";

type Db = SupabaseClient;

const PROFILE_PATH = "/tutor/public-profile";

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

export type AcceptResult =
  | { user_id: string; invited: boolean; message: string }
  | { error: string; status: number };

/**
 * Create the account (or promote an existing one), seed a draft listing at the
 * reviewer's tier, mark the application accepted, and email the tutor.
 */
export async function acceptApplication(db: Db, id: string): Promise<AcceptResult> {
  const { data: app } = await db
    .from("tutor_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!app) {
    return { error: "Application not found", status: 404 };
  }
  if (app.created_user_id) {
    return { error: "This application already has an account.", status: 409 };
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
        redirectTo: `${APP_URL}/auth/callback?next=${PROFILE_PATH}`,
        data: { name: app.full_name },
      });
    if (inviteError || !created?.user) {
      console.error("[admin/tutors] invite failed", inviteError);
      return { error: `Couldn't invite ${email}: ${inviteError?.message ?? "unknown error"}`, status: 500 };
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
    return { error: "Account created but the profile row failed. Check the logs.", status: 500 };
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
    .eq("id", id);
  if (appError) {
    console.error("[admin/tutors] application update failed", appError);
  }

  await sendAcceptedWelcome(db, { userId, email, name: app.full_name, invited });

  return {
    user_id: userId,
    invited,
    message: invited
      ? `Accepted. ${email} gets an invite to set a password and an email explaining how to finish their profile.`
      : `Accepted. ${email} already had an account — they've been emailed how to finish their profile.`,
  };
}

/**
 * Tell an accepted tutor they're in and exactly what to do next. A brand-new
 * account also gets Supabase's separate "set your password" invite, so this
 * email says to look for it. Safe to send again (the catch-up script does).
 */
export async function sendAcceptedWelcome(
  db: Db,
  { userId, email, name, invited }: { userId: string; email: string; name?: string | null; invited: boolean }
) {
  const firstName = firstNameOf(name, email);
  const ctaHref = `${APP_URL}${PROFILE_PATH}`;
  const steps = [
    "Add a headline — one line students see under your name.",
    "Write a few lines about how you teach and who you're best with.",
    "Upload a clear, friendly photo of yourself.",
    "Set your weekly availability so students can book you.",
  ];

  await notifyUser({
    userId,
    type: "tutor_accepted",
    title: "You're a FrancoLink tutor — finish your profile",
    body: "Add your headline, about you, photo and availability. We review it, then put you live on francolink.net.",
    url: PROFILE_PATH,
  });

  const passwordLineHtml = invited
    ? `<p style="margin:0 0 16px 0;font-size:15px;">First, look for a separate email from us titled <strong>"You have been invited"</strong> and set your password. If you don't see it, check spam, or use "Forgot password" on the login page with this email address.</p>`
    : "";
  const passwordLineText = invited
    ? 'First, look for a separate email from us titled "You have been invited" and set your password (check spam, or use "Forgot password" with this email address).\n\n'
    : "";

  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">Good news — your application was accepted. You're now a FrancoLink tutor.</p>
     ${passwordLineHtml}
     <p style="margin:0 0 8px 0;font-size:15px;">Before students can find you on francolink.net, finish your public profile:</p>
     <ol style="margin:0 0 16px 0;padding-left:20px;font-size:15px;line-height:1.6;">${steps.map((s) => `<li>${s}</li>`).join("")}</ol>
     <p style="margin:0 0 16px 0;font-size:15px;">Then save. Our team reviews it and puts you live on francolink.net. You can also find it any time under <strong>Public profile</strong> in your tutor sidebar.</p>
     <p style="margin:0 0 16px 0;font-size:15px;color:#475569;">Questions? Just reply to this email.</p>`;

  await sendTransactionalEmail(
    email,
    "You're accepted — finish your FrancoLink tutor profile",
    emailShell({ firstName, bodyHtml, ctaHref, ctaText: "Complete my profile" }),
    `Hi ${firstName},\n\nGood news — your application was accepted. You're now a FrancoLink tutor.\n\n${passwordLineText}Before students can find you, finish your public profile:\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nThen save. We review it and put you live.\n\n${ctaHref}\n\nQuestions? Just reply to this email.`
  );
}
