// src/lib/currencies.ts

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  position: "before" | "after";
  decimals: number;
  stripeSupported: boolean;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  // ── North America ──
  USD: { code: "USD", symbol: "$",    name: "US Dollar",        position: "before", decimals: 2, stripeSupported: true },
  CAD: { code: "CAD", symbol: "C$",   name: "Canadian Dollar",  position: "before", decimals: 2, stripeSupported: true },
  MXN: { code: "MXN", symbol: "MX$",  name: "Mexican Peso",     position: "before", decimals: 2, stripeSupported: true },

  // ── Europe ──
  EUR: { code: "EUR", symbol: "€",    name: "Euro",             position: "after",  decimals: 2, stripeSupported: true },
  GBP: { code: "GBP", symbol: "£",    name: "British Pound",    position: "before", decimals: 2, stripeSupported: true },

  // ── South America ──
  BRL: { code: "BRL", symbol: "R$",   name: "Brazilian Real",   position: "before", decimals: 2, stripeSupported: true },
  COP: { code: "COP", symbol: "COL$", name: "Colombian Peso",   position: "before", decimals: 0, stripeSupported: true },
  ARS: { code: "ARS", symbol: "AR$",  name: "Argentine Peso",   position: "before", decimals: 0, stripeSupported: false },
  CLP: { code: "CLP", symbol: "CL$",  name: "Chilean Peso",     position: "before", decimals: 0, stripeSupported: true },

  // ── Middle East ──
  AED: { code: "AED", symbol: "د.إ",  name: "UAE Dirham",       position: "after",  decimals: 2, stripeSupported: true },
  SAR: { code: "SAR", symbol: "﷼",   name: "Saudi Riyal",      position: "after",  decimals: 2, stripeSupported: true },
  QAR: { code: "QAR", symbol: "ر.ق",  name: "Qatari Riyal",    position: "after",  decimals: 2, stripeSupported: true },
  KWD: { code: "KWD", symbol: "د.ك",  name: "Kuwaiti Dinar",   position: "after",  decimals: 3, stripeSupported: true },

  // ── Asia ──
  JPY: { code: "JPY", symbol: "¥",    name: "Japanese Yen",     position: "before", decimals: 0, stripeSupported: true },
  KRW: { code: "KRW", symbol: "₩",    name: "South Korean Won", position: "before", decimals: 0, stripeSupported: true },
  CNY: { code: "CNY", symbol: "¥",    name: "Chinese Yuan",     position: "before", decimals: 2, stripeSupported: false },
  INR: { code: "INR", symbol: "₹",    name: "Indian Rupee",     position: "before", decimals: 2, stripeSupported: true },
  SGD: { code: "SGD", symbol: "S$",   name: "Singapore Dollar", position: "before", decimals: 2, stripeSupported: true },
  MYR: { code: "MYR", symbol: "RM",   name: "Malaysian Ringgit",position: "before", decimals: 2, stripeSupported: true },
  THB: { code: "THB", symbol: "฿",    name: "Thai Baht",        position: "before", decimals: 2, stripeSupported: true },
  IDR: { code: "IDR", symbol: "Rp",   name: "Indonesian Rupiah",position: "before", decimals: 0, stripeSupported: true },
  PHP: { code: "PHP", symbol: "₱",    name: "Philippine Peso",  position: "before", decimals: 2, stripeSupported: true },

  // ── Oceania ──
  AUD: { code: "AUD", symbol: "A$",   name: "Australian Dollar",position: "before", decimals: 2, stripeSupported: true },
};

export const DEFAULT_CURRENCY = "USD";

export function formatPrice(amount: number, currencyCode: string): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY];

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);

  if (config.position === "before") {
    return `${config.symbol}${formatted}`;
  }
  return `${formatted} ${config.symbol}`;
}

export function getActiveCurrencyCodes(): string[] {
  return Object.keys(CURRENCIES);
}