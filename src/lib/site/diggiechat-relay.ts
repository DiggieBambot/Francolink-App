// Server-side bridge between website contact messages and DiggieChat.
//
// A contact message opens a DiggieChat conversation (so it shows up in the
// DiggieChat inbox with the sender's name and email), the bot answers it, and
// the answer goes back to the sender by email and — when they have an account —
// the notification bell. When the team takes over from the DiggieChat inbox,
// their replies arrive at /api/webhooks/diggiechat and go out the same way.

import { createClient } from "@supabase/supabase-js";
import { DIGGIECHAT_BASE_URL, DIGGIECHAT_SITE_ID } from "@/lib/diggie-chat";
import { notifyUser } from "@/lib/notifications/create";
import { sendTransactionalEmail, firstNameOf } from "@/lib/email/transactional";
import { emailShell, escapeHtml, APP_URL } from "@/lib/email/shell";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface ContactForRelay {
  id: string;
  name: string;
  email: string;
  topic: string | null;
  message: string;
}

async function post<T>(path: string, body: unknown, timeoutMs: number): Promise<T> {
  const res = await fetch(`${DIGGIECHAT_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<T>;
}

/**
 * Open a DiggieChat conversation for a contact message and send the bot's
 * answer to the sender. Never throws — the message is already saved and the
 * team has its email copy, so a DiggieChat outage only costs the auto-answer.
 */
export async function relayContactToDiggieChat(contact: ContactForRelay): Promise<void> {
  if (!DIGGIECHAT_SITE_ID) return;
  const siteId = DIGGIECHAT_SITE_ID;

  try {
    const { conversationId } = await post<{ conversationId: string }>(
      "/api/chat/start",
      {
        siteId,
        visitorId: `contact-${contact.id}`,
        visitorName: contact.name,
        visitorEmail: contact.email,
        landingPage: "francolink.net/contact",
        utmSource: "contact-form",
      },
      10_000
    );

    await svc()
      .from("contact_messages")
      .update({ diggiechat_conversation_id: conversationId })
      .eq("id", contact.id);

    const question = contact.topic ? `[${contact.topic}] ${contact.message}` : contact.message;
    const { reply } = await post<{ reply: string; humanTakeover: boolean }>(
      "/api/chat/message",
      { siteId, conversationId, message: question, visitorId: `contact-${contact.id}` },
      35_000
    );

    if (reply?.trim()) await deliverContactReply(contact, reply.trim(), "assistant");
  } catch (e) {
    console.error("[diggiechat-relay] relay failed:", (e as Error).message);
  }
}

/**
 * Email a reply to a contact-form sender and, if an account matches their
 * email, add it to their notifications. `from` picks the sign-off: the bot is
 * labelled as the assistant so nobody mistakes it for a person.
 */
export async function deliverContactReply(
  contact: Pick<ContactForRelay, "id" | "name" | "email" | "message">,
  reply: string,
  from: "assistant" | "team"
): Promise<void> {
  const db = svc();
  const { data: account } = await db
    .from("users")
    .select("id")
    .ilike("email", contact.email.trim())
    .limit(1)
    .maybeSingle();

  const who = from === "assistant" ? "The FrancoLink assistant" : "The FrancoLink team";
  if (account) {
    await notifyUser({
      userId: account.id,
      type: "contact_reply",
      title: `${who} replied to your message`,
      body: reply,
      url: "/notifications",
    });
  }

  const firstName = firstNameOf(contact.name, contact.email);
  const quoted = contact.message.length > 300 ? `${contact.message.slice(0, 300)}…` : contact.message;
  const note =
    from === "assistant"
      ? "This answer came from our automated assistant. If it didn't help, just reply to this email and a person on our team will pick it up."
      : "You can reply to this email to answer us directly.";
  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;">${escapeHtml(who)} replied to your message:</p>
     <div style="margin:0 0 16px 0;padding:16px;border-left:4px solid #f97316;background:#fff7ed;border-radius:6px;font-size:15px;white-space:pre-line;">${escapeHtml(reply)}</div>
     <p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">You wrote: “${escapeHtml(quoted)}”</p>
     <p style="margin:16px 0 0 0;font-size:14px;color:#475569;">${escapeHtml(note)}</p>`;
  const ctaHref = account ? `${APP_URL}/notifications` : `${APP_URL}/signup`;

  await sendTransactionalEmail(
    contact.email,
    "Re: your message to FrancoLink",
    emailShell({ firstName, bodyHtml, ctaHref, ctaText: account ? "Open FrancoLink" : "Try FrancoLink free" }),
    `Hi ${firstName},\n\n${who} replied to your message:\n\n${reply}\n\nYou wrote: "${quoted}"\n\n${note}`
  );

  await db.from("contact_messages").update({ status: "replied" }).eq("id", contact.id);
}
