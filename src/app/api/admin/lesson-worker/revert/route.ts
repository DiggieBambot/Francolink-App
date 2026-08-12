// POST — restore a lesson (or a whole run's worth of lessons) to the content
// they had before an AI edit. The logic lives in worker/revert.ts so it can be
// exercised outside the request cycle.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/lessons/worker/guard";
import { adminClient } from "@/lib/lessons/worker/process";
import { revertEdits } from "@/lib/lessons/worker/revert";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { revisionId, runId } = await request.json().catch(() => ({}));

  try {
    const result = await revertEdits(adminClient(), { revisionId, runId });
    if (result.reverted === 0) {
      return NextResponse.json({ error: "Nothing to revert." }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
