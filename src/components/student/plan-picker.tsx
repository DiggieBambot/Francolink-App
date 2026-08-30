"use client";

// Choosing a lesson plan.
//
// This screen is the missing half of a system that was already finished:
// /api/checkout/subscription, the credit ledger, weekly grants, 30-day expiry
// and tier entitlement were all built and had nothing calling them. The
// student could make an account and land on a dashboard with no plan, no
// credits and nothing to do.
//
// Three choices, in the order people actually make them:
//
//   1. WHICH TUTORS — community or professional. This is the real decision and
//      it is the one that moves the price, so it is first and largest.
//   2. HOW OFTEN — lessons per week. Frequency is a habit question, not a
//      money question, so the weekly price is shown rather than the term
//      total while they pick.
//   3. HOW LONG — term. Money question, so this is where totals and savings
//      appear.
//
// Prices are re-derived server-side at checkout. Nothing shown here decides
// what anyone is charged.

import { useMemo, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import type { Plan } from "@/lib/credits/plans";
import { WEEKS_PER_MONTH } from "@/lib/credits/plans";
import { cn } from "@/lib/utils";

const TERMS: { months: 1 | 3 | 12; label: string; note: string }[] = [
  { months: 1, label: "Monthly", note: "Cancel any time" },
  { months: 3, label: "3 months", note: "Save 10%" },
  { months: 12, label: "12 months", note: "Save 20%" },
];

const FREQUENCIES = [1, 2, 3, 5];

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function PlanPicker({
  plans,
  introEligible,
  next,
}: {
  plans: Plan[];
  /** Never subscribed before — the discounted first month applies. */
  introEligible: boolean;
  /** Where to send them after checkout, usually the tutor they came from. */
  next?: string;
}) {
  const [planKey, setPlanKey] = useState(
    plans.find((p) => p.planKey === "professional")?.planKey ?? plans[0]?.planKey
  );
  const [perWeek, setPerWeek] = useState(2);
  const [term, setTerm] = useState<1 | 3 | 12>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((p) => p.planKey === planKey);

  const price = useMemo(
    () =>
      plan?.prices.find(
        (p) => p.lessonsPerWeek === perWeek && p.termMonths === term
      ),
    [plan, perWeek, term]
  );

  // The intro is monthly-term only: "40% off your first month" and a yearly
  // invoice do not compose, and the longer terms already discount every lesson
  // for the whole term. See 20260831_intro_offer.sql.
  const introBps = plan && term === 1 && introEligible ? plan.introDiscountBps : 0;

  const monthlyCents = price
    ? Math.round(price.totalCents / term)
    : 0;
  const introMonthCents = Math.round(monthlyCents * (1 - introBps / 10000));

  async function subscribe() {
    if (!plan || !price) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_key: plan.planKey,
          lessons_per_week: perWeek,
          term_months: term,
          ...(next ? { next } : {}),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error || "Couldn't start checkout.");
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start checkout.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------- 1. WHICH TUTORS */}
      <section>
        <h2 className="font-heading font-bold text-lg text-primary mb-3">
          Who do you want to learn with?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => {
            const active = p.planKey === planKey;
            return (
              <button
                key={p.planKey}
                type="button"
                onClick={() => setPlanKey(p.planKey)}
                aria-pressed={active}
                className={cn(
                  "text-left rounded-2xl border-2 p-5 transition-colors",
                  active
                    ? "border-primary bg-primary-50"
                    : "border-gray-100 hover:border-primary-100"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-heading font-bold text-primary">{p.name}</span>
                  {active && <Check className="w-5 h-5 text-primary shrink-0" />}
                </div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {p.description}
                </p>
                <p className="mt-3 text-sm font-bold text-gray-900">
                  {money(p.perLessonCents)}{" "}
                  <span className="font-normal text-gray-500">
                    per {p.durationMinutes}-minute lesson
                  </span>
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* -------------------------------------------------------- 2. HOW OFTEN */}
      <section>
        <h2 className="font-heading font-bold text-lg text-primary mb-3">
          How often?
        </h2>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPerWeek(n)}
              aria-pressed={perWeek === n}
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-bold transition-colors",
                perWeek === n
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {n} {n === 1 ? "lesson" : "lessons"} / week
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Lessons arrive weekly and stay usable for 30 days, so a busy week
          doesn&apos;t cost you anything.
        </p>
      </section>

      {/* --------------------------------------------------------- 3. HOW LONG */}
      <section>
        <h2 className="font-heading font-bold text-lg text-primary mb-3">
          For how long?
        </h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {TERMS.map((t) => {
            const active = term === t.months;
            const row = plan?.prices.find(
              (p) => p.lessonsPerWeek === perWeek && p.termMonths === t.months
            );
            return (
              <button
                key={t.months}
                type="button"
                onClick={() => setTerm(t.months)}
                aria-pressed={active}
                className={cn(
                  "rounded-xl border-2 px-4 py-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary-50"
                    : "border-gray-100 hover:border-primary-100"
                )}
              >
                <div className="font-heading font-bold text-primary text-sm">
                  {t.label}
                </div>
                <div className="text-xs text-gray-500">{t.note}</div>
                {row && (
                  <div className="mt-1 text-sm font-bold text-gray-900">
                    {money(Math.round(row.totalCents / t.months), row.currency)}
                    <span className="font-normal text-gray-500"> / month</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- SUMMARY */}
      {price ? (
        <div className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
          {introBps > 0 && (
            <div className="flex items-center gap-2 text-secondary-700 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">
                {introBps / 100}% off your first month
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-heading font-extrabold text-3xl text-primary">
              {money(introBps > 0 ? introMonthCents : monthlyCents, price.currency)}
            </span>
            <span className="text-sm text-gray-600">
              {introBps > 0 ? "for your first month" : "per month"}
            </span>
            {introBps > 0 && (
              <span className="text-sm text-gray-500 line-through">
                {money(monthlyCents, price.currency)}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-gray-600">
            {perWeek} {perWeek === 1 ? "lesson" : "lessons"} a week — about{" "}
            {Math.round(perWeek * WEEKS_PER_MONTH)} lessons a month.
            {introBps > 0 && (
              <> Then {money(monthlyCents, price.currency)} a month, cancel any time.</>
            )}
            {term > 1 && (
              <>
                {" "}
                Billed {money(price.totalCents, price.currency)} for {term} months.
              </>
            )}
          </p>

          {!price.buyable && (
            <p className="mt-3 text-sm font-semibold text-red-700">
              This combination isn&apos;t on sale yet — pick another, or contact us.
            </p>
          )}

          {error && (
            <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
          )}

          <button
            type="button"
            onClick={subscribe}
            disabled={busy || !price.buyable}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-heading font-bold hover:bg-primary-600 disabled:opacity-60 transition-colors"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? "Taking you to checkout…" : "Start learning"}
          </button>

          <p className="mt-2 text-center text-xs text-gray-500">
            Secure checkout by Stripe. Cancel any time from your account.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          We don&apos;t offer that combination yet — try a different number of
          lessons per week.
        </p>
      )}
    </div>
  );
}
