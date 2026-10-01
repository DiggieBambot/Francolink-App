// Buying a private pack: an unlisted block of lessons at a rate agreed with
// the student, sold only to an email on private_pack_invites.
//
// Same purchase table and the same webhook path as the starter pack
// (metadata.kind 'starter_pack'), so granting, expiry and tier entitlement all
// come for free. What differs is who may buy, and that they may buy again.
//
// Nothing the client sends decides money or eligibility: the body names a
// pack, and the server checks the signed-in user's email has an invite to it.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { APP_URL } from "@/lib/site/hosts";
import { getPrivatePacksFor } from "@/lib/credits/private-packs";

export const runtime = "nodejs";

const Body = z.object({
  pack_key: z.string().trim().min(1).max(40),
});

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Payments aren't configured yet." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to buy your lessons.", needsLogin: true },
      { status: 401 }
    );
  }

  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "That pack isn't valid." }, { status: 400 });
  }

  // The invite IS the authorisation. Not invited, or revoked, reads the same
  // as a pack that doesn't exist.
  const pack = (await getPrivatePacksFor(user.email)).find(
    (p) => p.packKey === input.pack_key
  );
  if (!pack) {
    return NextResponse.json({ error: "That pack isn't available." }, { status: 404 });
  }

  const db = service();

  // Written BEFORE Stripe, so the webhook always has a row to find.
  const { data: purchase, error: insertError } = await db
    .from("starter_pack_purchases")
    .insert({
      user_id: user.id,
      pack_key: pack.packKey,
      tier: pack.tier,
      lessons: pack.lessons,
      price_cents: pack.priceCents,
      currency: pack.currency,
      pack_visibility: "private",
      credit_days: pack.creditDays,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !purchase) {
    console.error("[checkout/private-pack] insert failed", insertError);
    return NextResponse.json({ error: "Couldn't start checkout." }, { status: 500 });
  }

  const days = pack.creditDays ?? 30;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      client_reference_id: purchase.id,
      metadata: {
        kind: "starter_pack",
        purchase_id: purchase.id,
        supabase_user_id: user.id,
      },
      payment_intent_data: {
        metadata: { kind: "starter_pack", purchase_id: purchase.id },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: pack.currency.toLowerCase(),
            unit_amount: pack.priceCents,
            product_data: {
              name: `${pack.lessons} lessons`,
              description: `Use them within ${days} days.`,
            },
          },
        },
      ],
      success_url: `${APP_URL}/dashboard`,
      cancel_url: `${APP_URL}/private-rate`,
    });

    await db
      .from("starter_pack_purchases")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", purchase.id);

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    await db
      .from("starter_pack_purchases")
      .update({ status: "abandoned" })
      .eq("id", purchase.id);
    console.error("[checkout/private-pack] stripe session failed", err);
    return NextResponse.json(
      { error: "Couldn't start checkout. Please try again." },
      { status: 502 }
    );
  }
}
