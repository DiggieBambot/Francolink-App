"use client";

// Fires a single analytics event on mount. Drop it into a server component to
// instrument a page view without making the whole page client-side.
// <TrackOnce event="dashboard_viewed" once="dashboard_viewed" />

import { useEffect } from "react";
import { trackEvent, type ClientEvent } from "@/lib/analytics/client";

export function TrackOnce({
  event,
  once,
  metadata,
}: {
  event: ClientEvent;
  once?: string;
  metadata?: Record<string, unknown>;
}) {
  useEffect(() => {
    trackEvent(event, { once, metadata });
  }, [event, once, metadata]);
  return null;
}
