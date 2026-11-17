// FrancoLink for Business — the one place the B2B offer and its prices live.
//
// Self-study seats only (docs/PLAN-business.md). Live lessons for businesses are
// not planned yet, so nothing here may promise tutors, cohorts or group classes.
//
// Prices are DRAFT until the founder approves them (PLAN-business.md §8). Change
// them here and /business, the contact form and the pricing sheet all follow.

export const BUSINESS_CONTACT_TOPIC = "Teams, schools & partners";

/** A seat is Premium self-study for one named learner for 12 months. */
export const TEAM_SEAT_TIERS = [
  { range: "5–49 learners", pricePerYear: 79 },
  { range: "50–199 learners", pricePerYear: 59 },
  { range: "200+ learners", pricePerYear: null }, // quoted
] as const;

export const TEAM_MIN_SEATS = 5;

export const SCHOOL_SEAT_PRICE = 15;
export const SCHOOL_MIN_SEATS = 30;

export const TEACHER_SEAT_PRICE = 20;
export const TEACHER_MIN_SEATS = 10;

export const PILOT = { days: 30, maxLearners: 10 };

/** Founding-customer offer: first N organisations, in exchange for a case study. */
export const FOUNDING_OFFER = { discountPct: 30, organisations: 10 };

/**
 * Optional scheduling link (Cal.com, Calendly…). When unset, every "book a call"
 * CTA falls back to the contact form with the business topic preselected.
 */
export const BUSINESS_BOOKING_URL =
  process.env.NEXT_PUBLIC_BUSINESS_BOOKING_URL || "";

export const BUSINESS_CONTACT_HREF = "/contact?topic=business#contact-form";

export function usd(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}
