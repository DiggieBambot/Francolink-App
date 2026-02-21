// src/components/currency-switcher.tsx
'use client';

import { useCurrency } from '@/context/currency-context';
import { CURRENCIES } from '@/lib/currencies';
import { DollarSign, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                   border border-gray-200 hover:bg-gray-50
                   transition-colors text-sm"
      >
        <DollarSign className="w-4 h-4" />
        <span className="font-medium">{currency}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56
                        bg-white rounded-lg shadow-lg border
                        border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
          {Object.values(CURRENCIES).map((c) => (
            <button
              key={c.code}
              onClick={() => { setCurrency(c.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5
                         text-sm hover:bg-primary-50 transition-colors
                         ${c.code === currency
                           ? 'bg-primary-50 text-primary font-medium'
                           : 'text-gray-700'}`}
            >
              <span className="font-mono w-8">{c.symbol}</span>
              <span>{c.name}</span>
              <span className="ml-auto text-gray-400 text-xs">{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}