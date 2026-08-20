'use client';

import { useState } from 'react';
import { useSettingsSave, SaveBar } from '../use-settings-save';
import { Plus, X, Check } from 'lucide-react';

interface Props {
  getSetting: (key: string) => string;
  rawSettings: any[];
}

interface Plan {
  id: string; name: string; price_monthly: string; price_yearly: string;
  currency: string; stripe_price_monthly: string; stripe_price_yearly: string;
  features: string[]; badge: string; highlighted: boolean; cta_label: string;
}

// These are the fallback shown when app_settings has no pricing_plans row, so
// they must not invent an offer. Prices are the ones Stripe actually charges
// (verified against the live price IDs), and the feature lines are the limits
// in PLANS — not the aspirational ones this seed used to carry: it advertised
// Premium at $9.99 against a $7.99 charge, "AI Tutor (5/day)" against a monthly
// pool of 300 messages, and "5 lessons per day" on Free against a limit of 1.
const DEFAULT_PLANS: Plan[] = [
  { id: 'free', name: 'Free', price_monthly: '0', price_yearly: '0', currency: 'USD',
    stripe_price_monthly: '', stripe_price_yearly: '',
    features: ['1 lesson per day', 'Basic exercises', 'Progress tracking'],
    badge: '', highlighted: false, cta_label: 'Get Started Free' },
  { id: 'premium', name: 'Premium', price_monthly: '7.99', price_yearly: '59.99', currency: 'USD',
    stripe_price_monthly: '', stripe_price_yearly: '',
    features: ['Unlimited lessons', 'All exercises', 'Progress tracking', '300 AI Tutor messages a month'],
    badge: 'Popular', highlighted: true, cta_label: 'Start Premium' },
  { id: 'premium_plus', name: 'Premium Plus', price_monthly: '14.99', price_yearly: '119.99', currency: 'USD',
    stripe_price_monthly: '', stripe_price_yearly: '',
    features: ['Everything in Premium', '1,500 AI Tutor messages a month', 'Live tutor sessions', 'Priority support'],
    badge: 'Best Value', highlighted: false, cta_label: 'Go Premium Plus' },
];

function PlanCard({ plan, onChange }: { plan: Plan; onChange: (u: Plan) => void }) {
  const [newFeature, setNewFeature] = useState('');
  const addFeature = () => {
    if (!newFeature.trim()) return;
    onChange({ ...plan, features: [...plan.features, newFeature.trim()] });
    setNewFeature('');
  };

  return (
    <div className={`border rounded-xl p-6 ${plan.highlighted ? 'border-blue-500 ring-2 ring-blue-100' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <input type="text" value={plan.name} onChange={(e) => onChange({ ...plan, name: e.target.value })}
            className="text-lg font-bold border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-40 bg-transparent" />
          <input type="text" value={plan.badge} onChange={(e) => onChange({ ...plan, badge: e.target.value })}
            placeholder="Badge (e.g. Popular)"
            className="text-xs border rounded px-2 py-1 w-32 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={plan.highlighted}
            onChange={(e) => onChange({ ...plan, highlighted: e.target.checked })} className="rounded" />
          Highlighted
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Monthly (USD)</label>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r">$</span>
            <input type="number" value={plan.price_monthly}
              onChange={(e) => onChange({ ...plan, price_monthly: e.target.value })}
              className="flex-1 px-3 py-2 text-sm focus:outline-none" min="0" step="0.01" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Yearly (USD)</label>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r">$</span>
            <input type="number" value={plan.price_yearly}
              onChange={(e) => onChange({ ...plan, price_yearly: e.target.value })}
              className="flex-1 px-3 py-2 text-sm focus:outline-none" min="0" step="0.01" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Stripe Price ID (Monthly)</label>
          <input type="text" value={plan.stripe_price_monthly}
            onChange={(e) => onChange({ ...plan, stripe_price_monthly: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="price_xxxxx" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Stripe Price ID (Yearly)</label>
          <input type="text" value={plan.stripe_price_yearly}
            onChange={(e) => onChange({ ...plan, stripe_price_yearly: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="price_xxxxx" />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">CTA Button Label</label>
        <input type="text" value={plan.cta_label}
          onChange={(e) => onChange({ ...plan, cta_label: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-2">Features</label>
        <div className="space-y-1.5 mb-3">
          {plan.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span className="text-sm flex-1">{f}</span>
              <button onClick={() => onChange({ ...plan, features: plan.features.filter((_, idx) => idx !== i) })}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFeature()}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add feature..." />
          <button onClick={addFeature} className="p-2 border rounded-lg hover:bg-gray-50">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PricingTab({ getSetting }: Props) {
  const parsePlans = (): Plan[] => {
    try {
      const raw = getSetting('pricing_plans');
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_PLANS;
  };

  const [plans, setPlans] = useState<Plan[]>(parsePlans());
  const { save, saving, saved, error } = useSettingsSave();

  const handleSave = () => save({ pricing_plans: JSON.stringify(plans) });

  return (
    <div className="space-y-6">
      <section className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-1">Subscription Plans</h2>
        <p className="text-sm text-gray-500 mb-6">Edit plan names, prices, Stripe IDs, and features.</p>
        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan}
              onChange={(updated) => setPlans(plans.map((p) => p.id === plan.id ? updated : p))} />
          ))}
        </div>
      </section>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        💡 <strong>Tip:</strong> Stripe Price IDs must match your Stripe dashboard. Features update the marketing pricing page.
      </div>
      <SaveBar saving={saving} saved={saved} error={error} onSave={handleSave} label="Save Pricing Plans" />
    </div>
  );
}
