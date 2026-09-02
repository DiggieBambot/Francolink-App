// Claiming a workbook order.
//
// This is the hinge the whole funnel turns on. A guest paid, Stripe took their
// email, and the delivery mail sent them here. Claiming binds that order to an
// account -- creating one if they don't have it -- which is the moment a
// stranger becomes a FrancoLink user we can sell a lesson to.
//
// GET  ?t=<token>  -> whose order this is, so the signup form can prefill the
//                     email. Unauthenticated by necessity: the person clicking
//                     the link does not have an account yet.
// POST { token }   -> binds it to the signed-in user.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Enough to prefill a form, and nothing that isn't already in their inbox. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t");
  if (!token) {
    return NextResponse.json({ error: "Missing link." }, { status: 400 });
  }

  const { data: order } = await service()
    .from("digital_orders")
    .select("id, email, status, user_id, digital_order_items(product_key)")
    .eq("claim_token", token)
    .maybeSingle();

  // Same answer for a bad token and an unpaid order, so this cannot be used to
  // probe which tokens exist.
  if (!order || order.status !== "paid") {
    return NextResponse.json({ error: "That link isn't valid." }, { status: 404 });
  }

  const items = (order.digital_order_items ?? []) as { product_key: string }[];

  return NextResponse.json({
    ok: true,
    email: order.email,
    claimed: Boolean(order.user_id),
    products: items.map((i) => i.product_key),
  });
}

const Body = z.object({ token: z.string().trim().min(1).max(200) });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to open your workbook.", needsLogin: true },
      { status: 401 }
    );
  }

  let input: z.infer<typeof Body>;
  try {
    input = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "That link isn't valid." }, { status: 400 });
  }

  const { data, error } = await service().rpc("claim_digital_order", {
    p_token: input.token,
    p_user_id: user.id,
  });

  if (error) {
    // The function distinguishes these deliberately, because they need
    // different words. A forwarded email landing on someone else's order is
    // the interesting one.
    if (error.code === "23505" || /already claimed/i.test(error.message)) {
      return NextResponse.json(
        {
          error:
            "This workbook is already linked to another account. Sign in with the email you bought it with.",
        },
        { status: 409 }
      );
    }
    if (/not paid/i.test(error.message)) {
      return NextResponse.json(
        { error: "That order isn't complete yet. Try again in a minute." },
        { status: 409 }
      );
    }
    if (error.code === "P0002" || /no such order/i.test(error.message)) {
      return NextResponse.json({ error: "That link isn't valid." }, { status: 404 });
    }
    console.error("[workbook/claim] failed", error);
    return NextResponse.json({ error: "Couldn't open your workbook." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orderId: data, next: "/oto" });
}
