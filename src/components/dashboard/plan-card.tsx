"use client";

// The student's plan, on the dashboard where they actually live.
//
// Upgrading used to be reachable only through the dismissible pop-up or a walk
// to /pricing, so a student who snoozed the modal once never saw an upgrade path
// again. This card is permanent: it always says which plan they are on, and for
// anyone below the top plan it puts real prices and a checkout button in reach.

import { useState } from "react";
import Link from "next/link";
import { Check, Crown, Sparkles } from "lucide-react";
import { CheckoutButton } from "@/components/pricing/checkout-button";

export interface PlanPrices {
  premiumMonthly: number;
  premiumYearly: number;
  premiumPlusMonthly: number;
  premiumPlusYearly: number;
}

const PERKS: Record<"premium" | "premium_plus", string[]> = {
  premium: [
    "Unlimited lessons, all levels",
    "300 AI Tutor messages a month",
    "Offline mode & priority support",
  ],
  premium_plus: [
    "Everything in Premium",
    "1,500 AI Tutor messages a month",
    "Advanced pronunciation analysis",
  ],
};

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function PlanCard({
  plan,
  prices,
}: {
  plan?: string | null;
  prices: PlanPrices;
}) {
  const [yearly, setYearly] = useState(false);

  const current = (plan || "FREE").toUpperCase();
  const isFree = current === "FREE";
  const isPlus = current === "PREMIUM_PLUS";

  const label = isPlus ? "Premium+" : current === "PREMIUM" ? "Premium" : "Free";

  // A Premium student is only ever offered the one upgrade above them.
  const offers = (isFree
    ? (["premium", "premium_plus"] as const)
    : (["premium_plus"] as const)
  ).map((key) => ({
    key,
    name: key === "premium" ? "Premium" : "Premium+",
    monthly: key === "premium" ? prices.premiumMonthly : prices.premiumPlusMonthly,
    yearlyPrice: key === "premium" ? prices.premiumYearly : prices.premiumPlusYearly,
    accent: key === "premium" ? "bg-secondary hover:bg-secondary-600" : "bg-primary hover:bg-primary-800",
  }));

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Your plan
          </p>
          <p className="mt-0.5 font-heading text-lg font-bold text-primary">
            {label}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
            isFree ? "bg-gray-100 text-gray-500" : "bg-secondary text-white"
          }`}
        >
          <Crown className="h-3 w-3" />
          {label}
        </span>
      </div>

      {isPlus ? (
        <p className="mt-4 text-sm leading-relaxed text-gray-500">
          You&apos;re on the top plan — everything is unlocked. Thank you for
          supporting FrancoLink.
        </p>
      ) : (
        <>
          {/* Billing period */}
          <div className="mt-4 flex rounded-xl bg-gray-100 p-1">
            {([false, true] as const).map((y) => (
              <button
                key={String(y)}
                onClick={() => setYearly(y)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  yearly === y
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {y ? "Yearly · save 37%" : "Monthly"}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-5">
            {offers.map((offer) => (
              <div key={offer.key}>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-2xl font-extrabold text-primary">
                    {money(yearly ? offer.yearlyPrice : offer.monthly)}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    /{yearly ? "year" : "month"}
                  </span>
                </div>

                <ul className="mt-3 space-y-2">
                  {PERKS[offer.key].map((perk) => (
                    <li
                      key={perk}
                      className="flex items-start gap-2.5 text-sm text-gray-600"
                    >
                      <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-secondary-100">
                        <Check
                          className="h-2.5 w-2.5 text-secondary-700"
                          strokeWidth={3}
                        />
                      </span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <CheckoutButton
                  plan={offer.key}
                  billingPeriod={yearly ? "yearly" : "monthly"}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-heading text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${offer.accent}`}
                >
                  <Sparkles className="h-4 w-4" />
                  {isFree ? `Get ${offer.name}` : `Upgrade to ${offer.name}`}
                </CheckoutButton>
              </div>
            ))}
          </div>

          <Link
            href="/pricing"
            className="mt-4 block text-center text-xs font-semibold text-gray-400 transition hover:text-gray-600"
          >
            Compare all plans
          </Link>
        </>
      )}
    </div>
  );
}
