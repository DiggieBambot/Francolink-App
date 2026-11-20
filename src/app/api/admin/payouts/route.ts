// Admin manual-payouts API.
// GET  → tutors with a payable balance, any withdrawal they've requested, their
//        saved payout details, and total paid.
// POST → { tutorId } records that the admin has paid them: the requested
//        amount if they asked for one, otherwise their whole balance. The
//        request row (or a new one) becomes 'completed' and the amount comes
//        off users.commission_balance.
//
// Manual payouts for now — no money actually moves here; this is the bookkeeping
// an admin does after paying out-of-band via the tutor's chosen method.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { adjustTutorBalance } from "@/lib/credits/referral";

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

function methodLabel(d: Record<string, unknown> | null): string {
  const m = (d?.method as string) || "";
  if (m === "paypal") return `PayPal (${d?.paypal_email || "?"})`;
  if (m === "skrill") return `Skrill (${d?.skrill_email || "?"})`;
  if (m === "bank") {
    const b = (d?.bank as Record<string, string>) || {};
    return `Bank — ${b.account_name || "?"}, ${b.account_number || "?"}${b.bank_name ? `, ${b.bank_name}` : ""}`;
  }
  if (m === "mobile_money") {
    const mm = (d?.mobile_money as Record<string, string>) || {};
    return `Mobile Money — ${mm.country || "?"} ${mm.number || "?"}${mm.provider ? ` (${mm.provider})` : ""}`;
  }
  return "No payout method set";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const s = svc();

  const { data: tutors, error } = await s
    .from("users")
    .select("id, name, email, commission_balance, payout_details, tutor_plan")
    .gt("commission_balance", 0)
    .order("commission_balance", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Total already paid, per tutor.
  const { data: payouts } = await s
    .from("commission_payouts")
    .select("tutor_id, amount, status");
  const paidBy = new Map<string, number>();
  const requestedBy = new Map<string, number>();
  for (const p of payouts || []) {
    if (p.status === "completed") paidBy.set(p.tutor_id, (paidBy.get(p.tutor_id) || 0) + Number(p.amount || 0));
    if (p.status === "requested") requestedBy.set(p.tutor_id, Number(p.amount || 0));
  }

  const rows = (tutors || []).map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    balance: Number(t.commission_balance || 0),
    totalPaid: paidBy.get(t.id) || 0,
    requested: requestedBy.get(t.id) ?? null,
    payoutMethod: (t.payout_details as { method?: string } | null)?.method || null,
    payoutSummary: methodLabel(t.payout_details as Record<string, unknown> | null),
    hasDetails: !!(t.payout_details as { method?: string } | null)?.method,
  }));

  return NextResponse.json({ tutors: rows });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { tutorId } = await req.json().catch(() => ({}));
  if (!tutorId) return NextResponse.json({ error: "tutorId is required" }, { status: 400 });

  const s = svc();
  const { data: tutor } = await s
    .from("users")
    .select("commission_balance, payout_details")
    .eq("id", tutorId)
    .maybeSingle();
  const balance = Number(tutor?.commission_balance || 0);
  if (balance <= 0) return NextResponse.json({ error: "Nothing to pay — balance is zero." }, { status: 400 });

  const { data: request } = await s
    .from("commission_payouts")
    .select("id, amount")
    .eq("tutor_id", tutorId)
    .eq("status", "requested")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const amount = Math.min(request ? Number(request.amount) : balance, balance);

  const now = new Date().toISOString();
  const details = tutor?.payout_details as Record<string, unknown> | null;
  const rawMethod = (details?.method as string) || "bank";
  const reference = `Manual payout via ${methodLabel(details)}`;

  // commission_payouts has: tutor_id, amount, ledger_ids, payout_method,
  // payout_reference, status, processed_at, created_at. This used to send
  // currency/notes/requested_at/completed_at as well — columns that don't
  // exist — so both inserts failed and no payout could ever be recorded.
  let recordErr;
  if (request) {
    ({ error: recordErr } = await s
      .from("commission_payouts")
      .update({ amount, status: "completed", processed_at: now, payout_reference: reference })
      .eq("id", request.id)
      .eq("status", "requested"));
  } else {
    const base = { tutor_id: tutorId, amount, status: "completed", payout_reference: reference, processed_at: now };
    // payout_method may be a constrained enum ('stripe'|'paypal'|'bank_transfer').
    // Try the real method; if the column rejects it, fall back to bank_transfer.
    ({ error: recordErr } = await s.from("commission_payouts").insert({ ...base, payout_method: rawMethod }));
    if (recordErr) {
      ({ error: recordErr } = await s.from("commission_payouts").insert({ ...base, payout_method: "bank_transfer" }));
    }
  }
  if (recordErr) return NextResponse.json({ error: `Couldn't record payout: ${recordErr.message}` }, { status: 500 });

  // Subtract what was paid rather than resetting to 0: commission that landed
  // after the admin loaded this page is still owed.
  await adjustTutorBalance(tutorId, -amount);

  return NextResponse.json({ ok: true, amount });
}
