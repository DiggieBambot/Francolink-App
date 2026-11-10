// PATCH /api/admin/reviews/[id]  { action: "approve" | "reject" }
//
// An admin's decision on a lesson review. Approving flips `is_published`, which
// is what the tutor profile and the public read policy look at.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { createServiceClient } from "@/lib/supabase/service";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getDashboardUser();
  if (!isAdmin(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const { action } = await req.json().catch(() => ({}));
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const approve = action === "approve";
  const { error } = await createServiceClient()
    .from("lesson_reviews")
    .update({
      is_published: approve,
      review_status: approve ? "approved" : "rejected",
      moderated_at: new Date().toISOString(),
      moderated_by: me!.id,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Tutor profiles are cached for an hour; an approval should show now.
  revalidatePath("/site/tutors/[slug]", "page");

  return NextResponse.json({ ok: true });
}
