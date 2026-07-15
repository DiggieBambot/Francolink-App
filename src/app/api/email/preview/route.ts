// GET /api/email/preview?type=welcome-tutor|welcome-student|new-student|confirmed
// Renders a transactional email as HTML in the browser. No send, no auth, no DB
// — sample data only. Handy for eyeballing copy/layout before a campaign.

import { NextRequest, NextResponse } from "next/server";
import { renderWelcome, renderNewStudent, renderConfirmed, renderClassRequest } from "@/lib/email/transactional";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const type = new URL(req.url).searchParams.get("type") || "welcome-student";
  let out;
  switch (type) {
    case "welcome-tutor": out = renderWelcome("Marie", true); break;
    case "welcome-student": out = renderWelcome("Alex", false); break;
    case "new-student": out = renderNewStudent("Marie", "Alex Dupont"); break;
    case "confirmed": out = renderConfirmed("Alex", "Tutor Marie"); break;
    case "class-request": out = renderClassRequest("Marie", "Alex Dupont", "I'd like to practise ordering at a restaurant.", "weekday evenings"); break;
    default:
      return NextResponse.json(
        { error: "type must be welcome-tutor | welcome-student | new-student | confirmed" },
        { status: 400 }
      );
  }
  return new NextResponse(out.html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
