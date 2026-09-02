"use client";

// The starter pack: three lessons, one payment, no subscription.
//
// This is the front door. It exists because a subscription is a big first ask
// of somebody who has never met the tutor — and because three lessons is the
// most we can promise to staff per signup right now. A monthly habit is the
// better product; it is not yet the honest one.
//
// Shown ABOVE the plans on /start on purpose. The cheaper, smaller commitment
// goes first: a visitor who would have bounced off a $108 monthly plan buys a
// $54 pack, and the plan conversation happens after they have met the tutor.

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { StarterPack } from "@/lib/credits/plans";
import { cn } from "@/lib/utils";

const money = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);

const TIER_BLURB: Record<string, string> = {
  professional:
    "Any tutor on FrancoLink, including our professional teachers.",
  community: "Our community tutors — fluent speakers who teach conversation.",
};

export function StarterPackPicker({
  packs,
  next,
}: {
  packs: StarterPack[];
  next?: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(packKey: string) {
    setBusy(packKey);
    setError(null);
    try {
      const res = await fetch("/api/checkout/starter-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_key: packKey, ...(next ? { next } : {}) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error || "Couldn't start checkout.");
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start checkout.");
      setBusy(null);
    }
  }

  if (packs.length === 0) return null;

  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-2">
        {packs.map((p) => {
          const perLesson = Math.round(p.priceCents / p.lessons);
          return (
            <div
              key={p.packKey}
              className="rounded-2xl border-2 border-primary-100 bg-white p-5 flex flex-col"
            >
              <div className="font-heading font-bold text-primary capitalize">
                {p.tier} — {p.lessons} lessons
              </div>
              <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                {TIER_BLURB[p.tier]}
              </p>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-heading font-extrabold text-3xl text-primary">
                  {money(p.priceCents, p.currency)}
                </span>
                <span className="text-sm text-gray-500">
                  {money(perLesson, p.currency)} a lesson
                </span>
              </div>

              <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {p.lessons} lessons of 50 minutes
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {/* The 30 days is the credit expiry, not a marketing line —
                      it is the same rule the ledger enforces. */}
                  Use them within 30 days
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  No subscription, cancel nothing
                </li>
              </ul>

              <button
                type="button"
                onClick={() => buy(p.packKey)}
                disabled={busy !== null}
                className={cn(
                  "mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-heading font-bold transition-colors disabled:opacity-60",
                  "bg-primary text-white hover:bg-primary-600"
                )}
              >
                {busy === p.packKey && <Loader2 className="w-4 h-4 animate-spin" />}
                {busy === p.packKey ? "Taking you to checkout…" : "Start with 3 lessons"}
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
      )}
    </section>
  );
}
