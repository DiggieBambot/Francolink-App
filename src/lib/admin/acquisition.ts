// How a user got here, in the shape the admin screens want it.
//
// The raw first-touch fields are written once at signup by
// /api/attribution/capture; tutor referrals land in users.referred_by_tutor_id
// (set by the invite-code and room-join flows). This module is the one place
// that turns those columns into a label, so the users list, the user detail
// page and the tutor roster all say the same thing.

/** The buckets /api/attribution/capture writes into users.signup_source. */
export const ACQUISITION_SOURCES = [
  "organic",
  "paid",
  "social",
  "referral",
  "direct",
  "other",
] as const;

export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];

const LABELS: Record<string, string> = {
  organic: "Organic search",
  paid: "Paid",
  social: "Social",
  referral: "Referral",
  direct: "Direct",
  other: "Other",
};

const STYLES: Record<string, string> = {
  organic: "bg-emerald-100 text-emerald-700",
  paid: "bg-rose-100 text-rose-700",
  social: "bg-sky-100 text-sky-700",
  referral: "bg-amber-100 text-amber-700",
  direct: "bg-slate-100 text-slate-700",
  other: "bg-gray-100 text-gray-600",
  unknown: "bg-gray-100 text-gray-400",
};

export function sourceLabel(source: string | null | undefined): string {
  if (!source) return "Unknown";
  return LABELS[source] ?? source;
}

export function sourceStyle(source: string | null | undefined): string {
  return STYLES[source || "unknown"] ?? STYLES.unknown;
}

/** The row fields every "where did they come from" view reads. */
export interface AttributionFields {
  signup_source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  landing_path?: string | null;
  referrer_host?: string | null;
  referred_by_tutor_id?: string | null;
}

/**
 * One line of detail under the source badge: the tutor who referred them wins,
 * because that is the answer people actually want, then the campaign, then the
 * raw referring host.
 */
export function sourceDetail(
  u: AttributionFields,
  tutorName?: string | null
): string | null {
  if (u.referred_by_tutor_id) return `via ${tutorName || "a tutor"}`;
  if (u.utm_campaign) return u.utm_campaign;
  if (u.utm_source) return u.utm_source;
  if (u.referrer_host) return u.referrer_host;
  return null;
}
