// Client-side analytics helper. Thin wrapper over POST /api/activity/event.
// Fire-and-forget: never blocks UI, never throws. Optionally de-dupes an event
// to once-per-browser via localStorage (for funnel steps like dashboard_viewed).

export type ClientEvent =
  | "signup_completed"
  | "onboarding_assigned"
  | "onboarding_goals_selected"
  | "dashboard_viewed"
  | "placement_started"
  | "placement_completed"
  | "lesson_view"
  | "homework_submitted"
  | "room_join";

interface TrackOpts {
  metadata?: Record<string, unknown>;
  /** If set, the event fires at most once per browser for this key. */
  once?: string;
}

export function trackEvent(kind: ClientEvent, opts: TrackOpts = {}): void {
  try {
    if (opts.once) {
      const key = `fl_evt:${opts.once}`;
      if (typeof window !== "undefined" && window.localStorage.getItem(key)) return;
      if (typeof window !== "undefined") window.localStorage.setItem(key, "1");
    }
    void fetch("/api/activity/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, metadata: opts.metadata }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
