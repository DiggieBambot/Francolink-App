// POST /api/webhooks/diggiechat — DiggieChat calls this when someone on the
// team replies from the DiggieChat inbox. For conversations that started as a
// website contact message, forward the reply by email + notification bell.
//
// Verified with HMAC-SHA256 of the raw body (X-DiggieChat-Signature) using
// DIGGIECHAT_WEBHOOK_SECRET, the same value saved on the DiggieChat site.

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { deliverContactReply } from "@/lib/site/diggiechat-relay";

export const runtime = "nodejs";

interface OwnerReplyEvent {
  event: "owner_reply";
  siteId: string;
  conversationId: string;
  message: { id: string; content: string; createdAt: string | null };
}

function validSignature(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = createHmac("sha256", secret).update(raw).digest();
  let given: Buffer;
  try {
    given = Buffer.from(header, "hex");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  const secret = process.env.DIGGIECHAT_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhooks/diggiechat] DIGGIECHAT_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-diggiechat-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  let event: OwnerReplyEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  if (event.event !== "owner_reply" || !event.conversationId || !event.message?.content?.trim()) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: contact } = await db
    .from("contact_messages")
    .select("id, name, email, message")
    .eq("diggiechat_conversation_id", event.conversationId)
    .maybeSingle();

  // A chat that started in the widget: the visitor gets the reply live there.
  if (!contact) return NextResponse.json({ ok: true, ignored: true });

  await deliverContactReply(contact, event.message.content.trim(), "team");
  return NextResponse.json({ ok: true });
}
