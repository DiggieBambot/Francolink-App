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
import { revalidateTutorPages } from "@/lib/site/revalidate";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { acceptApplication } from "@/lib/tutors/accept";

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
    const result = await acceptApplication(db, input.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, ...result });
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

  // Publishing decisions change what francolink.net should show, and those
  // pages are cached for an hour — without this an approval looks like it
  // silently failed until the cache happens to expire.
  await revalidateForUser(db, "user_id" in input ? input.user_id : null);

  return NextResponse.json({ ok: true });
}

/**
 * Refresh the public website for one tutor. Looked up by user_id because the
 * admin actions above address tutors by id, while the cache is keyed by slug.
 */
async function revalidateForUser(
  db: ReturnType<typeof serviceClient>,
  userId?: string | null
) {
  if (!userId) {
    revalidateTutorPages(null);
    return;
  }
  const { data } = await db
    .from("tutor_public_profiles")
    .select("slug")
    .eq("user_id", userId)
    .maybeSingle();
  revalidateTutorPages(data?.slug ?? null);
}
