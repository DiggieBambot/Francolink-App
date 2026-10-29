// Admin actions for the front-facing website: approving tutor listings and
// curating testimonials, FAQs and the contact inbox.
//
// One route with an `action` discriminator — these are all small, related
// mutations on the same admin screen, and a route file per verb would be noise.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { revalidateTutorPages } from "@/lib/site/revalidate";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { notifyUser } from "@/lib/notifications/create";
import { sendTransactionalEmail, firstNameOf } from "@/lib/email/transactional";
import { emailShell, escapeHtml, APP_URL } from "@/lib/email/shell";
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
    action: z.literal("reply_application"),
    id: z.uuid(),
    message: z.string().trim().min(1).max(5000),
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

  // Replying isn't a website edit — it notifies a person, so it skips the
  // shared save/revalidate path below.
  if (input.action === "reply_application") {
    return replyToApplication(db, input.id, input.message);
  }

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

    case "set_application_status": {
      // "accepted" is not just a label: it has to create the tutor's account
      // and draft listing and tell them what to do, or they're left stranded.
      if (input.status === "accepted") {
        const { data: app } = await db
          .from("tutor_applications")
          .select("created_user_id")
          .eq("id", input.id)
          .maybeSingle();
        if (app && !app.created_user_id) {
          if (input.proposed_tier) {
            await db
              .from("tutor_applications")
              .update({ proposed_tier: input.proposed_tier })
              .eq("id", input.id);
          }
          const result = await acceptApplication(db, input.id);
          if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
          }
          return NextResponse.json({ ok: true, message: result.message });
        }
      }
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
    }

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

  // Everything this route edits — listings, testimonials, FAQs — is rendered
  // by the cached website pages, so drop their cached copies.
  const userId = "user_id" in input ? input.user_id : null;
  if (userId) {
    const { data } = await db
      .from("tutor_public_profiles")
      .select("slug")
      .eq("user_id", userId)
      .maybeSingle();
    revalidateTutorPages(data?.slug ?? null);
  } else {
    revalidateTutorPages(null);
  }

  return NextResponse.json({ ok: true });
}

/**
 * Send an admin's reply to a tutor applicant: an in-app notification (the bell)
 * when they have an account, and always an email. Applicants from the public
 * /teach form may have signed up later, so fall back to matching by email.
 */
async function replyToApplication(
  db: ReturnType<typeof serviceClient>,
  id: string,
  message: string
) {
  const { data: app } = await db
    .from("tutor_applications")
    .select("id, full_name, email, applicant_user_id, created_user_id")
    .eq("id", id)
    .maybeSingle();
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  let account: { id: string; role: string | null } | null = null;
  const knownId = app.applicant_user_id || app.created_user_id;
  if (knownId) {
    const { data } = await db.from("users").select("id, role").eq("id", knownId).maybeSingle();
    account = data;
  }
  if (!account && app.email) {
    const { data } = await db
      .from("users")
      .select("id, role")
      .ilike("email", app.email.trim())
      .limit(1)
      .maybeSingle();
    account = data;
  }

  const isTutor = ["TUTOR", "ADMIN"].includes((account?.role || "").toUpperCase());
  const path = account ? (isTutor ? "/tutor/apply" : "/notifications") : "/login";

  if (account) {
    await notifyUser({
      userId: account.id,
      type: "application_reply",
      title: "FrancoLink replied to your teaching application",
      body: message,
      url: path,
    });
  }

  const firstName = firstNameOf(app.full_name, app.email);
  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">We've replied to your FrancoLink teaching application:</p>
     <div style="margin:0 0 16px 0;padding:16px;border-left:4px solid #f97316;background:#fff7ed;border-radius:6px;font-size:15px;white-space:pre-line;">${escapeHtml(message)}</div>
     <p style="margin:0 0 16px 0;font-size:15px;color:#475569;">You can reply to this email to answer us directly.</p>`;
  const ctaHref = `${APP_URL}${path}`;
  await sendTransactionalEmail(
    app.email,
    "Re: your FrancoLink teaching application",
    emailShell({ firstName, bodyHtml, ctaHref, ctaText: account ? "Open FrancoLink" : "Sign in to FrancoLink" }),
    `Hi ${firstName},\n\nWe've replied to your FrancoLink teaching application:\n\n${message}\n\nReply to this email to answer us directly. ${ctaHref}`
  );

  // Moving a fresh application along once we've written to them.
  await db.from("tutor_applications").update({ status: "reviewing" }).eq("id", id).eq("status", "new");

  return NextResponse.json({ ok: true, notified: Boolean(account) });
}
