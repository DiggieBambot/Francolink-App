// GET  /api/reviews/store — should the app request the store's review sheet now?
// POST /api/reviews/store — the app just requested it.
//
// Called by the mobile app (bearer token) after a finished lesson. Eligibility
// is shared with the web Trustpilot card; see src/lib/reviews/eligibility.ts.

import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/supabase/request-auth";
import { decideStoreReview, markStoreReviewRequested } from "@/lib/reviews/eligibility";
import { logActivity } from "@/lib/analytics/activity";

export async function GET(req: NextRequest) {
  const { user } = await getRequestAuth(req);
  if (!user) return NextResponse.json({ show: false }, { status: 401 });
  return NextResponse.json({ show: await decideStoreReview(user.id) });
}

export async function POST(req: NextRequest) {
  const { user } = await getRequestAuth(req);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await markStoreReviewRequested(user.id);
  await logActivity(user.id, "store_review_requested");
  return NextResponse.json({ ok: true });
}
