// The one-click upsell charge.
//
// The buyer paid for the workbook a minute ago and their card is on file, so
// this takes a pack key and nothing else: no card form, no redirect, no second
// checkout. That is the entire point -- an offer that asks for card details
// again converts at a fraction of one that does not.
//
// The part most implementations get wrong is the exception path. Some cards
// (and every card under European SCA rules) refuse an off-session charge and
// demand the cardholder authenticate. Stripe answers that with
// `authentication_required`, and a naive handler treats it as a decline and
// silently loses a sale that would have gone through. Here it falls back to
// the ordinary Checkout flow, which can show the 3-D Secure step.
//
// Money is server-priced as everywhere else: the body names a pack, the
// database prices it.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const Body = z.object({ pack_key: z.string().trim().min(1).max(40) });

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Ask the client to run the normal Checkout instead. */
const fallback = (reason: string) =>
  NextResponse.json({ ok: false, needsCheckout: true, reason }, { status: 200 });

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first.", needsLogin: true }, { status: 401 });
  }

  let input: z.infer<typeof Body>;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "That offer isn't valid." }, { status: 400 });
  }

  const db = service();

  // One starter pack per person, ever. The partial unique index enforces it
  // too, but a clear message beats a constraint violation.
  const { count: already } = await db
    .from("starter_pack_purchases")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "paid");
  if ((already ?? 0) > 0) {
    return NextResponse.json(
      { error: "You've already used your starter pack.", next: "/workbook" },
      { status: 409 }
    );
  }

  const { data: pack } = await db
    .from("starter_packs")
    .select("pack_key, tier, lessons, price_cents, currency, active")
    .eq("pack_key", input.pack_key)
    .maybeSingle();
  if (!pack?.active) {
    return NextResponse.json({ error: "That pack isn't available." }, { status: 404 });
  }

  // The card they just used. Newest paid order wins, in case they have bought
  // more than one thing from us.
  const { data: order } = await db
    .from("digital_orders")
    .select("stripe_customer_id, stripe_payment_method_id")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .not("stripe_payment_method_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!order?.stripe_customer_id || !order?.stripe_payment_method_id) {
    return fallback("no-saved-card");
  }

  // Written before the charge, so a successful payment always has a row to
  // grant against — the same ordering /api/checkout/starter-pack uses.
  const { data: purchase, error: insertError } = await db
    .from("starter_pack_purchases")
    .insert({
      user_id: user.id,
      pack_key: pack.pack_key,
      tier: pack.tier,
      lessons: pack.lessons,
      price_cents: pack.price_cents,
      currency: pack.currency || "USD",
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !purchase) {
    console.error("[oto/charge] insert failed", insertError);
    return NextResponse.json({ error: "Couldn't complete that." }, { status: 500 });
  }

  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: pack.price_cents,
        currency: (pack.currency || "USD").toLowerCase(),
        customer: order.stripe_customer_id,
        payment_method: order.stripe_payment_method_id,
        off_session: true,
        confirm: true,
        description: `${pack.lessons} lessons — starter pack`,
        metadata: {
          kind: "starter_pack_oto",
          purchase_id: purchase.id,
          supabase_user_id: user.id,
        },
      },
      // Stripe de-duplicates on this, so a double-clicked button charges once
      // even before our own guards are reached.
      { idempotencyKey: `oto_${purchase.id}` }
    );

    if (intent.status !== "succeeded") {
      await db.from("starter_pack_purchases")
        .update({ status: "abandoned" }).eq("id", purchase.id);
      return fallback(`intent-${intent.status}`);
    }

    await db.from("starter_pack_purchases")
      .update({ stripe_payment_intent_id: intent.id }).eq("id", purchase.id);

    const { error: grantError } = await db.rpc("grant_starter_pack_by_id", {
      p_purchase_id: purchase.id,
    });
    if (grantError) {
      // They have paid. Do not fail the response — the money is real and the
      // credits are owed; this is a fix-forward, not a retry.
      console.error("[oto/charge] GRANT FAILED AFTER CHARGE", purchase.id, intent.id, grantError);
    }

    return NextResponse.json({ ok: true, lessons: pack.lessons, next: "/workbook" });
  } catch (err) {
    await db.from("starter_pack_purchases")
      .update({ status: "abandoned" }).eq("id", purchase.id);

    const e = err as { code?: string; type?: string; message?: string };
    // The card wants its owner present. Not a decline — send them through
    // Checkout, which can show the authentication step.
    if (e.code === "authentication_required") return fallback("authentication_required");
    // A genuine decline is worth saying plainly rather than dressing up.
    if (e.type === "StripeCardError") {
      return NextResponse.json(
        { ok: false, declined: true, error: "That card was declined. You can try another at checkout." },
        { status: 200 }
      );
    }
    console.error("[oto/charge] stripe failed", err);
    return fallback("stripe-error");
  }
}
