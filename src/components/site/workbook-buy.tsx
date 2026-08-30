"use client";

// The buy button. Posts to /api/checkout/workbook and hands off to Stripe.
//
// No email field, no account step, no modal. The whole argument of PRD §8.2 is
// that a stranger should be able to go from this button to a card form in one
// click; Stripe collects the email, and the account is created at delivery.

import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkbookBuy({
  label = "Get the workbook — $27",
  className,
  variant = "primary",
}: {
  label?: string;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/workbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (json?.url) {
        window.location.href = json.url;
        return;
      }
      setError(json?.error || "Couldn't open checkout. Please try again.");
    } catch {
      setError("Couldn't open checkout. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <button
        onClick={buy}
        disabled={busy}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-bold transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70",
          variant === "primary"
            ? "bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-800"
            : "bg-secondary text-primary-900 shadow-lg shadow-secondary/20 hover:bg-secondary-400"
        )}
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {label}
        {!busy && <ArrowRight className="h-5 w-5" />}
      </button>
      <p className="text-sm text-gray-500">
        One payment. 14-day money-back guarantee.
      </p>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
