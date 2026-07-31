// GET/POST the signed-in tutor's payout destination (manual payouts for now).
// Stored in users.payout_details (jsonb). Resilient if the column hasn't been
// migrated yet: GET returns empty, POST returns a clear "not migrated" message.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const METHODS = ["paypal", "skrill", "bank", "mobile_money"] as const;
type Method = (typeof METHODS)[number];

function isMissingColumn(msg?: string): boolean {
  return !!msg && /payout_details/.test(msg) && /column|does not exist|schema cache/i.test(msg);
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await svc()
    .from("users")
    .select("payout_details")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    if (isMissingColumn(error.message)) return NextResponse.json({ details: null, unavailable: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ details: data?.payout_details ?? null });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const method = body?.method as Method;
  if (!METHODS.includes(method)) {
    return NextResponse.json({ error: "Choose a valid payout method." }, { status: 400 });
  }

  // Keep only the fields relevant to the chosen method; trim strings.
  const t = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const details: Record<string, unknown> = { method, updated_at: new Date().toISOString() };

  if (method === "paypal") {
    if (!t(body.paypal_email)) return NextResponse.json({ error: "PayPal email is required." }, { status: 400 });
    details.paypal_email = t(body.paypal_email);
  } else if (method === "skrill") {
    if (!t(body.skrill_email)) return NextResponse.json({ error: "Skrill email is required." }, { status: 400 });
    details.skrill_email = t(body.skrill_email);
  } else if (method === "bank") {
    const bank = body.bank || {};
    if (!t(bank.account_name) || !t(bank.account_number)) {
      return NextResponse.json({ error: "Account name and number are required." }, { status: 400 });
    }
    details.bank = {
      account_name: t(bank.account_name),
      account_number: t(bank.account_number),
      bank_name: t(bank.bank_name),
      swift_iban: t(bank.swift_iban),
      country: t(bank.country),
    };
  } else if (method === "mobile_money") {
    const mm = body.mobile_money || {};
    if (!t(mm.country) || !t(mm.number)) {
      return NextResponse.json({ error: "Country and mobile number are required." }, { status: 400 });
    }
    details.mobile_money = { country: t(mm.country), number: t(mm.number), provider: t(mm.provider) };
  }

  const { error } = await svc().from("users").update({ payout_details: details }).eq("id", user.id);
  if (error) {
    if (isMissingColumn(error.message)) {
      return NextResponse.json(
        { error: "Payout storage isn't set up yet — run the 20260731_tutor_payout_details migration." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, details });
}
