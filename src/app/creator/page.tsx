// /creator — a creator's own view of their link, code and earnings.
//
// Available to the FrancoLink account an admin linked to the creator. Shows
// totals only: which of their audience signed up is the customers' business,
// not the creator's.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { HOLD_DAYS, WINDOW_MONTHS, affiliateLink, type Affiliate } from "@/lib/affiliates";
import { formatCents } from "@/lib/affiliates/commissions";
import { getAffiliateStats } from "@/lib/affiliates/stats";
import { CopyButton } from "./copy-button";

export const metadata: Metadata = { title: "Creator dashboard | FrancoLink", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CreatorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/creator");

  const { data } = await createServiceClient().from("affiliates").select("*").eq("user_id", user.id).maybeSingle();
  const affiliate = data as Affiliate | null;

  if (!affiliate) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Creator dashboard</h1>
        <p className="mt-3 text-muted-foreground">
          This account isn&apos;t linked to a creator profile. If you promote FrancoLink, ask us to link this login
          to your creator account.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          Back to FrancoLink
        </Link>
      </main>
    );
  }

  const stats = await getAffiliateStats(affiliate.id);
  const link = affiliateLink(affiliate.code);
  const code = affiliate.code.toUpperCase();
  const rate = Math.round(affiliate.commission_rate * 100);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Hi {affiliate.name.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You earn {rate}% of every subscription payment from people you refer, for their first {WINDOW_MONTHS} months
          — on the web and in the Android app.
          {affiliate.discount_percent > 0 && ` Your audience gets ${affiliate.discount_percent}% off their first payment.`}
          {affiliate.status === "paused" && " Your creator account is currently paused."}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Your link</div>
          <div className="mt-1 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-sm">{link}</code>
            <CopyButton text={link} />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Your code (for checkout and the app)</div>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 text-sm font-semibold">{code}</code>
            <CopyButton text={code} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
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
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Earnings</h2>
        {stats.balances.length === 0 ? (
          <p className="text-sm text-muted-foreground">No earnings yet — share your link to get started.</p>
        ) : (
          stats.balances.map((b) => (
            <div key={b.currency} className="grid gap-3 sm:grid-cols-3">
              {[
                ["Pending", b.heldCents, `Confirmed ${HOLD_DAYS} days after each payment`],
                ["Ready to pay", b.payableCents, "Included in your next payout"],
                ["Paid to you", b.paidCents, ""],
              ].map(([k, v, hint]) => (
                <div key={k as string} className="rounded-xl border bg-card p-4">
                  <div className="text-xs text-muted-foreground">{k}</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">{formatCents(v as number, b.currency)}</div>
                  {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
                </div>
              ))}
            </div>
          ))
        )}
      </section>

      {stats.commissions.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Recent activity</h2>
          <ul className="divide-y rounded-xl border bg-card text-sm">
            {stats.commissions.slice(0, 50).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-4 px-4 py-2">
                <span className="tabular-nums text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                <span>
                  {c.kind === "reversal" ? "Refund" : "Subscription payment"} · {c.source === "stripe" ? "web" : "app"}
                </span>
                <span className="ml-auto font-medium tabular-nums">
                  {c.status === "void" ? <s>{formatCents(c.amount_cents, c.currency)}</s> : formatCents(c.amount_cents, c.currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stats.payouts.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Payouts</h2>
          <ul className="divide-y rounded-xl border bg-card text-sm">
            {stats.payouts.map((p) => (
              <li key={p.id} className="flex gap-x-4 px-4 py-2">
                <span className="tabular-nums text-muted-foreground">{new Date(p.paid_at).toLocaleDateString()}</span>
                <span className="ml-auto font-medium tabular-nums">{formatCents(p.amount_cents, p.currency)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
