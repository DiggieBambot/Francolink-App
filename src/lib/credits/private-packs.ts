// Private packs: unlisted lesson packs, sold two ways.
//
//   invite  the signed-in user's email is on private_pack_invites
//           (20261001_private_pack.sql). Tight: only those people.
//   link    the buyer holds /private-rate/<share_token>
//           (20261002_private_pack_link.sql). Loose: whoever has the link.
//
// Invites are keyed on email because the student is invited before they have
// an account; everything here matches it against the signed-in user's email,
// lowercased the same way the table stores it.

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
  /** Admin-edited page words, {en, fr}; see private-rate-copy.ts. */
  pageCopy: unknown;
  /** What one 50-minute lesson of this tier costs at list, for the
   *  struck-through price. Null if the tier has no list price. */
  listLessonCents: number | null;
}

interface PackRow {
  pack_key: string;
  tier: string;
  lessons: number;
  price_cents: number;
  currency: string | null;
  credit_days: number | null;
  page_copy: unknown;
  active: boolean;
  visibility: string;
}

const PACK_COLUMNS =
  "pack_key, tier, lessons, price_cents, currency, credit_days, active, visibility, page_copy";

/** List prices by tier, for the struck-through figure. */
async function listPrices(): Promise<Map<string, number>> {
  const { data } = await service()
    .from("lesson_pricing")
    .select("tier, price_cents")
    .eq("duration_minutes", 50)
    .eq("is_trial", false);
  return new Map(
    (data ?? []).map((r) => [r.tier as string, r.price_cents as number]),
  );
}

/** Rows that are private and on sale, de-duplicated, in the shape the UI wants. */
function toPacks(rows: PackRow[], list: Map<string, number>): PrivatePack[] {
  const seen = new Set<string>();
  const out: PrivatePack[] = [];
  for (const p of rows) {
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
      pageCopy: p.page_copy ?? {},
      listLessonCents: list.get(p.tier) ?? null,
    });
  }
  return out;
}

/** The private packs this email has a live invite to, and that are on sale. */
export async function getPrivatePacksFor(
  email: string | null | undefined,
): Promise<PrivatePack[]> {
  if (!email) return [];

  const [{ data }, list] = await Promise.all([
    service()
      .from("private_pack_invites")
      .select(`starter_packs!inner(${PACK_COLUMNS})`)
      .eq("email", normalizeEmail(email))
      .is("revoked_at", null),
    listPrices(),
  ]);

  const rows = (data ?? []).map(
    (r) => r.starter_packs as unknown as PackRow,
  );
  return toPacks(rows, list);
}

/** Token shape check before touching the database: 32 hex characters. */
export const isShareToken = (token: string) => /^[0-9a-f]{20,64}$/.test(token);

/** The private pack a secret link opens, if the link is live. */
export async function getPrivatePackByToken(
  token: string,
): Promise<PrivatePack | null> {
  if (!isShareToken(token)) return null;

  const [{ data }, list] = await Promise.all([
    service()
      .from("starter_packs")
      .select(PACK_COLUMNS)
      .eq("share_token", token)
      .maybeSingle(),
    listPrices(),
  ]);

  return data ? (toPacks([data as PackRow], list)[0] ?? null) : null;
}
