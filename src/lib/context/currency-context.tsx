// src/context/currency-context.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CURRENCIES, DEFAULT_CURRENCY, formatPrice } from '@/lib/currencies';

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  format: (amount: number) => string;
  convert: (usdAmount: number) => number;
  rates: Record<string, number>;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

// Rates relative to USD (updated periodically)
// In production: fetch from an API or store in app_settings
const STATIC_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  MAD: 10.05,
  XOF: 605,
  NGN: 1550,
};

export function CurrencyProvider({
  children,
  detectedCurrency,
}: {
  children: ReactNode;
  detectedCurrency: string;
}) {
  const [currency, setCurrency] = useState(detectedCurrency);
  const [rates, setRates] = useState(STATIC_RATES);
  const [loading, setLoading] = useState(false);

  // Persist user's choice
  useEffect(() => {
    const saved = localStorage.getItem('preferred_currency');
    if (saved && CURRENCIES[saved]) {
      setCurrency(saved);
    }
  }, []);

  const handleSetCurrency = (code: string) => {
    setCurrency(code);
    localStorage.setItem('preferred_currency', code);
  };

  const convert = (usdAmount: number): number => {
    const rate = rates[currency] || 1;
    return Math.round(usdAmount * rate * 100) / 100;
  };

  const format = (usdAmount: number): string => {
    return formatPrice(convert(usdAmount), currency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: handleSetCurrency,
        format,
        convert,
        rates,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be inside CurrencyProvider');
  return ctx;
};