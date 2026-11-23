// Admin: grant Premium by hand until a date (business pilots and seats).
//
// POST   { emails: string, endsAt: "YYYY-MM-DD", reason, organization? }
//        emails may be comma/newline separated; returns one outcome per email.
// DELETE { grantId } revokes a grant and downgrades the learner if nothing else
//        entitles them.
//
// See src/lib/billing/premium-grants.ts for the ownership rules.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { grantPremium, revokeGrant } from "@/lib/billing/premium-grants";

export const runtime = "nodejs";

const MAX_EMAILS = 200;

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const me = await getDashboardUser();
  if (!me || !isAdmin(me)) return null;
  return user;
}

const GrantBody = z.object({
  emails: z.string().min(3).max(20000),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().min(3).max(300),
  organization: z.string().trim().max(160).optional().default(""),
});

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = GrantBody.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Check the emails, end date and reason." }, { status: 400 });
  }

  const emails = Array.from(
    new Set(
      body.emails
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
    )
  );
  if (emails.length === 0) {
    return NextResponse.json({ error: "No valid email addresses found." }, { status: 400 });
  }
  if (emails.length > MAX_EMAILS) {
    return NextResponse.json({ error: `At most ${MAX_EMAILS} emails at a time.` }, { status: 400 });
  }

  // End of the chosen day, UTC, so "until 15 Dec" includes 15 Dec everywhere.
  const endsAt = new Date(`${body.endsAt}T23:59:59Z`);
  const maxEnd = new Date();
  maxEnd.setUTCFullYear(maxEnd.getUTCFullYear() + 2);
  if (!(endsAt.getTime() > Date.now()) || endsAt > maxEnd) {
    return NextResponse.json({ error: "End date must be in the future and within 2 years." }, { status: 400 });
  }

  const results = await grantPremium(svc(), {
    emails,
    endsAt,
    reason: body.reason,
    organization: body.organization || null,
    grantedBy: admin.id,
  });
  return NextResponse.json({ results });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = z.object({ grantId: z.uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Missing grantId" }, { status: 400 });

  const result = await revokeGrant(svc(), parsed.data.grantId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
