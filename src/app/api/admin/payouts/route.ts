// Admin manual-payouts API.
// GET  → tutors with a payable balance, their saved payout details, and total paid.
// POST → { tutorId } marks the tutor's current balance as paid: records a
//        commission_payouts row and resets users.commission_balance to 0.
//
// Manual payouts for now — no money actually moves here; this is the bookkeeping
// an admin does after paying out-of-band via the tutor's chosen method.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";

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
  for (const p of payouts || []) {
    if (p.status === "completed") paidBy.set(p.tutor_id, (paidBy.get(p.tutor_id) || 0) + Number(p.amount || 0));
  }

  const rows = (tutors || []).map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    balance: Number(t.commission_balance || 0),
    totalPaid: paidBy.get(t.id) || 0,
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
  const amount = Number(tutor?.commission_balance || 0);
  if (amount <= 0) return NextResponse.json({ error: "Nothing to pay — balance is zero." }, { status: 400 });

  const now = new Date().toISOString();
  const details = tutor?.payout_details as Record<string, unknown> | null;
  const rawMethod = (details?.method as string) || "bank";
  const note = `Manual payout via ${methodLabel(details)}`;
  const base = {
    tutor_id: tutorId,
    amount,
    currency: "USD",
    status: "completed",
    notes: note,
    requested_at: now,
    processed_at: now,
    completed_at: now,
  };

  // payout_method may be a constrained enum ('stripe'|'paypal'|'bank_transfer').
  // Try the real method; if the column rejects it, fall back to bank_transfer.
  let insErr = (await s.from("commission_payouts").insert({ ...base, payout_method: rawMethod })).error;
  if (insErr) {
    insErr = (await s.from("commission_payouts").insert({ ...base, payout_method: "bank_transfer" })).error;
  }
  if (insErr) return NextResponse.json({ error: `Couldn't record payout: ${insErr.message}` }, { status: 500 });

  const { error: balErr } = await s.from("users").update({ commission_balance: 0 }).eq("id", tutorId);
  if (balErr) return NextResponse.json({ error: `Payout recorded but balance not cleared: ${balErr.message}` }, { status: 500 });

  return NextResponse.json({ ok: true, amount });
}
