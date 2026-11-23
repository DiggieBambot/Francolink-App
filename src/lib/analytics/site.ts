// Funnel events from the public website (francolink.net), sent to Google
// Analytics 4 — the site already loads gtag.js (components/shared/
// google-analytics.tsx). The app's own /api/activity/event can't take these:
// it needs a signed-in user, and most directory visitors aren't one.
//
// Events (all prefixed "tutor_"):
//   tutor_match_shown     the "help me choose" card appeared
//   tutor_match_applied   answers applied        { lang, level, band, goal, results }
//   tutor_match_skipped   closed / "browse all"
//   tutor_profile_opened  a tutor clicked in the list { slug, via: "match" | "browse" }
//   tutor_booking_started a slot picked on a profile { slug, duration }
//
// Fire-and-forget: never throws, a no-op where GA isn't loaded.

type Params = Record<string, string | number | boolean | null | undefined>;

export function trackSite(event: string, params: Params = {}): void {
  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    w.gtag?.("event", event, params);
  } catch {
    /* ignore */
  }
}
