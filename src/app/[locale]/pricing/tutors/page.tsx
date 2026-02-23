// src/app/[locale]/pricing/tutors/page.tsx
'use client';
export const dynamic = 'force-dynamic';
import { useCurrency } from '@/context/currency-context';
import { CurrencySwitcher } from '@/components/currency-switcher';
import { useTranslations } from 'next-intl';

export default function TutorPricingPage() {
  const t = useTranslations('pricing');
  const { format, currency } = useCurrency();

  const plans = [
    { name: 'Basic',   priceUSD: 0,    features: ['5 Students', '10% Commission'] },
    { name: 'Premium', priceUSD: 29,   features: ['Unlimited Students', '25% Commission'] },
    { name: 'Premium+',priceUSD: 79,   features: ['Everything', 'Priority Support'] },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold">{t('title')}</h1>
        <CurrencySwitcher />
      </div>

      <p className="text-sm text-gray-500 mb-8">
        {t('currency_note', { currency })}
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.name} className="border rounded-2xl p-8">
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold">
                {plan.priceUSD === 0 ? t('start_free') : format(plan.priceUSD)}
              </span>
              {plan.priceUSD > 0 && (
                <span className="text-gray-500">{t('per_month')}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
