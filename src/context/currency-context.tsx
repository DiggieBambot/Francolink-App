// src/context/currency-context.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// ------------------------------------------------------------------
// Currency Config
// ------------------------------------------------------------------

interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  position: "before" | "after";
  decimals: number;
}

const CURRENCIES: Record<string, CurrencyConfig> = {
  // ── North America ──
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    position: "before",
    decimals: 2,
  },
  CAD: {
    code: "CAD",
    symbol: "C$",
    name: "Canadian Dollar",
    position: "before",
    decimals: 2,
  },
  MXN: {
    code: "MXN",
    symbol: "MX$",
    name: "Mexican Peso",
    position: "before",
    decimals: 2,
  },

  // ── Europe ──
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    position: "after",
    decimals: 2,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    position: "before",
    decimals: 2,
  },

  // ── South America ──
  BRL: {
    code: "BRL",
    symbol: "R$",
    name: "Brazilian Real",
    position: "before",
    decimals: 2,
  },
  COP: {
    code: "COP",
    symbol: "COL$",
    name: "Colombian Peso",
    position: "before",
    decimals: 0,
  },
  ARS: {
    code: "ARS",
    symbol: "AR$",
    name: "Argentine Peso",
    position: "before",
    decimals: 0,
  },
  CLP: {
    code: "CLP",
    symbol: "CL$",
    name: "Chilean Peso",
    position: "before",
    decimals: 0,
  },

  // ── Middle East (Arabic) ──
  AED: {
    code: "AED",
    symbol: "د.إ",
    name: "UAE Dirham",
    position: "after",
    decimals: 2,
  },
  SAR: {
    code: "SAR",
    symbol: "﷼",
    name: "Saudi Riyal",
    position: "after",
    decimals: 2,
  },
  QAR: {
    code: "QAR",
    symbol: "ر.ق",
    name: "Qatari Riyal",
    position: "after",
    decimals: 2,
  },
  KWD: {
    code: "KWD",
    symbol: "د.ك",
    name: "Kuwaiti Dinar",
    position: "after",
    decimals: 3,
  },

  // ── Asia ──
  JPY: {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    position: "before",
    decimals: 0,
  },
  KRW: {
    code: "KRW",
    symbol: "₩",
    name: "South Korean Won",
    position: "before",
    decimals: 0,
  },
  CNY: {
    code: "CNY",
    symbol: "¥",
    name: "Chinese Yuan",
    position: "before",
    decimals: 2,
  },
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    position: "before",
    decimals: 2,
  },
  SGD: {
    code: "SGD",
    symbol: "S$",
    name: "Singapore Dollar",
    position: "before",
    decimals: 2,
  },
  MYR: {
    code: "MYR",
    symbol: "RM",
    name: "Malaysian Ringgit",
    position: "before",
    decimals: 2,
  },
  THB: {
    code: "THB",
    symbol: "฿",
    name: "Thai Baht",
    position: "before",
    decimals: 2,
  },
  IDR: {
    code: "IDR",
    symbol: "Rp",
    name: "Indonesian Rupiah",
    position: "before",
    decimals: 0,
  },
  PHP: {
    code: "PHP",
    symbol: "₱",
    name: "Philippine Peso",
    position: "before",
    decimals: 2,
  },

  // ── Oceania ──
  AUD: {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    position: "before",
    decimals: 2,
  },
};

const DEFAULT_CURRENCY = "USD";

function formatPrice(amount: number, currencyCode: string): string {
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

// ------------------------------------------------------------------
// Static exchange rates (USD = 1.00)
// Update these periodically or fetch from API in Phase 2
// ------------------------------------------------------------------

const STATIC_RATES: Record<string, number> = {
  // North America
  USD: 1,
  CAD: 1.36,
  MXN: 17.15,

  // Europe
  EUR: 0.92,
  GBP: 0.79,

  // South America
  BRL: 4.97,
  COP: 3950,
  ARS: 850,
  CLP: 940,

  // Middle East
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,

  // Asia
  JPY: 149.5,
  KRW: 1325,
  CNY: 7.24,
  INR: 83.1,
  SGD: 1.34,
  MYR: 4.72,
  THB: 35.8,
  IDR: 15650,
  PHP: 56.2,

  // Oceania
  AUD: 1.53,
};

// ------------------------------------------------------------------
// Context
// ------------------------------------------------------------------

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  format: (usdAmount: number) => string;
  convert: (usdAmount: number) => number;
  rates: Record<string, number>;
  loading: boolean;
  currencies: Record<string, CurrencyConfig>;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const STORAGE_KEY = "francolink_preferred_currency";

// ------------------------------------------------------------------
// Provider
// ------------------------------------------------------------------

export function CurrencyProvider({
  children,
  detectedCurrency,
}: {
  children: ReactNode;
  detectedCurrency: string;
}) {
  const [currency, setCurrencyState] = useState(
    detectedCurrency || DEFAULT_CURRENCY
  );
  const [rates] = useState<Record<string, number>>(STATIC_RATES);
  const [loading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // On mount, check localStorage for saved preference
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && CURRENCIES[saved]) {
        setCurrencyState(saved);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const setCurrency = useCallback((code: string) => {
    if (!CURRENCIES[code]) return;
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
  }, []);

  const convert = useCallback(
    (usdAmount: number): number => {
      const rate = rates[currency] || 1;
      const config = CURRENCIES[currency];
      if (!config) return usdAmount;

      const converted = usdAmount * rate;
      const factor = Math.pow(10, config.decimals);
      return Math.round(converted * factor) / factor;
    },
    [currency, rates]
  );

  const format = useCallback(
    (usdAmount: number): string => {
      if (usdAmount === 0) return formatPrice(0, currency);
      return formatPrice(convert(usdAmount), currency);
    },
    [currency, convert]
  );

  // Use detected currency until client mounts (prevents hydration mismatch)
  const activeCurrency = mounted
    ? currency
    : detectedCurrency || DEFAULT_CURRENCY;

  return (
    <CurrencyContext.Provider
      value={{
        currency: activeCurrency,
        setCurrency,
        format,
        convert,
        rates,
        loading,
        currencies: CURRENCIES,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used inside <CurrencyProvider>");
  }
  return ctx;
}