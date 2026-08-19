// Mints the short-lived token every public form must send back.
// See src/lib/site/form-token.ts for why this exists.

import { NextResponse } from "next/server";
import { issueFormToken } from "@/lib/site/form-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { token: issueFormToken() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
