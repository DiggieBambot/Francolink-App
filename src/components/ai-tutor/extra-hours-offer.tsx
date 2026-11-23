"use client";

import { useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { AI_TUTOR_HOUR_PACKS, type AiTutorHourPackKey } from "@/lib/config/subscription";

function price(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * "Add extra hours" — shown when a student runs out of AI tutoring time (or
 * asks for more). Sends them to Stripe Checkout; the webhook adds the hours.
 */
export function ExtraHoursOffer({
  reason,
  tone = "light",
}: {
  reason?: string | null;
  /** "dark" for use on the full-screen session background. */
  tone?: "light" | "dark";
}) {
  const [busy, setBusy] = useState<AiTutorHourPackKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (pack: AiTutorHourPackKey) => {
    setBusy(pack);
    setError(null);
    try {
      const res = await fetch("/api/checkout/ai-tutor-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Couldn't start checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout.");
      setBusy(null);
    }
  };

  const dark = tone === "dark";

  return (
    <div
      className={`rounded-2xl border p-4 ${
        dark ? "border-white/20 bg-white/10 text-white" : "border-amber-200 bg-amber-50 text-gray-900"
      }`}
    >
      <div className="flex items-start gap-2">
        <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${dark ? "text-white/80" : "text-amber-600"}`} />
        <p className={`text-sm ${dark ? "text-white/90" : "text-amber-900"}`}>
          {reason || "Need more time with Leon? Add extra AI tutoring hours."}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(Object.keys(AI_TUTOR_HOUR_PACKS) as AiTutorHourPackKey[]).map((key) => {
          const pack = AI_TUTOR_HOUR_PACKS[key];
          const perHour = pack.priceCents / pack.hours;
          return (
            <button
              key={key}
              onClick={() => buy(key)}
              disabled={busy !== null}
              className={`rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-60 ${
                dark
                  ? "bg-white text-gray-900 hover:bg-white/90"
                  : "bg-white border border-amber-200 hover:border-amber-400"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm">{pack.label}</span>
                {busy === key && <Loader2 className="w-4 h-4 animate-spin" />}
              </span>
              <span className="block text-sm">{price(pack.priceCents)}</span>
              {pack.hours > 1 && (
                <span className="block text-[11px] text-green-700">{price(perHour)} per hour</span>
              )}
            </button>
          );
        })}
      </div>
      <p className={`mt-2 text-[11px] ${dark ? "text-white/60" : "text-amber-800/70"}`}>
        Extra hours are used once your plan&apos;s daily or monthly time runs out.
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
