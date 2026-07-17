// POST /api/support/tickets/[id]/reply  { body, status? }
// An agent (admin/community manager) replies to a ticket and optionally changes
// its status. Notifies the requester in-app.

import { NextRequest, NextResponse } from "next/server";
import { getDashboardUser } from "@/lib/admin/access";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { notifyUser } from "@/lib/notifications/create";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const STATUSES = ["open", "pending", "resolved", "closed"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const agent = await getDashboardUser();
  if (!agent) return NextResponse.json({ error: "Not authorised" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const text = typeof body.body === "string" ? body.body.trim().slice(0, 5000) : "";
  const status = STATUSES.includes(body.status) ? body.status : null;

  const service = svc();
  const { data: ticket } = await service.from("support_tickets").select("id, user_id").eq("id", id).maybeSingle();
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  if (text) {
    await service.from("ticket_messages").insert({
      ticket_id: id, sender_id: agent.id, sender_role: "agent", body: text,
    });
    await service.from("support_tickets").update({
      last_message_at: new Date().toISOString(),
      assigned_to: agent.id,
      ...(status ? { status } : { status: "pending" }),
    }).eq("id", id);

    if (ticket.user_id) {
      await notifyUser({
        userId: ticket.user_id,
        type: "support_reply",
        title: "Support replied to you",
        body: text.length > 80 ? text.slice(0, 80) + "…" : text,
        url: "/notifications",
      });
    }
  } else if (status) {
    await service.from("support_tickets").update({ status, assigned_to: agent.id }).eq("id", id);
  } else {
    return NextResponse.json({ error: "Nothing to do" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
