"use client";

import { useEffect } from "react";

// Fires a single activity ping per calendar day (throttled via localStorage) so
// we can measure DAU/WAU/MAU and cohort retention without hammering the DB.
export function ActivityPinger() {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    let last: string | null = null;
    try { last = localStorage.getItem("fl_active_ping"); } catch {}
    if (last === today) return;

    let tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch {}

    fetch("/api/activity/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tz }),
    })
      .then((r) => { if (r.ok) { try { localStorage.setItem("fl_active_ping", today); } catch {} } })
      .catch(() => {});
  }, []);

  return null;
}
