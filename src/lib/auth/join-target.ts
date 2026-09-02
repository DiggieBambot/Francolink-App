// Resolving "who am I joining?" from a URL token — one place, so every entry
// point agrees.
//
// Why this exists: a tutor's `tutor_invite_code` is a bearer credential. Anyone
// holding it can attach themselves to that tutor, and it never expires, so it
// only stays meaningful while it stays private. The public directory used to
// build its Book button as /join/<invite_code>, which put every tutor's code
// into a crawlable page reachable from our own sitemap — bots walked the
// sitemap, harvested the codes, and joined at will.
//
// So the two audiences now use two different tokens for the same journey:
//
//   - Public marketplace pages link by `slug`. Slugs are published on purpose
//     and carry no authority: holding one lets you *ask* to join, nothing more.
//   - Private invites you send keep using the invite code, which now never
//     leaves the server.
//
// Both land here. Callers pass whatever was in the URL and get a tutor back —
// they never accept a tutor id from the client, because a client-supplied id
// is exactly how the old student-setup route could be pointed at any tutor.

import { createClient } from "@supabase/supabase-js";

export interface JoinTarget {
  tutorId: string;
  name: string | null;
  avatarUrl: string | null;
  email: string | null;
  tutorPlan: string | null;
  /** How the token resolved. 'invite' means a private link we issued. */
  via: "invite" | "directory";
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const USER_FIELDS = "id, name, avatar_url, email, tutor_plan";

/**
 * Resolve a join token to a tutor, or null if it matches nothing.
 *
 * Tries the invite code first: it's the narrower, higher-trust match, and a
 * code that also happened to look like a slug should behave as the invite.
 */
export async function resolveJoinTarget(rawToken: string): Promise<JoinTarget | null> {
  const token = String(rawToken || "").trim();
  if (!token) return null;

  const admin = serviceClient();

  // Invite codes are stored in mixed case (uppercase from auth/callback,
  // lowercase from the settings regenerator), so match case-insensitively.
  // Escape LIKE wildcards first — some codes contain '_', which ilike would
  // otherwise treat as "any character", turning one code into a pattern that
  // matches many.
  const codePattern = token.replace(/[\\%_]/g, "\\$&");
  const { data: byCode } = await admin
    .from("users")
    .select(USER_FIELDS)
    .ilike("tutor_invite_code", codePattern)
    .maybeSingle();

  if (byCode) return shape(byCode, "invite");

  // Otherwise treat it as a public directory slug. Only listed profiles
  // resolve, so an unlisted or withdrawn tutor can't be joined this way.
  const { data: profile } = await admin
    .from("tutor_public_profiles")
    .select("user_id")
    .eq("slug", token.toLowerCase())
    .maybeSingle();

  if (!profile?.user_id) return null;

  const { data: bySlug } = await admin
    .from("users")
    .select(USER_FIELDS)
    .eq("id", profile.user_id)
    .maybeSingle();

  return bySlug ? shape(bySlug, "directory") : null;
}

function shape(row: Record<string, unknown>, via: JoinTarget["via"]): JoinTarget {
  return {
    tutorId: row.id as string,
    name: (row.name as string) ?? null,
    avatarUrl: (row.avatar_url as string) ?? null,
    email: (row.email as string) ?? null,
    tutorPlan: (row.tutor_plan as string) ?? null,
    via,
  };
}
