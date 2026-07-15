"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, Check } from "lucide-react";

const DISMISS_KEY = "fl_subscribe_prompt_dismissed_at";
const SNOOZE_DAYS = 3;

// A gentle upsell shown to FREE students: subscribe to unlock self-learning
// material (AI tutor, unlimited daily lessons, practice). Dismissible; snoozed
// for a few days via localStorage so it never nags.
export function SubscribePrompt({ plan }: { plan?: string }) {
  const [show, setShow] = useState(false);

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
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  }

  if (!isFree || !show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={dismiss} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-800">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-6 text-white">
          <button onClick={dismiss} className="absolute right-3 top-3 rounded-lg p-1.5 text-white/80 hover:bg-white/15" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
            <Sparkles className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-xl font-bold">Learn on your own, anytime</h2>
          <p className="mt-1 text-sm text-purple-100">
            Go Premium to unlock the full self-study experience — no tutor needed.
          </p>
        </div>

        <div className="p-6">
          <ul className="mb-5 space-y-2.5 text-sm text-gray-700 dark:text-gray-200">
            {[
              "Unlimited daily lessons from the full library",
              "AI Tutor to practise speaking anytime",
              "Extra practice, games & progress tracking",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/pricing"
            onClick={dismiss}
            className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-800"
          >
            See plans
          </Link>
          <button onClick={dismiss} className="mt-2 block w-full text-center text-xs font-medium text-gray-400 hover:text-gray-600">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
