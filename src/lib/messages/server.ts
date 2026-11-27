// Server side of 1:1 tutor <-> student messaging (/messages).
//
// Who may talk to whom comes from ACTIVE `tutor_students` rows — never from
// `users.referred_by_tutor_id`, which is the commission field. A user can be a
// tutor to some people and a student of others, so each pair is resolved in
// both directions.
//
// API routes authorize the caller here and then read/write with the service
// role; the RLS in 20261123_tutor_student_messages.sql guards everything else.

import { createServiceClient } from "@/lib/supabase/service";
import { notifyUser } from "@/lib/notifications/create";
import { notifyNewMessage } from "@/lib/email/transactional";

export const MESSAGE_MAX_LENGTH = 4000;

/** Thrown when the messaging tables don't exist yet (migration not run). */
export class MessagingNotSetUpError extends Error {
  constructor() {
    super("Messaging isn't set up yet: run supabase/migrations/20261123_tutor_student_messages.sql");
  }
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" || // postgres: undefined_table
    error.code === "PGRST205" || // PostgREST: table not in schema cache
    /relation .*(conversations|messages).* does not exist/i.test(error.message || "") ||
    /Could not find the table .*(conversations|messages)/i.test(error.message || "")
  );
}

function check(error: { code?: string; message?: string } | null) {
  if (isMissingTable(error)) throw new MessagingNotSetUpError();
  if (error) throw new Error(error.message);
}

export interface Pair {
  tutorId: string;
  studentId: string;
  /** Whether the tutor_students connection is currently active. */
  active: boolean;
}

export interface Person {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string;
}

interface ConversationRow {
  id: string;
  tutor_id: string;
  student_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_sender_id: string | null;
  tutor_last_read_at: string | null;
  student_last_read_at: string | null;
  tutor_emailed_at: string | null;
  student_emailed_at: string | null;
}

export interface ConversationSummary {
  otherUser: Pick<Person, "id" | "name" | "avatar_url">;
  /** How the other person relates to me: they are my tutor, or my student. */
  otherRole: "tutor" | "student";
  conversationId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastSenderIsMe: boolean;
  unread: number;
  active: boolean;
}

export interface ThreadMessage {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

/** The tutor/student pair between me and `otherId`, if they were ever connected. */
export async function resolvePair(meId: string, otherId: string): Promise<Pair | null> {
  if (!otherId || otherId === meId) return null;
  const { data } = await createServiceClient()
    .from("tutor_students")
    .select("tutor_id, student_id, status")
    .or(
      `and(tutor_id.eq.${meId},student_id.eq.${otherId}),and(tutor_id.eq.${otherId},student_id.eq.${meId})`
    );
  const rows = data || [];
  // Prefer an active link; if both directions exist and are active, the
  // caller-as-tutor direction wins so the pair is stable.
  const active = rows.filter((r) => r.status === "active");
  const pick =
    active.find((r) => r.tutor_id === meId) || active[0] || rows.find((r) => r.tutor_id === meId) || rows[0];
  if (!pick) return null;
  return { tutorId: pick.tutor_id, studentId: pick.student_id, active: pick.status === "active" };
}

function lastReadOf(c: ConversationRow, meId: string) {
  return c.tutor_id === meId ? c.tutor_last_read_at : c.student_last_read_at;
}

async function unreadCount(conversationId: string, meId: string, since: string | null) {
  let q = createServiceClient()
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", meId);
  if (since) q = q.gt("created_at", since);
  const { count, error } = await q;
  check(error);
  return count || 0;
}

/**
 * My conversations, newest first, followed by everyone I'm actively connected
 * to whom I haven't messaged yet (so a thread can be started from the list).
 */
export async function listConversations(meId: string): Promise<ConversationSummary[]> {
  const s = createServiceClient();

  const { data: convs, error } = await s
    .from("conversations")
    .select("*")
    .or(`tutor_id.eq.${meId},student_id.eq.${meId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  check(error);
  const conversations = (convs || []) as ConversationRow[];

  const { data: links } = await s
    .from("tutor_students")
    .select("tutor_id, student_id, status")
    .or(`tutor_id.eq.${meId},student_id.eq.${meId}`)
    .eq("status", "active");
  const activeLinks = (links || []).filter((l) => l.tutor_id !== l.student_id);
  const isActive = (tutorId: string, studentId: string) =>
    activeLinks.some((l) => l.tutor_id === tutorId && l.student_id === studentId);

  const otherIds = new Set<string>();
  conversations.forEach((c) => otherIds.add(c.tutor_id === meId ? c.student_id : c.tutor_id));
  activeLinks.forEach((l) => otherIds.add(l.tutor_id === meId ? l.student_id : l.tutor_id));
  if (otherIds.size === 0) return [];

  const { data: people } = await s
    .from("users")
    .select("id, name, avatar_url")
    .in("id", [...otherIds]);
  const byId = new Map((people || []).map((p) => [p.id, p]));

  const summaries: ConversationSummary[] = [];
  const seen = new Set<string>();

  const unreadCounts = await Promise.all(
    conversations.map((c) =>
      c.last_message_at && c.last_sender_id !== meId ? unreadCount(c.id, meId, lastReadOf(c, meId)) : 0
    )
  );

  conversations.forEach((c, i) => {
    const otherId = c.tutor_id === meId ? c.student_id : c.tutor_id;
    const other = byId.get(otherId);
    if (!other) return;
    seen.add(otherId);
    summaries.push({
      otherUser: other,
      otherRole: c.tutor_id === meId ? "student" : "tutor",
      conversationId: c.id,
      lastMessageAt: c.last_message_at,
      lastMessagePreview: c.last_message_preview,
      lastSenderIsMe: c.last_sender_id === meId,
      unread: unreadCounts[i],
      active: isActive(c.tutor_id, c.student_id),
    });
  });

  const fresh = activeLinks
    .map((l) => ({ l, otherId: l.tutor_id === meId ? l.student_id : l.tutor_id }))
    .filter(({ otherId }) => !seen.has(otherId) && byId.has(otherId));
  const freshSeen = new Set<string>();
  for (const { l, otherId } of fresh) {
    if (freshSeen.has(otherId)) continue;
    freshSeen.add(otherId);
    summaries.push({
      otherUser: byId.get(otherId)!,
      otherRole: l.tutor_id === meId ? "student" : "tutor",
      conversationId: null,
      lastMessageAt: null,
      lastMessagePreview: null,
      lastSenderIsMe: false,
      unread: 0,
      active: true,
    });
  }
  return summaries;
}

async function findConversation(pair: Pair): Promise<ConversationRow | null> {
  const { data, error } = await createServiceClient()
    .from("conversations")
    .select("*")
    .eq("tutor_id", pair.tutorId)
    .eq("student_id", pair.studentId)
    .maybeSingle();
  check(error);
  return (data as ConversationRow) || null;
}

async function getOrCreateConversation(pair: Pair): Promise<ConversationRow> {
  const existing = await findConversation(pair);
  if (existing) return existing;
  const { data, error } = await createServiceClient()
    .from("conversations")
    .insert({ tutor_id: pair.tutorId, student_id: pair.studentId })
    .select("*")
    .single();
  if (error?.code === "23505") {
    // Created concurrently by the other side.
    const again = await findConversation(pair);
    if (again) return again;
  }
  check(error);
  return data as ConversationRow;
}

export interface Thread {
  other: Pick<Person, "id" | "name" | "avatar_url">;
  otherRole: "tutor" | "student";
  active: boolean;
  conversationId: string | null;
  messages: ThreadMessage[];
  /**
   * When the other person last read this thread (opening it, or sending in
   * it), for "Seen" receipts on my messages. Null if they never have.
   */
  otherLastReadAt: string | null;
}

/** The thread between me and `otherId` (latest 200 messages), marking it read. */
export async function getThread(meId: string, otherId: string): Promise<Thread | null> {
  const pair = await resolvePair(meId, otherId);
  if (!pair) return null;
  const s = createServiceClient();
  const { data: other } = await s.from("users").select("id, name, avatar_url").eq("id", otherId).maybeSingle();
  if (!other) return null;

  const conv = await findConversation(pair);
  let messages: ThreadMessage[] = [];
  if (conv) {
    const { data, error } = await s
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(200);
    check(error);
    messages = ((data || []) as ThreadMessage[]).reverse();

    const col = pair.tutorId === meId ? "tutor_last_read_at" : "student_last_read_at";
    await s.from("conversations").update({ [col]: new Date().toISOString() }).eq("id", conv.id);
  }
  const otherLastReadAt = conv
    ? pair.tutorId === meId
      ? conv.student_last_read_at
      : conv.tutor_last_read_at
    : null;

  return {
    other,
    otherRole: pair.tutorId === meId ? "student" : "tutor",
    active: pair.active,
    conversationId: conv?.id ?? null,
    messages,
    otherLastReadAt,
  };
}

/** Total unread messages across all my conversations (for nav badges). */
export async function totalUnread(meId: string): Promise<number> {
  const { data, error } = await createServiceClient()
    .from("conversations")
    .select("*")
    .or(`tutor_id.eq.${meId},student_id.eq.${meId}`)
    .not("last_message_at", "is", null)
    .neq("last_sender_id", meId);
  if (isMissingTable(error)) return 0;
  check(error);
  const counts = await Promise.all(
    ((data || []) as ConversationRow[]).map((c) => unreadCount(c.id, meId, lastReadOf(c, meId)))
  );
  return counts.reduce((a, b) => a + b, 0);
}

export type SendResult =
  | { ok: true; message: ThreadMessage; conversationId: string }
  | { ok: false; status: number; error: string };

const EMAIL_THROTTLE_MS = 15 * 60 * 1000;
/** Someone who read the thread this recently is probably looking at it. */
const ACTIVE_READER_MS = 2 * 60 * 1000;

export async function sendMessage(meId: string, otherId: string, rawBody: string): Promise<SendResult> {
  const body = (rawBody || "").trim();
  if (!body) return { ok: false, status: 400, error: "Message is empty." };
  if (body.length > MESSAGE_MAX_LENGTH) {
    return { ok: false, status: 400, error: `Messages can be at most ${MESSAGE_MAX_LENGTH} characters.` };
  }

  const pair = await resolvePair(meId, otherId);
  if (!pair) return { ok: false, status: 403, error: "You can only message your own tutors and students." };
  if (!pair.active) {
    return { ok: false, status: 403, error: "You're no longer connected, so you can't send new messages." };
  }

  const s = createServiceClient();
  const conv = await getOrCreateConversation(pair);

  const { data: msg, error } = await s
    .from("messages")
    .insert({ conversation_id: conv.id, sender_id: meId, body })
    .select("id, sender_id, body, created_at")
    .single();
  check(error);

  const meIsTutor = pair.tutorId === meId;
  const now = new Date().toISOString();
  await s
    .from("conversations")
    .update({
      last_message_at: msg!.created_at,
      last_message_preview: body.slice(0, 140),
      last_sender_id: meId,
      // Sending a message means I've seen the thread up to now.
      [meIsTutor ? "tutor_last_read_at" : "student_last_read_at"]: now,
    })
    .eq("id", conv.id);

  await notifyRecipient(conv, meId, otherId, meIsTutor, body).catch((e) =>
    console.error("[messages] notify failed:", (e as Error).message)
  );

  return { ok: true, message: msg as ThreadMessage, conversationId: conv.id };
}

/**
 * Bell + push, and an email — both throttled so a burst of messages produces
 * one notification and one email, not one per message.
 */
async function notifyRecipient(
  conv: ConversationRow,
  meId: string,
  recipientId: string,
  meIsTutor: boolean,
  body: string
) {
  const s = createServiceClient();
  const { data: me } = await s.from("users").select("name").eq("id", meId).maybeSingle();
  const senderName = me?.name || (meIsTutor ? "Your tutor" : "A student");
  const url = `/messages?with=${meId}`;

  // In-app: skip if they still have an unread notification for this thread.
  const { data: pending } = await s
    .from("notifications")
    .select("id")
    .eq("user_id", recipientId)
    .eq("type", "message")
    .eq("url", url)
    .is("read_at", null)
    .limit(1);
  if (!pending?.length) {
    await notifyUser({
      userId: recipientId,
      type: "message",
      title: `New message from ${senderName}`,
      body: body.slice(0, 120),
      url,
    });
  }

  // Email: once per unread streak, at most every 15 minutes, and not while
  // they're actively reading the thread. The conditional update claims the
  // slot so two concurrent sends can't both email.
  const emailedCol = meIsTutor ? "student_emailed_at" : "tutor_emailed_at";
  const { data: fresh } = await s
    .from("conversations")
    .select("tutor_last_read_at, student_last_read_at, tutor_emailed_at, student_emailed_at")
    .eq("id", conv.id)
    .single();
  if (!fresh) return;
  const emailedAt: string | null = meIsTutor ? fresh.student_emailed_at : fresh.tutor_emailed_at;
  const lastRead: string | null = meIsTutor ? fresh.student_last_read_at : fresh.tutor_last_read_at;
  const nowMs = Date.now();
  const t = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);

  if (lastRead && nowMs - t(lastRead) < ACTIVE_READER_MS) return;
  if (emailedAt) {
    const readSinceEmail = t(lastRead) > t(emailedAt);
    if (!readSinceEmail || nowMs - t(emailedAt) < EMAIL_THROTTLE_MS) return;
  }

  let claim = s.from("conversations").update({ [emailedCol]: new Date(nowMs).toISOString() }).eq("id", conv.id);
  claim = emailedAt ? claim.eq(emailedCol, emailedAt) : claim.is(emailedCol, null);
  const { data: claimed } = await claim.select("id");
  if (!claimed?.length) return;

  await notifyNewMessage(recipientId, senderName, body, url);
}
