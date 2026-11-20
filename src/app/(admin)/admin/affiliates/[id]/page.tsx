// Admin: one creator — numbers, ledger, payouts, and settings.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { createServiceClient } from "@/lib/supabase/service";
import { affiliateLink, type Affiliate } from "@/lib/affiliates";
import { formatCents } from "@/lib/affiliates/commissions";
import { getAffiliateStats } from "@/lib/affiliates/stats";
import { AffiliateControls, RecordPayoutButton } from "./controls";

export const dynamic = "force-dynamic";

export default async function AffiliatePage({ params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(await getDashboardUser())) redirect("/admin");
  const { id } = await params;

  const db = createServiceClient();
  const { data } = await db.from("affiliates").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const affiliate = data as Affiliate;

  const [stats, linked, customers] = await Promise.all([
    getAffiliateStats(id),
    affiliate.user_id
      ? db.from("users").select("email").eq("id", affiliate.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
    db
      .from("users")
      .select("id, name, email, affiliate_attributed_at, affiliate_attributed_via, subscription_plan, subscription_source")
      .eq("referred_by_affiliate_id", id)
      .order("affiliate_attributed_at", { ascending: false })
      .limit(200),
  ]);

  const nameById = new Map((customers.data ?? []).map((u) => [u.id, u.name || u.email]));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/affiliates" className="text-sm text-muted-foreground hover:underline">
          ← Creators
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{affiliate.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Code <span className="font-mono">{affiliate.code.toUpperCase()}</span> · {affiliateLink(affiliate.code)}
          {!affiliate.stripe_promotion_code_id && affiliate.discount_percent > 0 && (
            <span className="ml-2 text-destructive">No Stripe discount code yet</span>
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Link clicks", stats.clicks],
          ["Signups", stats.signups],
          ["Paying customers", stats.customers],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-card p-4">
            <div className="text-xs text-muted-foreground">{k}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Balance</h2>
        {stats.balances.length === 0 && <p className="text-sm text-muted-foreground">No commission yet.</p>}
        {stats.balances.map((b) => (
          <div key={b.currency} className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border bg-card p-4 text-sm">
            <span>Held: <b className="tabular-nums">{formatCents(b.heldCents, b.currency)}</b></span>
            <span>Payable: <b className="tabular-nums">{formatCents(b.payableCents, b.currency)}</b></span>
            <span>Paid: <b className="tabular-nums">{formatCents(b.paidCents, b.currency)}</b></span>
            {b.payableCents > 0 && (
              <RecordPayoutButton
                affiliateId={id}
                currency={b.currency}
                amount={formatCents(b.payableCents, b.currency)}
                defaultMethod={affiliate.payout_method}
              />
            )}
          </div>
        ))}
        {affiliate.payout_details && (
          <p className="text-sm text-muted-foreground">
            Pay to: {affiliate.payout_method ?? "—"} · {affiliate.payout_details}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Commission ledger</h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2 text-right">Base</th>
                <th className="px-4 py-2 text-right">Commission</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.commissions.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Nothing yet.</td></tr>
              )}
              {stats.commissions.map((c) => {
                const held = c.status === "pending" && new Date(c.available_at) > new Date();
                return (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-2 tabular-nums">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{(c.user_id && nameById.get(c.user_id)) || "—"}</td>
                    <td className="px-4 py-2">
                      {c.source === "stripe" ? "Web" : "Google Play"}
                      {c.kind === "reversal" && <span className="ml-1 text-destructive">refund</span>}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatCents(c.base_cents, c.currency)}</td>
                    <td className="px-4 py-2 text-right font-medium tabular-nums">{formatCents(c.amount_cents, c.currency)}</td>
                    <td className="px-4 py-2">
                      {c.status === "void"
                        ? "Refunded"
                        : c.status === "paid"
                          ? "Paid"
                          : held
                            ? `Held until ${new Date(c.available_at).toLocaleDateString()}`
                            : "Payable"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Referred accounts</h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Account</th>
                <th className="px-4 py-2">Linked</th>
                <th className="px-4 py-2">Via</th>
                <th className="px-4 py-2">Plan</th>
              </tr>
            </thead>
            <tbody>
              {(customers.data ?? []).length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No signups yet.</td></tr>
              )}
              {(customers.data ?? []).map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/admin/users/${u.id}`} className="hover:underline">{u.name || u.email}</Link>
                  </td>
                  <td className="px-4 py-2 tabular-nums">
                    {u.affiliate_attributed_at ? new Date(u.affiliate_attributed_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2">{u.affiliate_attributed_via ?? "—"}</td>
                  <td className="px-4 py-2">
                    {u.subscription_plan || "Free"}
                    {u.subscription_source === "google_play" && " (Play)"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {stats.payouts.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Payouts</h2>
          <ul className="divide-y rounded-xl border bg-card text-sm">
            {stats.payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap gap-x-4 px-4 py-2">
                <span className="tabular-nums">{new Date(p.paid_at).toLocaleDateString()}</span>
                <b className="tabular-nums">{formatCents(p.amount_cents, p.currency)}</b>
                <span className="text-muted-foreground">{[p.method, p.reference].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AffiliateControls affiliate={affiliate} linkedEmail={linked.data?.email ?? ""} />
    </div>
  );
}
