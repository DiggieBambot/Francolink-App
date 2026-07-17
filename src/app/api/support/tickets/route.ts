// POST /api/support/tickets  { subject, message, source? }
// Create a support ticket. Used by in-app "Contact support" today; the same
// shape (with a `source`) will back the Digistack embed and live-map handoff.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const ALLOWED_SOURCES = ["dashboard", "digistack", "live_map", "email", "in_app"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to contact support" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 200) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 5000) : "";
  const source = ALLOWED_SOURCES.includes(body.source) ? body.source : "in_app";
  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const service = svc();
  const { data: me } = await service.from("users").select("name, email").eq("id", user.id).maybeSingle();

  const { data: ticket, error } = await service
    .from("support_tickets")
    .insert({
      user_id: user.id,
      requester_name: me?.name || null,
      requester_email: me?.email || null,
      subject,
      source,
      status: "open",
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !ticket) return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });

  await service.from("ticket_messages").insert({
    ticket_id: ticket.id,
    sender_id: user.id,
    sender_role: "requester",
    body: message,
  });

  return NextResponse.json({ ok: true, ticketId: ticket.id });
}
