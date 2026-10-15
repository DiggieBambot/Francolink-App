// POST /api/admin/affiliates/:id/payout { currency, method?, reference? }
//
// Records that the admin has paid a creator their payable balance by hand
// (PayPal, Wise...). No money moves here. Everything payable in that currency
// -- past its refund hold, not yet paid, reversals included -- is marked paid
// against one payout row.

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { createServiceClient } from "@/lib/supabase/service";

const Body = z.object({
  currency: z.string().trim().toLowerCase().length(3),
  method: z.string().trim().max(40).optional(),
  reference: z.string().trim().max(200).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getDashboardUser();
  if (!isAdmin(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { currency, method, reference } = parsed.data;

  const db = createServiceClient();
  const { data: rows, error } = await db
    .from("affiliate_commissions")
    .select("id, amount_cents")
    .eq("affiliate_id", id)
    .eq("currency", currency)
    .eq("status", "pending")
    .lte("available_at", new Date().toISOString());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = (rows ?? []).reduce((sum, r) => sum + r.amount_cents, 0);
  if (total <= 0) {
    return NextResponse.json({ error: "Nothing payable in that currency." }, { status: 400 });
  }

  const { data: payout, error: payoutError } = await db
    .from("affiliate_payouts")
    .insert({ affiliate_id: id, amount_cents: total, currency, method: method || null, reference: reference || null, created_by: me!.id })
    .select("id")
    .single();
  if (payoutError) return NextResponse.json({ error: payoutError.message }, { status: 500 });

  // `status = pending` again: if a second click raced this one, each row goes
  // to exactly one payout, and the amount is corrected to what this one got.
  const { data: claimed } = await db
    .from("affiliate_commissions")
    .update({ status: "paid", payout_id: payout.id })
    .in("id", (rows ?? []).map((r) => r.id))
    .eq("status", "pending")
    .select("amount_cents");

  const claimedTotal = (claimed ?? []).reduce((sum, r) => sum + r.amount_cents, 0);
  if (claimedTotal <= 0) {
    await db.from("affiliate_commissions").update({ status: "pending", payout_id: null }).eq("payout_id", payout.id);
    await db.from("affiliate_payouts").delete().eq("id", payout.id);
    return NextResponse.json({ error: "Already recorded by another request." }, { status: 409 });
  }
  if (claimedTotal !== total) {
    await db.from("affiliate_payouts").update({ amount_cents: claimedTotal }).eq("id", payout.id);
  }

  return NextResponse.json({ ok: true, amount_cents: claimedTotal });
}
