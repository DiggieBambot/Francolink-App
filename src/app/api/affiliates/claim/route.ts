// POST /api/affiliates/claim { code } — "a creator sent me": attribute the
// signed-in customer to a creator by typing their code.
//
// For people who never clicked the creator's link, chiefly mobile app users
// (Play purchases have no promotion code we can read). Callable from the web
// (cookies) or the app (Bearer token). Only works before the customer's first
// payment; see attributeUser.

import { NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { attributeUser } from "@/lib/affiliates";

const MESSAGES: Record<string, string> = {
  unknown_code: "That creator code doesn't exist.",
  paused: "That creator code isn't active right now.",
  already_attributed: "Your account is already linked to a creator.",
  self_referral: "You can't use your own creator code.",
  existing_customer: "Creator codes are for new subscribers only.",
  tutor_student: "Your account is already linked to a tutor.",
  no_user: "Account not found.",
};

export async function POST(request: Request) {
  const { user } = await getRequestAuth(request);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code : "";

  const result = await attributeUser(user.id, code, "claim");
  if (!result.ok) {
    return NextResponse.json({ error: MESSAGES[result.reason], reason: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true, creator: result.affiliate.name });
}
