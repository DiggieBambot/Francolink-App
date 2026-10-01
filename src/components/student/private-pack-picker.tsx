"use client";

// The buy button for a private pack. Same shape as StarterPackPicker, minus
// the tier pitch: this student has already met their tutor.

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { PrivatePack } from "@/lib/credits/private-packs";
import { RATE_COPY, type RateLang } from "@/lib/credits/private-rate-copy";

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
  lang = "en",
}: {
  packs: PrivatePack[];
  /** The secret link's token, when the page was opened from one. */
  token?: string;
  /** Set when signed out: the button sends them to sign up instead. */
  signupHref?: string;
  lang?: RateLang;
}) {
  const t = RATE_COPY[lang];
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(packKey: string) {
    setBusy(packKey);
    setError(null);
    try {
      const res = await fetch("/api/checkout/private-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_key: packKey, ...(token ? { token } : {}) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error(body.error || t.checkoutError);
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.checkoutError);
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
        const days = p.creditDays ?? 30;
        const buttonClass =
          "mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-heading font-bold transition-colors disabled:opacity-60 bg-primary text-white hover:bg-primary-600";
        return (
          <div
            key={p.packKey}
            className="rounded-2xl border-2 border-primary-100 bg-white p-5 flex flex-col"
          >
            <div className="font-heading font-bold text-primary">
              {t.lessons(p.lessons)}
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
                {money(perLesson, p.currency)} {t.aLesson}
              </span>
            </div>
            {list && (
              <div className="mt-2 inline-flex self-start rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                {t.youSave(money(list * p.lessons - p.priceCents, p.currency))}
              </div>
            )}

            <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
              {[t.lessonLength(p.lessons), t.useWithin(days), t.noSubscription].map(
                (line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {line}
                  </li>
                ),
              )}
            </ul>

            {signupHref ? (
              <a href={signupHref} className={buttonClass}>
                {t.createAccount}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => buy(p.packKey)}
                disabled={busy !== null}
                className={buttonClass}
              >
                {busy === p.packKey && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {busy === p.packKey ? t.redirecting : t.buy(p.lessons)}
              </button>
            )}
          </div>
        );
      })}

      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
    </section>
  );
}
