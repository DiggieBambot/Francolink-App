// Proves that a `userId` in a request body really is the caller's own,
// brand-new account.
//
// The problem this solves: /api/auth/tutor-setup and /api/auth/student-setup
// run with the service role and take `userId` from the POST body. They have to
// use the service role — with email confirmation on there is no session yet at
// that point, and cookie auth would hit RLS and silently leave `role` null,
// which is the bug the comment in tutor-setup warns about. But taken together
// that meant anyone could POST any userId and have the row written for them.
// tutor-setup in particular upserts `role: 'TUTOR'`, so it was a straight
// privilege escalation, and an upsert aimed at an existing account also reset
// its commission_balance and overwrote its email and name.
//
// The fix keeps the service role but proves the caller has the right to that
// id, by either of two routes:
//
//   1. A live session whose user id matches — the ordinary case when email
//      confirmation is off.
//   2. Failing that: the auth user exists, its email matches the body, it was
//      created minutes ago, and its profile has not been set up yet. That is
//      true exactly once, for the person who just signed up.
//
// Route 2 is what makes an attack impractical: an existing configured account
// is refused outright, so there is nothing to escalate or overwrite.

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/** How recently the auth user must have been created to still count as "new". */
const NEW_ACCOUNT_WINDOW_MS = 30 * 60 * 1000;

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface VerifyResult {
  ok: boolean;
  /** Safe to log; never returned to the caller. */
  reason?: string;
}

export async function verifyNewAccount(userId: string, email: string): Promise<VerifyResult> {
  if (!userId || !email) return { ok: false, reason: "missing_fields" };

  // --- Route 1: a session that already proves who this is ---------------------
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === userId) return { ok: true };
    // A session belonging to someone *else* is a clear attempt to write another
    // user's row. Refuse rather than falling through to the new-account path.
    if (user && user.id !== userId) return { ok: false, reason: "session_user_mismatch" };
  } catch {
    // No session available — fall through. This is the email-confirmation case.
  }

  const service = svc();

  // --- Route 2a: the auth user must exist and be the same person -------------
  const { data: authUser, error } = await service.auth.admin.getUserById(userId);
  if (error || !authUser?.user) return { ok: false, reason: "auth_user_not_found" };

  const authEmail = (authUser.user.email || "").trim().toLowerCase();
  if (!authEmail || authEmail !== String(email).trim().toLowerCase()) {
    return { ok: false, reason: "email_mismatch" };
  }

  // --- Route 2b: and must have been created just now -------------------------
  const createdAt = authUser.user.created_at ? Date.parse(authUser.user.created_at) : NaN;
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > NEW_ACCOUNT_WINDOW_MS) {
    return { ok: false, reason: "account_not_new" };
  }

  // --- Route 2c: and must not already be set up ------------------------------
  // This is the check that stops escalation. Note what "set up" means: a
  // trigger on the users table already creates the profile row with
  // role='USER' the moment the auth user appears, so "has a role" would reject
  // every genuine signup. What marks an account as *configured* is a
  // privileged role or an issued invite code — neither of which exists yet for
  // someone who signed up seconds ago.
  const { data: profile } = await service
    .from("users")
    .select("role, tutor_invite_code")
    .eq("id", userId)
    .maybeSingle();

  const role = (profile?.role || "").toUpperCase();
  if (role && role !== "USER") return { ok: false, reason: `profile_configured_${role}` };
  if (profile?.tutor_invite_code) return { ok: false, reason: "profile_already_tutor" };

  return { ok: true };
}
