"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, Check, Crown } from "lucide-react";

const DISMISS_KEY = "fl_subscribe_prompt_dismissed_at";
const SNOOZE_DAYS = 3;

// Brand-styled upsell shown to FREE students: go Premium to unlock the full
// self-study experience. Dismissible; snoozed for a few days via localStorage
// so it never nags.
export function SubscribePrompt({ plan }: { plan?: string }) {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);

  const isFree = !plan || plan === "FREE";

  useEffect(() => {
    if (!isFree) return;
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (Date.now() - at < SNOOZE_DAYS * 86400_000) return;
    } catch {}
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, [isFree]);

  function dismiss() {
    setClosing(true);
    setTimeout(() => setShow(false), 180);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  }

  if (!isFree || !show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <div
        className={`absolute inset-0 bg-primary-900/60 backdrop-blur-[2px] transition-opacity duration-200 ${closing ? "opacity-0" : "opacity-100"}`}
        onClick={dismiss}
      />
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-200 ${closing ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}
      >
        {/* Header — brand navy with subtle decorative rings + orange accent */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-800 px-7 pb-7 pt-6 text-white">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full border-[10px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-14 -left-8 h-36 w-36 rounded-full border-[10px] border-secondary/20" />

          <button
            onClick={dismiss}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
            <Crown className="h-3 w-3" /> Premium
          </span>

          <h2 className="mt-4 font-heading text-[26px] font-extrabold leading-tight">
            Learn on your own, <span className="text-secondary-300">anytime</span>
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-primary-100">
            Unlock the full self-study experience — the whole library, at your pace.
          </p>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          <ul className="mb-6 space-y-3">
            {[
              "Unlimited daily lessons from the full library",
              "AI Tutor to practise speaking anytime",
              "Extra practice, games & progress tracking",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-secondary-100">
                  <Check className="h-3 w-3 text-secondary-700" strokeWidth={3} />
                </span>
                <span className="font-medium">{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/pricing"
            onClick={dismiss}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-center font-heading text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-secondary-600 hover:shadow-md active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
            See Premium plans
          </Link>
          <button
            onClick={dismiss}
            className="mt-3 block w-full text-center text-xs font-semibold text-gray-400 transition hover:text-gray-600"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
