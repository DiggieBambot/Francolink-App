// Buying extra AI tutoring hours: a one-off payment on top of a plan.
//
// Nothing the client sends decides money. The body names a pack; the server
// prices it from AI_TUTOR_HOUR_PACKS. A purchase row is written before Stripe
// so the webhook always has a row to grant from, and granting is idempotent on
// the checkout session (grant_ai_tutor_hours).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { APP_URL } from "@/lib/site/hosts";
import { getTutorAccess } from "@/lib/ai/tutor-access";
import { AI_TUTOR_HOUR_PACKS } from "@/lib/config/subscription";

export const runtime = "nodejs";

const Body = z.object({
  pack: z.enum(Object.keys(AI_TUTOR_HOUR_PACKS) as [keyof typeof AI_TUTOR_HOUR_PACKS]),
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
    return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to add tutoring hours." }, { status: 401 });
  }

  let input;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "That pack isn't valid." }, { status: 400 });
  }

  // Extra hours top up a plan; they are no use without one.
  const access = await getTutorAccess(supabase, user.id);
  if (!access?.hasAccess) {
    return NextResponse.json(
      { error: "Extra hours need a Premium plan.", needsPlan: true },
      { status: 403 }
    );
  }

  const pack = AI_TUTOR_HOUR_PACKS[input.pack];
  const db = service();

  const { data: purchase, error: insertError } = await db
    .from("ai_tutor_hour_purchases")
    .insert({
      user_id: user.id,
      pack_key: input.pack,
      seconds: pack.hours * 3600,
      price_cents: pack.priceCents,
      currency: "USD",
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !purchase) {
    console.error("[checkout/ai-tutor-hours] insert failed", insertError);
    return NextResponse.json({ error: "Couldn't start checkout." }, { status: 500 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      client_reference_id: purchase.id,
      metadata: {
        kind: "ai_tutor_hours",
        purchase_id: purchase.id,
        supabase_user_id: user.id,
      },
      payment_intent_data: {
        metadata: { kind: "ai_tutor_hours", purchase_id: purchase.id },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pack.priceCents,
            product_data: {
              name: `FrancoLink AI tutoring — ${pack.label}`,
              description:
                "Extra AI tutoring time with Leon, used once your plan's daily or monthly time runs out.",
            },
          },
        },
      ],
      success_url: `${APP_URL}/student/ai-tutor?hours=added`,
      cancel_url: `${APP_URL}/student/ai-tutor`,
    });

    await db
      .from("ai_tutor_hour_purchases")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", purchase.id);

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    await db.from("ai_tutor_hour_purchases").update({ status: "abandoned" }).eq("id", purchase.id);
    console.error("[checkout/ai-tutor-hours] stripe session failed", err);
    return NextResponse.json(
      { error: "Couldn't start checkout. Please try again." },
      { status: 502 }
    );
  }
}
