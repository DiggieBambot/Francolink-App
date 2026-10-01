// Private packs: unlisted lesson packs sold only to invited emails.
//
// See 20261001_private_pack.sql. The invite is keyed on email because the
// student is invited before they have an account; everything here matches it
// against the signed-in user's email, lowercased the same way the table
// stores it.

import { createClient } from "@supabase/supabase-js";

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export interface PrivatePack {
  packKey: string;
  tier: string;
  lessons: number;
  priceCents: number;
  currency: string;
  creditDays: number | null;
  /** What one 50-minute lesson of this tier costs at list, for the
   *  struck-through price. Null if the tier has no list price. */
  listLessonCents: number | null;
}

/** The private packs this email has a live invite to, and that are on sale. */
export async function getPrivatePacksFor(
  email: string | null | undefined,
): Promise<PrivatePack[]> {
  if (!email) return [];

  const db = service();
  const [{ data }, { data: list }] = await Promise.all([
    db
      .from("private_pack_invites")
      .select(
        "starter_packs!inner(pack_key, tier, lessons, price_cents, currency, credit_days, active, visibility)",
      )
      .eq("email", normalizeEmail(email))
      .is("revoked_at", null),
    db
      .from("lesson_pricing")
      .select("tier, price_cents")
      .eq("duration_minutes", 50)
      .eq("is_trial", false),
  ]);
  const listByTier = new Map(
    (list ?? []).map((r) => [r.tier as string, r.price_cents as number]),
  );

  const seen = new Set<string>();
  const out: PrivatePack[] = [];
  for (const row of data ?? []) {
    const p = row.starter_packs as unknown as {
      pack_key: string;
      tier: string;
      lessons: number;
      price_cents: number;
      currency: string | null;
      credit_days: number | null;
      active: boolean;
      visibility: string;
    };
    if (!p?.active || p.visibility !== "private" || seen.has(p.pack_key))
      continue;
    seen.add(p.pack_key);
    out.push({
      packKey: p.pack_key,
      tier: p.tier,
      lessons: p.lessons,
      priceCents: p.price_cents,
      currency: p.currency || "USD",
      creditDays: p.credit_days,
      listLessonCents: listByTier.get(p.tier) ?? null,
    });
  }
  return out;
}
