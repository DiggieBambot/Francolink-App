"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton({ title }: { title?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    // Native share sheet on mobile if available.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: title || "FrancoLink lesson", url });
        return;
      } catch {
        // user cancelled or unsupported → fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
