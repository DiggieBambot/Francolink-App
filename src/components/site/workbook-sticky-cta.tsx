"use client";

// Mobile buy bar. Appears once the reader is past the hero, so the top of the
// page is never cluttered by it, and hidden on desktop where the offer section
// and the closing CTA are always a short scroll away.
//
// Inline transform rather than a utility class: this project's Tailwind build
// does not emit `translate-y-full`, which once left this bar visible from first
// paint. Styling lives in the page's scoped stylesheet.

import { useState, useEffect } from "react";

export function WorkbookStickyCta({ price = "$27" }: { price?: string }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function buy() {
    setBusy(true);
    try {
      const res = await fetch("/api/checkout/workbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (json?.url) { window.location.href = json.url; return; }
    } catch { /* fall through and re-enable */ }
    setBusy(false);
  }

  return (
    <div
      className="fpap-sticky"
      aria-hidden={!show}
      style={{ transform: show ? "translateY(0)" : "translateY(115%)" }}
    >
      <div className="fpap-sticky-label">
        <span className="fpap-sticky-title">Le Français Pas à Pas</span>
        <span className="fpap-sticky-sub">PDF + interactive · 14-day guarantee</span>
      </div>
      <button
        onClick={buy}
        disabled={busy || !show}
        tabIndex={show ? 0 : -1}
        className="fpap-sticky-btn"
      >
        {busy ? "Opening…" : `Get it — ${price}`}
      </button>
    </div>
  );
}
