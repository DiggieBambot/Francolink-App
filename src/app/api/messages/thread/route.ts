// GET  /api/messages/thread?with=<userId>   — the thread with that person (marks it read)
// POST /api/messages/thread { to, body }    — send them a message
//
// Only between a tutor and a student with a tutor_students connection; new
// messages need the connection to be active.

import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { getThread, sendMessage, MessagingNotSetUpError } from "@/lib/messages/server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function setupRequired() {
  return NextResponse.json({ setupRequired: true, error: "Messaging isn't set up yet." }, { status: 503 });
}

export async function GET(req: Request) {
  const { user } = await getRequestAuth(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const otherId = new URL(req.url).searchParams.get("with") || "";
  if (!UUID.test(otherId)) return NextResponse.json({ error: "Unknown person" }, { status: 400 });
  try {
    const thread = await getThread(user.id, otherId);
    if (!thread) return NextResponse.json({ error: "You can only message your own tutors and students." }, { status: 404 });
    return NextResponse.json({ me: user.id, ...thread });
  } catch (e) {
    if (e instanceof MessagingNotSetUpError) return setupRequired();
    console.error("[messages] thread failed:", (e as Error).message);
    return NextResponse.json({ error: "Couldn't load this conversation." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { user } = await getRequestAuth(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const to = typeof body.to === "string" ? body.to : "";
  const text = typeof body.body === "string" ? body.body : "";
  if (!UUID.test(to)) return NextResponse.json({ error: "Unknown person" }, { status: 400 });
  try {
    const result = await sendMessage(user.id, to, text);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof MessagingNotSetUpError) return setupRequired();
    console.error("[messages] send failed:", (e as Error).message);
    return NextResponse.json({ error: "Couldn't send your message." }, { status: 500 });
  }
}
