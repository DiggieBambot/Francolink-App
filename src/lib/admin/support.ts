// Server-only support-ticket queries (service role). Used by the admin/CM inbox.

import { createClient } from "@supabase/supabase-js";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface TicketRow {
  id: string;
  subject: string;
  status: string;
  priority: string;
  source: string;
  requesterName: string | null;
  requesterEmail: string | null;
  lastMessageAt: string;
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  senderRole: string;
  senderName: string | null;
  body: string;
  createdAt: string;
}

export async function listTickets(status?: string): Promise<TicketRow[]> {
  const s = svc();
  let q = s
    .from("support_tickets")
    .select("id, subject, status, priority, source, requester_name, requester_email, user_id, last_message_at, created_at")
    .order("last_message_at", { ascending: false })
    .limit(200);
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error || !data) return [];

  // Resolve requester names for logged-in requesters.
  const userIds = [...new Set(data.map((t) => t.user_id).filter(Boolean))] as string[];
  const nameById = new Map<string, { name: string | null; email: string }>();
  if (userIds.length) {
    const { data: us } = await s.from("users").select("id, name, email").in("id", userIds);
    (us || []).forEach((u) => nameById.set(u.id, { name: u.name, email: u.email }));
  }

  return data.map((t) => {
    const u = t.user_id ? nameById.get(t.user_id) : null;
    return {
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      source: t.source,
      requesterName: u?.name ?? t.requester_name ?? null,
      requesterEmail: u?.email ?? t.requester_email ?? null,
      lastMessageAt: t.last_message_at,
      createdAt: t.created_at,
    };
  });
}

export async function getTicket(id: string): Promise<{ ticket: TicketRow; messages: TicketMessage[] } | null> {
  const s = svc();
  const { data: t } = await s
    .from("support_tickets")
    .select("id, subject, status, priority, source, requester_name, requester_email, user_id, last_message_at, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!t) return null;

  const { data: msgs } = await s
    .from("ticket_messages")
    .select("id, sender_id, sender_role, body, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  const senderIds = [...new Set((msgs || []).map((m) => m.sender_id).filter(Boolean))] as string[];
  const nameById = new Map<string, string | null>();
  if (senderIds.length) {
    const { data: us } = await s.from("users").select("id, name").in("id", senderIds);
    (us || []).forEach((u) => nameById.set(u.id, u.name));
  }

  let requesterName = t.requester_name ?? null;
  let requesterEmail = t.requester_email ?? null;
  if (t.user_id) {
    const { data: ru } = await s.from("users").select("name, email").eq("id", t.user_id).maybeSingle();
    requesterName = ru?.name ?? requesterName;
    requesterEmail = ru?.email ?? requesterEmail;
  }

  return {
    ticket: {
      id: t.id, subject: t.subject, status: t.status, priority: t.priority, source: t.source,
      requesterName, requesterEmail, lastMessageAt: t.last_message_at, createdAt: t.created_at,
    },
    messages: (msgs || []).map((m) => ({
      id: m.id,
      senderRole: m.sender_role,
      senderName: m.sender_id ? nameById.get(m.sender_id) ?? null : requesterName,
      body: m.body,
      createdAt: m.created_at,
    })),
  };
}

export async function ticketCounts(): Promise<Record<string, number>> {
  const s = svc();
  const { data } = await s.from("support_tickets").select("status");
  const c: Record<string, number> = { all: 0, open: 0, pending: 0, resolved: 0, closed: 0 };
  for (const r of data || []) { c.all++; c[r.status] = (c[r.status] || 0) + 1; }
  return c;
}
