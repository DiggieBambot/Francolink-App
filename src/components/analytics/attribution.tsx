"use client";

import { useEffect } from "react";

const COOKIE = "fl_attrib";

// Sets a FIRST-TOUCH attribution cookie the first time a visitor lands (utm
// params + referrer + landing path), so their acquisition source survives all
// the way to signup. Never overwrites an existing cookie.
export function AttributionCookie() {
  useEffect(() => {
    try {
      if (document.cookie.split("; ").some((c) => c.startsWith(COOKIE + "="))) return;

      const q = new URLSearchParams(window.location.search);
      const ref = document.referrer || "";
      let referrerHost = "";
      try { referrerHost = ref ? new URL(ref).hostname : ""; } catch {}

      const data = {
        utm_source: q.get("utm_source") || "",
        utm_medium: q.get("utm_medium") || "",
        utm_campaign: q.get("utm_campaign") || "",
        utm_term: q.get("utm_term") || "",
        utm_content: q.get("utm_content") || "",
        landing: window.location.pathname,
        referrer_host: referrerHost,
      };

      const value = encodeURIComponent(JSON.stringify(data));
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `${COOKIE}=${value}; path=/; max-age=${oneYear}; samesite=lax`;
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}

// Persists the first-touch cookie onto the signed-in user's row (once). Mounted
// in authenticated layouts so it runs right after signup.
export function AttributionCapture() {
  useEffect(() => {
    try {
      if (localStorage.getItem("fl_attrib_done") === "1") return;
    } catch {}
    fetch("/api/attribution/capture", { method: "POST" })
      .then((r) => r.json())
      .then((d) => { if (d?.ok || d?.skipped) { try { localStorage.setItem("fl_attrib_done", "1"); } catch {} } })
      .catch(() => {});
  }, []);

  return null;
}
