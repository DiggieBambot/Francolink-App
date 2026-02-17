// src/lib/geo.ts
import { headers } from "next/headers";

export interface GeoInfo {
  country: string;
  currency: string;
}

// ------------------------------------------------------------------
// Country → Currency mapping
// ------------------------------------------------------------------

const COUNTRY_CURRENCY: Record<string, string> = {
  // ── North America ──
  US: "USD",
  CA: "CAD",
  MX: "MXN",

  // ── Europe (Eurozone) ──
  FR: "EUR",
  DE: "EUR",
  ES: "EUR",
  IT: "EUR",
  BE: "EUR",
  NL: "EUR",
  PT: "EUR",
  AT: "EUR",
  IE: "EUR",
  FI: "EUR",
  GR: "EUR",
  LU: "EUR",
  SK: "EUR",
  SI: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
  MT: "EUR",
  CY: "EUR",

  // ── Europe (Non-Euro) ──
  GB: "GBP",

  // ── South America ──
  BR: "BRL",
  CO: "COP",
  AR: "ARS",
  CL: "CLP",
  PE: "USD", // Peru — USD widely used
  EC: "USD", // Ecuador — uses USD
  UY: "USD", // Uruguay — fallback USD
  VE: "USD", // Venezuela — fallback USD
  PY: "USD", // Paraguay — fallback USD
  BO: "USD", // Bolivia — fallback USD

  // ── Middle East (Arabic) ──
  AE: "AED",
  SA: "SAR",
  QA: "QAR",
  KW: "KWD",
  BH: "USD", // Bahrain — pegged to USD
  OM: "USD", // Oman — fallback USD
  JO: "USD", // Jordan — fallback USD
  LB: "USD", // Lebanon — fallback USD
  IQ: "USD", // Iraq — fallback USD
  EG: "USD", // Egypt — fallback USD

  // ── Asia ──
  JP: "JPY",
  KR: "KRW",
  CN: "CNY",
  HK: "USD", // HK Dollar pegged to USD
  TW: "USD", // Taiwan — fallback USD
  IN: "INR",
  SG: "SGD",
  MY: "MYR",
  TH: "THB",
  ID: "IDR",
  PH: "PHP",
  VN: "USD", // Vietnam — fallback USD
  PK: "USD", // Pakistan — fallback USD
  BD: "USD", // Bangladesh — fallback USD

  // ── Oceania ──
  AU: "AUD",
  NZ: "AUD", // Close enough, or use NZD if you add it
};

const DEFAULT_CURRENCY = "USD";

// ------------------------------------------------------------------
// Detect user's country from request headers
// ------------------------------------------------------------------

export async function detectUserGeo(): Promise<GeoInfo> {
  try {
    const headersList = await headers();

    // Platform-specific headers (free, no API call)
    const country =
      headersList.get("x-vercel-ip-country") || // Vercel
      headersList.get("cf-ipcountry") ||         // Cloudflare
      headersList.get("x-country-code") ||       // Custom proxy
      null;

    if (country && country !== "XX") {
      const code = country.toUpperCase();
      return {
        country: code,
        currency: COUNTRY_CURRENCY[code] || DEFAULT_CURRENCY,
      };
    }
  } catch (error) {
    console.warn("Geo detection failed:", error);
  }

  return { country: "US", currency: DEFAULT_CURRENCY };
}