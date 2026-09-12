// GET  /api/reviews/prompt — should this user see the review card, and why?
// POST /api/reviews/prompt — record what they did with it.
//
// The decision lives entirely on the server. The client asks "do I render?" and
// renders; it never holds a threshold. That keeps the eligibility rule in one
// file when it inevitably gets tuned.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decidePrompt, markShown, recordAnswer, type PromptStatus } from "@/lib/reviews/eligibility";
import { logActivity } from "@/lib/analytics/activity";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ show: false }, { status: 401 });

  const decision = await decidePrompt(user.id);
  if (decision.show) await markShown(user.id);
  return NextResponse.json(decision);
}

const ACTIONS: Record<string, PromptStatus> = {
  positive: "positive",
  negative: "negative",
  snooze: "snoozed",
  dismiss: "declined",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { action?: string; feedback?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-body" }, { status: 400 });
  }

  const status = ACTIONS[body.action ?? ""];
  if (!status) return NextResponse.json({ ok: false, error: "unknown-action" }, { status: 400 });

  await recordAnswer(user.id, status, { feedback: body.feedback });
  await logActivity(user.id, "review_prompt_answered", { metadata: { status } });

  return NextResponse.json({ ok: true });
}
