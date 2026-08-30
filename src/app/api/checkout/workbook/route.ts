// Buying the workbook: one payment, optionally two products.
//
// Two things make this different from every other checkout route here.
//
// 1. It does not require a session. This is the top of a cold funnel, and
//    making a stranger create an account before paying costs more conversions
//    than it saves. The account is created at DELIVERY instead -- see
//    /api/workbook/claim. A signed-in buyer is fine too; we just carry their
//    id along so the order arrives pre-claimed.
//
// 2. It writes nothing before Stripe. /api/checkout/starter-pack inserts its
//    purchase row first "so the webhook always has a row to find", which it
//    can do because it already knows who is buying and what for. Here neither
//    is settled until the session comes back: the email is collected by Stripe,
//    and whether the audio bump was taken is decided on Stripe's page. A row
//    written now would be a guess. The webhook records the order instead.
//
// The usual rule still holds and is the only one that matters for money: the
// client names products, the server prices them. Nothing in the request body
// reaches a Stripe amount.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { APP_URL, SITE_URL } from "@/lib/site/hosts";

export const runtime = "nodejs";

/** The product sold on the sales page. */
const BASE_PRODUCT = "workbook_fpp";
/** Offered as an order bump inside Stripe checkout, never priced by the client. */
const BUMP_PRODUCT = "audio_fpp";

const Body = z.object({
  // Where to land after paying. Validated as an internal path; an absolute URL
  // here would be an open redirect.
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

  let input: z.infer<typeof Body>;
  try {
    input = Body.parse(await request.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: "That request isn't valid." }, { status: 400 });
  }

  // Optional. Present when someone already has an account and bought from
  // inside the app; absent for the cold traffic this route exists to serve.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const db = service();

  const { data: products } = await db
    .from("digital_products")
    .select("product_key, name, description, price_cents, currency, stripe_price_id, active")
    .in("product_key", [BASE_PRODUCT, BUMP_PRODUCT]);

  const base = products?.find((p) => p.product_key === BASE_PRODUCT);
  if (!base?.active) {
    return NextResponse.json({ error: "That isn't available yet." }, { status: 404 });
  }

  // The bump is a nicety, not a requirement. Stripe's `optional_items` takes a
  // Price id and will not accept inline price_data, so until someone creates
  // that Price in the dashboard the workbook simply sells on its own rather
  // than the whole checkout failing.
  const bump = products?.find((p) => p.product_key === BUMP_PRODUCT);
  const bumpPriceId = bump?.active ? bump.stripe_price_id : null;

  const currency = (base.currency || "USD").toLowerCase();
  const landing = safeNext(input.next) ?? "/workbook";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Stripe collects it when there is no customer_email, which is the whole
      // point of the guest path -- and the address it captures is the one the
      // delivery email must go to.
      customer_email: user?.email ?? undefined,
      metadata: {
        kind: "workbook",
        base_product_key: base.product_key,
        // Present only for an already-signed-in buyer. The webhook uses it to
        // pre-claim the order so that person never sees a claim screen.
        supabase_user_id: user?.id ?? "",
      },
      payment_intent_data: {
        metadata: { kind: "workbook", base_product_key: base.product_key },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: base.price_cents,
            product_data: {
              name: base.name,
              description: base.description ?? undefined,
            },
          },
        },
      ],
      ...(bumpPriceId
        ? { optional_items: [{ price: bumpPriceId, quantity: 1 }] }
        : {}),
      // 14-day guarantee (PRD 9.3). Stated here as well as on the sales page
      // and in the delivery email, because this is the screen with the card
      // number on it.
      custom_text: {
        submit: {
          message:
            "14-day money-back guarantee. Not for you? Reply to your receipt and we'll refund you.",
        },
      },
      success_url: `${APP_URL}${landing}?purchase=workbook&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/francais-pas-a-pas`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[checkout/workbook] stripe session failed", err);
    return NextResponse.json(
      { error: "Couldn't start checkout. Please try again." },
      { status: 502 }
    );
  }
}
