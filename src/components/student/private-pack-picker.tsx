"use client";

// The buy button for a private pack. Same shape as StarterPackPicker, minus
// the tier pitch: this student has already met their tutor.

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { PrivatePack } from "@/lib/credits/private-packs";

const money = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);

export function PrivatePackPicker({
  packs,
  token,
  signupHref,
}: {
  packs: PrivatePack[];
  /** The secret link's token, when the page was opened from one. */
  token?: string;
  /** Set when signed out: the button sends them to sign up instead. */
  signupHref?: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(packKey: string) {
    setBusy(packKey);
    setError(null);
    try {
      const res = await fetch("/api/checkout/private-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pack_key: packKey,
          ...(token ? { token } : {}),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url)
        throw new Error(body.error || "Couldn't start checkout.");
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start checkout.");
      setBusy(null);
    }
  }

  return (
    <section className="space-y-3">
      {packs.map((p) => {
        const perLesson = Math.round(p.priceCents / p.lessons);
        // Only claim a saving if there is one.
        const list =
          p.listLessonCents && p.listLessonCents > perLesson
            ? p.listLessonCents
            : null;
        return (
          <div
            key={p.packKey}
            className="rounded-2xl border-2 border-primary-100 bg-white p-5 flex flex-col"
          >
            <div className="font-heading font-bold text-primary">
              {p.lessons} lessons
            </div>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
              {list && (
                <span className="text-lg text-gray-400 line-through">
                  {money(list * p.lessons, p.currency)}
                </span>
              )}
              <span className="font-heading font-extrabold text-3xl text-primary">
                {money(p.priceCents, p.currency)}
              </span>
              <span className="text-sm text-gray-500">
                {list && (
                  <span className="line-through mr-1">
                    {money(list, p.currency)}
                  </span>
                )}
                {money(perLesson, p.currency)} a lesson
              </span>
            </div>
            {list && (
              <div className="mt-2 inline-flex self-start rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                You save {money(list * p.lessons - p.priceCents, p.currency)} on
                the regular price
              </div>
            )}

            <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                {p.lessons} lessons of 50 minutes
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                Use them within {p.creditDays ?? 30} days
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                No subscription. Buy the next block when you need it
              </li>
            </ul>

            {signupHref ? (
              <a
                href={signupHref}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-heading font-bold transition-colors bg-primary text-white hover:bg-primary-600"
              >
                Create an account to buy
              </a>
            ) : (
              <button
                type="button"
                onClick={() => buy(p.packKey)}
                disabled={busy !== null}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-heading font-bold transition-colors disabled:opacity-60 bg-primary text-white hover:bg-primary-600"
              >
                {busy === p.packKey && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {busy === p.packKey
                  ? "Taking you to checkout…"
                  : `Buy ${p.lessons} lessons`}
              </button>
            )}
          </div>
        );
      })}

      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
    </section>
  );
}
