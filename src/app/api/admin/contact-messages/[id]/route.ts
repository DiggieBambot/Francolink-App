// POST /api/admin/contact-messages/[id]
//   { action: "reply", message }  — email the sender (+ notification bell when
//                                   an account matches) and mark it replied
//   { action: "status", status }  — new / read / spam
// Admins and community managers, same as the ticket inbox.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getDashboardUser } from "@/lib/admin/access";
import { deliverContactReply } from "@/lib/site/diggiechat-relay";

export const runtime = "nodejs";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reply"), message: z.string().trim().min(1).max(5000) }),
  z.object({ action: z.literal("status"), status: z.enum(["new", "read", "spam"]) }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getDashboardUser();
  if (!staff) return NextResponse.json({ error: "Not authorised" }, { status: 403 });

  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { id } = await params;
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: contact } = await db
    .from("contact_messages")
    .select("id, name, email, message")
    .eq("id", id)
    .maybeSingle();
  if (!contact) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  if (input.action === "status") {
    const { error } = await db.from("contact_messages").update({ status: input.status }).eq("id", id);
    if (error) return NextResponse.json({ error: "That didn't save." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Emails, notifies and sets status = replied.
  await deliverContactReply(contact, input.message, "team");

  // Separate so a not-yet-run migration can't fail a reply that already went out.
  const { error } = await db
    .from("contact_messages")
    .update({ last_reply: input.message, replied_at: new Date().toISOString(), replied_by: staff.id })
    .eq("id", id);
  if (error) console.error("[contact-messages] reply not recorded:", error.message);

  return NextResponse.json({ ok: true });
}
