// Growth-team outreach logging helpers.
//
// The point of the tracking code: instead of a self-reported "converted"
// checkbox, every outreach row carries a unique code that rides along in the
// shared link as utm_content. The existing first-touch attribution capture
// writes that onto users.utm_content at signup, so conversions per outreach
// row become a real join instead of a claim.

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.francolink.net";

export const OUTREACH_PLATFORMS = [
  { value: "facebook", label: "Facebook Group" },
  { value: "reddit", label: "Reddit" },
  { value: "instagram", label: "Instagram DM" },
  { value: "tiktok", label: "TikTok DM" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "forum", label: "Forum / Blog" },
  { value: "other", label: "Other" },
] as const;

export type OutreachPlatform = (typeof OUTREACH_PLATFORMS)[number]["value"];

export const PLATFORM_LABEL: Record<string, string> = Object.fromEntries(
  OUTREACH_PLATFORMS.map((p) => [p.value, p.label])
);

/** Common landing pages she'll want to point people at. */
export const OUTREACH_DESTINATIONS = [
  { value: "/", label: "Home page" },
  { value: "/become-tutor", label: "Teach your own students" },
  { value: "/library", label: "Lesson library" },
  { value: "/tutors", label: "Find a tutor" },
  { value: "/pricing", label: "Pricing" },
] as const;

// Unambiguous alphabet (no 0/O/1/I/l) — these codes get read aloud and retyped.
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Short, unique-enough, human-readable tracking code (uniqueness enforced by a DB constraint). */
export function generateTrackingCode(): string {
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/** The link the manager actually shares — carries the code as utm_content. */
export function buildTrackedUrl(args: {
  destinationPath: string;
  platform: string;
  trackingCode: string;
}): string {
  const path = args.destinationPath.startsWith("/") ? args.destinationPath : `/${args.destinationPath}`;
  const url = new URL(path, APP_URL);
  url.searchParams.set("utm_source", "outreach");
  url.searchParams.set("utm_medium", args.platform);
  url.searchParams.set("utm_campaign", "growth_outreach");
  url.searchParams.set("utm_content", args.trackingCode);
  return url.toString();
}

/** Minimal RFC-4180 CSV — avoids pulling in a dependency for ~15 lines. */
export function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map(escape).join(",");
  const body = rows.map((r) => columns.map((c) => escape(r[c])).join(",")).join("\r\n");
  return body ? `${header}\r\n${body}` : header;
}
