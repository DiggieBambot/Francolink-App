// Buying the starter pack: three lessons, one payment.
//
// Separate from /api/checkout/subscription because it is a different kind of
// sale — mode 'payment', not 'subscription', no renewal, no quantity. Folding
// it into that route would mean branching on nearly every line.
//
// Nothing the client sends decides money. The body names a pack; the server
// prices it from starter_packs. And a pack is a STARTER: one per person ever,
// checked here and enforced by a partial unique index underneath.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { APP_URL, SITE_URL } from "@/lib/site/hosts";

export const runtime = "nodejs";

const Body = z.object({
  pack_key: z.string().trim().min(1).max(40),
  // Where to land afterwards — usually the tutor they came from. Validated as
  // an internal path; an absolute URL here would be an open redirect.
  next: z.string().trim().max(300).optional(),
});

function safeNext(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

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
      { error: "Sign in to buy a starter pack.", needsLogin: true },
      { status: 401 }
    );
  }

  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "That pack isn't valid." }, { status: 400 });
  }

  const db = service();

  // One per person, ever. The index enforces it too, but a clear message beats
  // a constraint violation.
  const { count: already } = await db
    .from("starter_pack_purchases")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "paid");

  if ((already ?? 0) > 0) {
    return NextResponse.json(
      {
        error: "You've already used your starter pack. Choose a plan to carry on.",
        needsPlan: true,
        next: "/start",
      },
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

  // Written BEFORE Stripe, so the webhook always has a row to find. The
  // session id is attached immediately after and is what makes granting
  // idempotent.
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
    console.error("[checkout/starter-pack] insert failed", insertError);
    return NextResponse.json({ error: "Couldn't start checkout." }, { status: 500 });
  }

  const landing = safeNext(input.next) ?? "/dashboard";

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
            currency: (pack.currency || "USD").toLowerCase(),
            unit_amount: pack.price_cents,
            product_data: {
              name: `${pack.lessons} lessons — starter pack`,
              description:
                "Use them within 30 days with any tutor your pack covers.",
            },
          },
        },
      ],
      success_url: `${APP_URL}${landing}`,
      cancel_url: `${SITE_URL}/tutors`,
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
    console.error("[checkout/starter-pack] stripe session failed", err);
    return NextResponse.json(
      { error: "Couldn't start checkout. Please try again." },
      { status: 502 }
    );
  }
}
