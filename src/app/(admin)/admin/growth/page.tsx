// Growth analytics dashboard (ADMIN only). All data via the service-role
// analytics lib. Community managers are redirected to their support inbox.

import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, GraduationCap, CreditCard, TrendingUp, Activity, Radio, ArrowRight, LifeBuoy,
} from "lucide-react";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import {
  getOverview, getSignupsOverTime, getActiveOverTime, getRetentionCohorts,
  getAcquisition, getActivationFunnel, getRevenue,
} from "@/lib/admin/analytics";
import { BarSeries } from "@/components/admin/bar-series";
import { CohortHeatmap } from "@/components/admin/cohort-heatmap";

export const dynamic = "force-dynamic";

const SOURCE_COLORS: Record<string, string> = {
  organic: "bg-emerald-500", paid: "bg-blue-500", social: "bg-fuchsia-500",
  referral: "bg-amber-500", direct: "bg-slate-500", other: "bg-gray-400", unknown: "bg-gray-300",
};

export default async function GrowthPage() {
  const me = await getDashboardUser();
  if (!me) redirect("/admin/login");
  if (!isAdmin(me)) redirect("/admin/support");

  const [overview, signups, active, cohorts, acquisition, funnel, revenue] = await Promise.all([
    getOverview(), getSignupsOverTime(30), getActiveOverTime(30), getRetentionCohorts(8),
    getAcquisition(), getActivationFunnel(), getRevenue(),
  ]);

  const acqTotal = acquisition.reduce((s, a) => s + a.count, 0) || 1;
  const funnelTop = funnel[0]?.count || 1;

  const kpis = [
    { label: "Total users", value: overview.totalUsers, icon: Users, sub: `${overview.students} students · ${overview.tutors} tutors` },
    { label: "New (30d)", value: overview.new30d, icon: TrendingUp, sub: `${overview.new7d} in last 7d · ${overview.newToday} today` },
    { label: "Active users", value: overview.mau, icon: Activity, sub: `DAU ${overview.dau} · WAU ${overview.wau} (30d MAU)` },
    { label: "Paying", value: overview.paidUsers, icon: CreditCard, sub: `${revenue.conversion}% free→paid` },
  ];

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">Growth</h1>
          <p className="text-sm text-gray-500">Signups, activity, retention & acquisition</p>
        </div>
        <Link href="/admin/support" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-800">
          <LifeBuoy className="h-4 w-4" /> Support inbox
        </Link>
      </div>

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{k.label}</span>
              <k.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-extrabold text-primary">{k.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-gray-500">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 font-heading font-bold text-gray-900">
            <TrendingUp className="h-4 w-4 text-primary" /> New signups (30 days)
          </h2>
          <BarSeries data={signups} color="bg-primary" />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 font-heading font-bold text-gray-900">
            <Activity className="h-4 w-4 text-emerald-600" /> Daily active users (30 days)
          </h2>
          <BarSeries data={active} color="bg-emerald-500" />
        </div>
      </div>

      {/* Retention cohorts */}
      <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
        <h2 className="mb-1 flex items-center gap-2 font-heading font-bold text-gray-900">
          <Radio className="h-4 w-4 text-primary" /> Retention by signup cohort (weekly)
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          % of each week&apos;s signups still active in later weeks. Fills in as data accrues.
        </p>
        <CohortHeatmap cohorts={cohorts} />
      </div>

      {/* Acquisition + Funnel + Plans */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
          <h2 className="mb-4 font-heading font-bold text-gray-900">Acquisition source</h2>
          <div className="space-y-3">
            {acquisition.map((a) => (
              <div key={a.source}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="capitalize text-gray-700">{a.source}</span>
                  <span className="font-semibold text-gray-900">{a.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full ${SOURCE_COLORS[a.source] || "bg-gray-400"}`} style={{ width: `${(a.count / acqTotal) * 100}%` }} />
                </div>
              </div>
            ))}
            {acquisition.every((a) => a.source === "unknown") ? (
              <p className="text-xs text-gray-400">Source is captured from new signups going forward.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
          <h2 className="mb-4 font-heading font-bold text-gray-900">Activation funnel</h2>
          <div className="space-y-2.5">
            {funnel.map((f) => (
              <div key={f.step}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-700">{f.step}</span>
                  <span className="font-semibold text-gray-900">
                    {f.count} <span className="text-xs font-normal text-gray-400">({Math.round((f.count / funnelTop) * 100)}%)</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full bg-secondary" style={{ width: `${(f.count / funnelTop) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
          <h2 className="mb-4 font-heading font-bold text-gray-900">Plan mix</h2>
          <div className="space-y-3">
            {revenue.plans.map((p) => (
              <div key={p.plan} className="flex items-center justify-between">
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{p.plan}</span>
                <span className="font-semibold text-gray-900">{p.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-primary-50 p-3 text-center">
            <p className="text-2xl font-extrabold text-primary">{revenue.conversion}%</p>
            <p className="text-xs text-primary-700">free → paid conversion</p>
          </div>
        </div>
      </div>
    </div>
  );
}
