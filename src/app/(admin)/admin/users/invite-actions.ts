"use server";

// "Invite to apply" from the admin Users tab and user detail page.
//
// Server actions are public endpoints, so this checks for itself that the
// caller is an admin. It refuses to invite a tutor who is already listed, a
// demo account, or anyone invited in the last 14 days.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isDemoEmail } from "@/lib/demo";
import { sendApplyInvite } from "@/lib/email/transactional";
import { notifyUser } from "@/lib/notifications/create";
import { APPLY_INVITE_COOLDOWN_DAYS } from "@/lib/analytics/tutor-funnel";

export async function inviteToApply(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if ((me?.role || "").toUpperCase() !== "ADMIN") redirect("/admin/login");

  const userId = String(formData.get("user_id") || "");
  if (!userId) return;

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const [{ data: target }, { data: profile }, { data: last }] = await Promise.all([
    db.from("users").select("email, role").eq("id", userId).maybeSingle(),
    db
      .from("tutor_public_profiles")
      .select("is_public, approval_status, accepts_bookings")
      .eq("user_id", userId)
      .maybeSingle(),
    db
      .from("tutor_apply_invites")
      .select("sent_at")
      .eq("user_id", userId)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!target || isDemoEmail(target.email)) return;
  const listed =
    profile?.approval_status === "approved" && profile.is_public && profile.accepts_bookings;
  if (listed) return;
  if (last && Date.now() - Date.parse(last.sent_at) < APPLY_INVITE_COOLDOWN_DAYS * 86400_000) return;

  const isTutor = (target.role || "").toUpperCase() === "TUTOR";
  const sent = await sendApplyInvite(userId, isTutor);
  if (!sent) return;

  await db.from("tutor_apply_invites").insert({ user_id: userId, invited_by: user.id });
  await notifyUser({
    userId,
    type: "tutor_apply_invite",
    title: isTutor ? "Get listed as a FrancoLink tutor" : "Teach on FrancoLink?",
    body: isTutor
      ? "Apply to be listed so students can find, book and pay you through FrancoLink."
      : "We'd like you to apply to teach on FrancoLink.",
    url: isTutor ? "/tutor/apply" : "/become-tutor",
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}
