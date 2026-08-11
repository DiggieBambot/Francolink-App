// Admin actions for the front-facing website: approving tutor listings and
// curating testimonials, FAQs and the contact inbox.
//
// One route with an `action` discriminator — these are all small, related
// mutations on the same admin screen, and a route file per verb would be noise.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";

export const runtime = "nodejs";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const Action = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("review_profile"),
    user_id: z.uuid(),
    decision: z.enum(["approved", "rejected", "pending"]),
    reason: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal("reorder_profile"),
    user_id: z.uuid(),
    display_order: z.number().int().min(0).max(9999),
  }),
  z.object({
    action: z.literal("create_testimonial"),
    author_name: z.string().trim().min(1).max(120),
    author_role: z.string().trim().max(120).optional(),
    author_country: z.string().trim().max(80).optional(),
    author_photo: z.url().max(500).optional(),
    quote: z.string().trim().min(10).max(1200),
    rating: z.number().int().min(1).max(5).optional(),
    tutor_id: z.uuid().optional(),
    is_published: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("toggle_testimonial"),
    id: z.uuid(),
    is_published: z.boolean(),
  }),
  z.object({ action: z.literal("delete_testimonial"), id: z.uuid() }),
  z.object({
    action: z.literal("create_faq"),
    category: z.string().trim().min(1).max(80).default("General"),
    question: z.string().trim().min(5).max(300),
    answer: z.string().trim().min(5).max(4000),
    display_order: z.number().int().min(0).max(9999).default(0),
  }),
  z.object({ action: z.literal("toggle_faq"), id: z.uuid(), is_published: z.boolean() }),
  z.object({ action: z.literal("delete_faq"), id: z.uuid() }),
  z.object({
    action: z.literal("set_application_status"),
    id: z.uuid(),
    status: z.enum(["new", "reviewing", "interviewing", "accepted", "rejected", "spam"]),
    proposed_tier: z.enum(["community", "certified", "professional"]).optional(),
    review_notes: z.string().trim().max(2000).optional(),
  }),
  z.object({
    action: z.literal("set_message_status"),
    id: z.uuid(),
    status: z.enum(["new", "read", "replied", "spam"]),
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
  let error;

  switch (input.action) {
    case "review_profile":
      ({ error } = await db
        .from("tutor_public_profiles")
        .update({
          approval_status: input.decision,
          rejection_reason: input.decision === "rejected" ? (input.reason ?? null) : null,
        })
        .eq("user_id", input.user_id));
      break;

    case "reorder_profile":
      ({ error } = await db
        .from("tutor_public_profiles")
        .update({ display_order: input.display_order })
        .eq("user_id", input.user_id));
      break;

    case "create_testimonial": {
      const { action: _a, ...row } = input;
      ({ error } = await db.from("testimonials").insert(row));
      break;
    }

    case "toggle_testimonial":
      ({ error } = await db
        .from("testimonials")
        .update({ is_published: input.is_published })
        .eq("id", input.id));
      break;

    case "delete_testimonial":
      ({ error } = await db.from("testimonials").delete().eq("id", input.id));
      break;

    case "create_faq": {
      const { action: _a, ...row } = input;
      ({ error } = await db.from("site_faqs").insert(row));
      break;
    }

    case "toggle_faq":
      ({ error } = await db
        .from("site_faqs")
        .update({ is_published: input.is_published })
        .eq("id", input.id));
      break;

    case "delete_faq":
      ({ error } = await db.from("site_faqs").delete().eq("id", input.id));
      break;

    case "set_application_status":
      ({ error } = await db
        .from("tutor_applications")
        .update({
          status: input.status,
          ...(input.proposed_tier ? { proposed_tier: input.proposed_tier } : {}),
          ...(input.review_notes !== undefined
            ? { review_notes: input.review_notes }
            : {}),
        })
        .eq("id", input.id));
      break;

    case "set_message_status":
      ({ error } = await db
        .from("contact_messages")
        .update({ status: input.status })
        .eq("id", input.id));
      break;
  }

  if (error) {
    console.error(`[admin/website] ${input.action} failed`, error);
    return NextResponse.json({ error: "That didn't save." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
