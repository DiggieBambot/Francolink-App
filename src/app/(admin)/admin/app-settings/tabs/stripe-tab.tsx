'use client';

import { useState } from 'react';
import { useSettingsSave, SaveBar } from '../use-settings-save';
import { CreditCard, ToggleLeft, ToggleRight } from 'lucide-react';

interface Props {
  getSetting: (key: string) => string;
  rawSettings: any[];
}

export function StripeTab({ getSetting, rawSettings }: Props) {
  const getVal = (cat: string, key: string) =>
    rawSettings.find((s) => s.category === cat && s.key === key)?.value || '';

  const [enabled, setEnabled] = useState(getVal('features', 'stripe_enabled') === 'true');
  const [premiumMonthly, setPremiumMonthly] = useState(getVal('payments', 'stripe_premium_monthly_price_id'));
  const [premiumYearly, setPremiumYearly] = useState(getVal('payments', 'stripe_premium_yearly_price_id'));
  const [plusMonthly, setPlusMonthly] = useState(getVal('payments', 'stripe_premium_plus_monthly_price_id'));
  const [plusYearly, setPlusYearly] = useState(getVal('payments', 'stripe_premium_plus_yearly_price_id'));

  const { save, saving, saved, error } = useSettingsSave();

  const handleSave = () => save({
    'features::stripe_enabled': String(enabled),
    'payments::stripe_premium_monthly_price_id': premiumMonthly,
    'payments::stripe_premium_yearly_price_id': premiumYearly,
    'payments::stripe_premium_plus_monthly_price_id': plusMonthly,
    'payments::stripe_premium_plus_yearly_price_id': plusYearly,
  });

  return (
    <div className="space-y-6">
      {/* Enable toggle */}
      <section className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Stripe Payments</h2>
            <p className="text-sm text-gray-500 mt-1">
              Enable to allow users to subscribe. Disable to show "coming soon".
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </section>

      {/* Price IDs */}
      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" /> Stripe Price IDs
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Copy Price IDs from your{' '}
          <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer"
            className="text-blue-600 hover:underline">Stripe dashboard → Products</a>.
          They look like <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">price_1ABC...</code>
        </p>

        <div className="grid grid-cols-2 gap-6">
          {/* Premium */}
          <div className="border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm">P</span>
              <h3 className="font-semibold text-gray-900">Premium</h3>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Monthly Price ID</label>
              <input
                type="text" value={premiumMonthly}
                onChange={(e) => setPremiumMonthly(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="price_1..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Yearly Price ID</label>
              <input
                type="text" value={premiumYearly}
                onChange={(e) => setPremiumYearly(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="price_1..." />
            </div>
          </div>

          {/* Premium+ */}
          <div className="border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-black text-sm">P+</span>
              <h3 className="font-semibold text-gray-900">Premium+</h3>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Monthly Price ID</label>
              <input
                type="text" value={plusMonthly}
                onChange={(e) => setPlusMonthly(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="price_1..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Yearly Price ID</label>
              <input
                type="text" value={plusYearly}
                onChange={(e) => setPlusYearly(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="price_1..." />
            </div>
          </div>
        </div>
      </section>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        ⚠️ <strong>Also required:</strong> Add <code className="bg-amber-100 px-1 rounded">STRIPE_SECRET_KEY</code> and{' '}
        <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to your VPS <code className="bg-amber-100 px-1 rounded">.env.local</code> file.
      </div>

      <SaveBar saving={saving} saved={saved} error={error} onSave={handleSave} label="Save Stripe Settings" />
    </div>
  );
}
