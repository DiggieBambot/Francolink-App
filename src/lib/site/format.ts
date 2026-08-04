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
