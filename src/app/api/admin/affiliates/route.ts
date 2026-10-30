// Admin: creator affiliates.
//
// POST  create a creator (and their Stripe promotion code)
// PATCH update one: { id, ...fields } or { id, action: "create_promo" }
//
// Listing and reporting are read directly by the admin pages.

import { NextResponse } from "next/server";
import { z } from "zod";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeCode, type Affiliate } from "@/lib/affiliates";
import { createPromotionCode, setPromotionCodeActive } from "@/lib/affiliates/stripe";

const PayoutMethod = z.enum(["paypal", "wise", "bank", "other"]).nullable().optional();

const Create = z.object({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  // The creator's own FrancoLink login, if they have one: gives them the dashboard.
  user_email: z.string().trim().email().max(200).optional().or(z.literal("")),
  commission_rate: z.number().gt(0).max(0.5).default(0.2),
  discount_percent: z.number().int().min(0).max(50).default(5),
  payout_method: PayoutMethod,
  payout_details: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

const Update = z.object({
  id: z.string().uuid(),
  action: z.literal("create_promo").optional(),
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(200).optional(),
  user_email: z.string().trim().email().max(200).optional().or(z.literal("")),
  commission_rate: z.number().gt(0).max(0.5).optional(),
  status: z.enum(["active", "paused"]).optional(),
  payout_method: PayoutMethod,
  payout_details: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

async function userIdForEmail(email: string | undefined): Promise<string | null | "missing"> {
  if (!email) return null;
  const { data } = await createServiceClient().from("users").select("id").ilike("email", email).maybeSingle();
  return data?.id ?? "missing";
}

export async function POST(request: Request) {
  if (!isAdmin(await getDashboardUser())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = Create.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  const input = parsed.data;

  const code = normalizeCode(input.code);
  if (!code || code !== input.code.trim().toLowerCase()) {
    return NextResponse.json({ error: "Code must be 3–24 letters or digits, no spaces or symbols." }, { status: 400 });
  }

  const userId = await userIdForEmail(input.user_email || undefined);
  if (userId === "missing") {
    return NextResponse.json({ error: "No FrancoLink account with that login email. Leave it blank or ask them to sign up first." }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: affiliate, error } = await db
    .from("affiliates")
    .insert({
      code,
      name: input.name,
      email: input.email,
      user_id: userId,
      commission_rate: input.commission_rate,
      discount_percent: input.discount_percent,
      payout_method: input.payout_method ?? null,
      payout_details: input.payout_details ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single<Affiliate>();

  if (error) {
    const msg = error.code === "23505" ? "That code or login is already used by another creator." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let warning: string | undefined;
  if (affiliate.discount_percent > 0) {
    const promo = await createPromotionCode(affiliate);
    if ("error" in promo) {
      warning = `${promo.error} The creator was saved; retry from their page.`;
    } else {
      await db
        .from("affiliates")
        .update({ stripe_coupon_id: promo.couponId, stripe_promotion_code_id: promo.promotionCodeId })
        .eq("id", affiliate.id);
    }
  }

  return NextResponse.json({ ok: true, id: affiliate.id, warning });
}

export async function PATCH(request: Request) {
  if (!isAdmin(await getDashboardUser())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = Update.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  const { id, action, user_email, ...fields } = parsed.data;

  const db = createServiceClient();
  const { data: current } = await db.from("affiliates").select("*").eq("id", id).maybeSingle<Affiliate>();
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "create_promo") {
    if (current.stripe_promotion_code_id) return NextResponse.json({ error: "They already have a code." }, { status: 400 });
    const promo = await createPromotionCode(current);
    if ("error" in promo) return NextResponse.json({ error: promo.error }, { status: 502 });
    await db
      .from("affiliates")
      .update({ stripe_coupon_id: promo.couponId, stripe_promotion_code_id: promo.promotionCodeId })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  const update: Record<string, unknown> = { ...fields };
  if (user_email !== undefined) {
    const userId = await userIdForEmail(user_email || undefined);
    if (userId === "missing") return NextResponse.json({ error: "No FrancoLink account with that login email." }, { status: 400 });
    update.user_id = userId;
  }

  const { error } = await db.from("affiliates").update(update).eq("id", id);
  if (error) {
    const msg = error.code === "23505" ? "That login is already linked to another creator." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // A paused creator's code stops working at checkout too.
  if (fields.status && fields.status !== current.status && current.stripe_promotion_code_id) {
    await setPromotionCodeActive(current.stripe_promotion_code_id, fields.status === "active");
  }

  return NextResponse.json({ ok: true });
}
