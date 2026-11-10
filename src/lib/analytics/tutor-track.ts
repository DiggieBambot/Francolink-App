// Client-side recorder for the tutor marketplace journey.
//
// One call writes the step to our own table (via /api/tutors/track, which
// works for anonymous visitors) and sends the matching Google Analytics event,
// so both tell the same story. Fire-and-forget: never blocks, never throws.

export type TutorEventKind =
  | "directory_view"
  | "profile_view"
  | "slot_selected"
  | "favorite_added"
  | "favorite_removed"
  | "message_started";

const GA_NAME: Record<TutorEventKind, string> = {
  directory_view: "tutor_directory_viewed",
  profile_view: "tutor_profile_viewed",
  slot_selected: "slot_selected",
  favorite_added: "tutor_favorited",
  favorite_removed: "tutor_unfavorited",
  message_started: "tutor_message_started",
};

export function trackTutorEvent(kind: TutorEventKind, slug?: string): void {
  if (typeof window === "undefined") return;
  try {
    const utm = new URLSearchParams(window.location.search).get("utm_source") || undefined;
    void fetch("/api/tutors/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, slug, ref: document.referrer || undefined, utm }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {});

    const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    if (gtag) gtag("event", GA_NAME[kind], slug ? { tutor_slug: slug } : {});
  } catch {
    /* analytics must never break the page */
  }
}
