// Small presentation helpers shared by the marketing site.

export const LANGUAGE_LABEL: Record<string, string> = {
  fr: "French",
  en: "English",
  es: "Spanish",
  de: "German",
  ar: "Arabic",
  it: "Italian",
  pt: "Portuguese",
};

export const WEEKDAY_LABEL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** 570 → "09:30" */
export function formatMinute(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 2500, "EUR" → "€25" (rates are whole units far more often than not). */
export function formatRate(cents: number, currency = "EUR"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Turns whatever a tutor pasted into a URL an <iframe> can actually show.
 *
 * Tutors paste the link from the share button — `youtu.be/ID`, a watch URL, a
 * Shorts URL — and YouTube refuses to frame any of those, so the profile
 * showed an empty grey box. Anything we don't recognise is returned as-is;
 * an already-correct embed URL passes straight through.
 *
 * Returns null for an empty or unparseable value, so callers can skip the
 * player entirely rather than render a broken frame.
 */
export function embedVideoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const youtubeId =
    host === "youtu.be"
      ? parsed.pathname.slice(1)
      : host.endsWith("youtube.com")
        ? parsed.searchParams.get("v") ||
          parsed.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1] ||
          null
        : null;
  if (youtubeId) {
    // youtube-nocookie keeps the profile from setting ad cookies on load.
    return `https://www.youtube-nocookie.com/embed/${youtubeId}`;
  }

  if (host === "vimeo.com") {
    const id = parsed.pathname.match(/\/(\d+)/)?.[1];
    if (id) return `https://player.vimeo.com/video/${id}`;
  }

  return parsed.toString();
}
