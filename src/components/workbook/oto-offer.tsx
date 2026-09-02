"use client";

// The button that makes this a one-click upsell.
//
// It calls /api/oto/charge, which charges the card already on file. Three
// outcomes matter and each needs different words:
//
//   ok             -> charged. Straight to the workbook with the credits.
//   needsCheckout  -> the card wants its owner present (3-D Secure), or we
//                     have nothing saved. Not a decline: send them through the
//                     normal Checkout, which can show the authentication step.
//   declined       -> a real decline. Say so plainly and offer checkout.
//
// The decline path is the one worth getting right. Treating "authentication
// required" as a refusal is how funnels quietly lose sales they had already won.

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OtoOffer({
  packKey,
  priceLabel,
  lessons,
  isDownsell,
}: {
  packKey: string;
  priceLabel: string;
  lessons: number;
  isDownsell: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function accept() {
    setBusy(true);
    setNote("");
    try {
      const res = await fetch("/api/oto/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_key: packKey }),
      });
      const json = await res.json().catch(() => ({}));

      if (json?.ok) {
        router.push("/workbook?added=lessons");
        return;
      }

      if (json?.needsCheckout || json?.declined) {
        setNote(
          json.declined
            ? "That card was declined — you can use another at checkout."
            : "Your bank wants to confirm it's you. One extra step at checkout."
        );
        const r2 = await fetch("/api/checkout/starter-pack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pack_key: packKey, next: "/workbook" }),
        });
        const j2 = await r2.json().catch(() => ({}));
        if (j2?.url) { window.location.href = j2.url; return; }
        setNote("Couldn't open checkout. Please try again.");
        setBusy(false);
        return;
      }

      setNote(json?.error || "Couldn't complete that. Please try again.");
      setBusy(false);
    } catch {
      setNote("Couldn't complete that. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-7 space-y-3">
      <button
        onClick={accept}
        disabled={busy}
        className="w-full rounded-xl bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground disabled:opacity-70"
      >
        {busy ? "One moment…" : `Yes — add ${lessons} lessons for ${priceLabel}`}
      </button>

      {note && (
        <p role="status" className="text-sm text-muted-foreground">{note}</p>
      )}

      {/* A plain, unmissable decline. Hiding it behind faint grey text buys a
          few conversions and costs more in refunds and goodwill than it earns. */}
      <a
        href={isDownsell ? "/workbook" : "/oto?step=down"}
        className="block w-full py-2 text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        {isDownsell
          ? "No thanks — take me to my workbook"
          : "No thanks, I'll start with the book"}
      </a>
    </div>
  );
}
