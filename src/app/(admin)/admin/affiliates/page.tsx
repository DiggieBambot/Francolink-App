// Admin: creator affiliates — everyone promoting FrancoLink for commission.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import { createServiceClient } from "@/lib/supabase/service";
import { affiliateLink, type Affiliate } from "@/lib/affiliates";
import { formatCents } from "@/lib/affiliates/commissions";
import { getAffiliateStats } from "@/lib/affiliates/stats";
import { NewAffiliateForm } from "./new-affiliate-form";

export const dynamic = "force-dynamic";

export default async function AffiliatesPage() {
  if (!isAdmin(await getDashboardUser())) redirect("/admin");

  const { data } = await createServiceClient()
    .from("affiliates")
    .select("*")
    .order("created_at", { ascending: false });
  const affiliates = (data ?? []) as Affiliate[];
  const stats = await Promise.all(affiliates.map((a) => getAffiliateStats(a.id)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Creators</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Creators earn their rate on every self-study payment (web and Play) for 12 months after a referred
          customer&apos;s first payment. Commission is payable 30 days after each payment, once refunds can no
          longer land. Payouts are made by hand, then recorded on the creator&apos;s page.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3 text-right">Clicks</th>
              <th className="px-4 py-3 text-right">Signups</th>
              <th className="px-4 py-3 text-right">Paying</th>
              <th className="px-4 py-3 text-right">Held</th>
              <th className="px-4 py-3 text-right">Payable</th>
              <th className="px-4 py-3 text-right">Paid</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No creators yet. Add the first one below.
                </td>
              </tr>
            )}
            {affiliates.map((a, i) => {
              const s = stats[i];
              const money = (key: "heldCents" | "payableCents" | "paidCents") =>
                s.balances.length
                  ? s.balances.map((b) => formatCents(b[key], b.currency)).join(" · ")
                  : "—";
              return (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/affiliates/${a.id}`} className="font-medium hover:underline">
                      {a.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(a.commission_rate * 100)}%
                      {a.status === "paused" && <span className="ml-2 rounded bg-muted px-1.5 py-0.5">paused</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs">{a.code.toUpperCase()}</div>
                    <div className="max-w-[220px] truncate text-xs text-muted-foreground">{affiliateLink(a.code)}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.clicks}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.signups}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.customers}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money("heldCents")}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{money("payableCents")}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money("paidCents")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <NewAffiliateForm />
    </div>
  );
}
