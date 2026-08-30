"use client";

// The buy button, in the landing page's own visual language.
//
// It is a <button> that POSTs, not an <a href="/checkout/...">: the checkout
// session is priced on the server (the client only ever names a SKU) and Stripe
// returns the URL to send them to. A hardcoded checkout link would either 404
// or, worse, let the price be set from the page.

import { useState } from "react";

export function WorkbookCta({
  label = "Get the workbook — $27",
  className = "btn btn-primary btn-lg",
  block,
}: {
  label?: string;
  className?: string;
  block?: boolean;
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
      if (json?.url) { window.location.href = json.url; return; }
      setError(json?.error || "Couldn't open checkout. Please try again.");
    } catch {
      setError("Couldn't open checkout. Please try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <button
        onClick={buy}
        disabled={busy}
        className={className}
        style={block ? { width: "100%" } : undefined}
      >
        {busy ? "Opening checkout…" : label}
      </button>
      {error && <p role="alert" className="cta-error">{error}</p>}
    </>
  );
}
