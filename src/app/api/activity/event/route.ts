// POST /api/activity/event — generic client-side analytics emitter.
// Body: { kind: ActivityKind, metadata?: object }
// Any feature (onboarding, placement, games, a future homework module) can call
// this to record a funnel/retention event for the signed-in user. Only kinds in
// CLIENT_EMITTABLE_KINDS are accepted; server-internal kinds (active/login/…) are
// rejected so the browser can't forge them.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logActivity, CLIENT_EMITTABLE_KINDS, type ActivityKind } from "@/lib/analytics/activity";
import { metaContextFromRequest, sendMetaEvent } from "@/lib/meta/capi";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { kind?: string; metadata?: Record<string, unknown> } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });
  }

  const kind = body.kind as ActivityKind;
  if (!kind || !CLIENT_EMITTABLE_KINDS.includes(kind)) {
    return NextResponse.json({ ok: false, error: "unknown-kind" }, { status: 400 });
  }

  const metadata =
    body.metadata && typeof body.metadata === "object" ? body.metadata : undefined;

  await logActivity(user.id, kind, { path: req.nextUrl.pathname, metadata });

  // The server copy of the pixel's CompleteRegistration (same event id).
  const metaEventId = metadata?.meta_event_id;
  if (kind === "signup_completed" && typeof metaEventId === "string" && metaEventId.length <= 120) {
    await sendMetaEvent({
      name: "CompleteRegistration",
      eventId: metaEventId,
      email: user.email,
      externalId: user.id,
      browser: metaContextFromRequest(req),
      sourceUrl: req.headers.get("referer") || undefined,
    });
  }
  return NextResponse.json({ ok: true });
}
