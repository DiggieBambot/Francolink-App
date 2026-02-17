// src/app/(admin)/admin/pricing/commission/commission-settings-form.tsx

'use client';

import { useState } from 'react';
import { Save, AlertCircle, CheckCircle2, Percent, DollarSign, Calendar } from 'lucide-react';

interface CommissionSettings {
  id: string;
  commission_rate: number;
  minimum_payout: number;
  payout_frequency: string;
  applies_to_plans: string[];
  attribution_type: string;
  is_active: boolean;
}

interface Props {
  initialSettings: CommissionSettings | null;
}

export function CommissionSettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState<Partial<CommissionSettings>>(
    initialSettings || {
      commission_rate: 10,
      minimum_payout: 10,
      payout_frequency: 'monthly',
      applies_to_plans: ['PREMIUM', 'PREMIUM_PLUS'],
      attribution_type: 'first',
      is_active: true,
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/admin/pricing/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save');
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePlan = (plan: string) => {
    const current = settings.applies_to_plans || [];
    if (current.includes(plan)) {
      setSettings({ ...settings, applies_to_plans: current.filter(p => p !== plan) });
    } else {
      setSettings({ ...settings, applies_to_plans: [...current, plan] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Commission Rate */}
      <div className="p-6 bg-card border border-border rounded-lg space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Percent className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-foreground">Commission Rate</h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Percentage per Transaction</label>
          <div className="relative max-w-xs">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={settings.commission_rate}
              onChange={(e) => setSettings({ ...settings, commission_rate: parseFloat(e.target.value) })}
              className="w-full pl-4 pr-12 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <span className="absolute right-4 top-2 text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Example: On a $9.99 subscription, tutor earns ${(9.99 * (settings.commission_rate || 0) / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Payout Rules */}
      <div className="p-6 bg-card border border-border rounded-lg space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-foreground">Payout Rules</h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">Minimum Payout</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-muted-foreground">$</span>
              <input
                type="number"
                min="0"
                value={settings.minimum_payout}
                onChange={(e) => setSettings({ ...settings, minimum_payout: parseFloat(e.target.value) })}
                className="w-full pl-8 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Frequency</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <select
                value={settings.payout_frequency}
                onChange={(e) => setSettings({ ...settings, payout_frequency: e.target.value })}
                className="w-full pl-10 py-2 border border-border rounded-lg bg-background text-foreground appearance-none"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Scope & Attribution */}
      <div className="p-6 bg-card border border-border rounded-lg space-y-6">
        <div>
          <label className="block text-sm font-medium mb-3">Commission Applies To</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.applies_to_plans?.includes('PREMIUM')}
                onChange={() => togglePlan('PREMIUM')}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">Student Premium Plan</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.applies_to_plans?.includes('PREMIUM_PLUS')}
                onChange={() => togglePlan('PREMIUM_PLUS')}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">Student Premium+ Plan</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Attribution Model</label>
          <div className="flex gap-4">
            <label className={`
              flex-1 p-3 border rounded-lg cursor-pointer transition-all
              ${settings.attribution_type === 'first' 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'border-border hover:bg-muted'}
            `}>
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  name="attribution"
                  value="first"
                  checked={settings.attribution_type === 'first'}
                  onChange={() => setSettings({ ...settings, attribution_type: 'first' })}
                  className="text-primary focus:ring-primary"
                />
                <span className="font-medium text-sm">First Click</span>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Original inviter gets commission forever
              </p>
            </label>

            <label className={`
              flex-1 p-3 border rounded-lg cursor-pointer transition-all
              ${settings.attribution_type === 'last' 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'border-border hover:bg-muted'}
            `}>
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  name="attribution"
                  value="last"
                  checked={settings.attribution_type === 'last'}
                  onChange={() => setSettings({ ...settings, attribution_type: 'last' })}
                  className="text-primary focus:ring-primary"
                />
                <span className="font-medium text-sm">Last Click</span>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Most recent tutor gets commission
              </p>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.is_active}
              onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium">Enable Commission System</span>
          </label>
        </div>
      </div>

      {/* Save Bar */}
      <div className="flex items-center justify-between sticky bottom-6 bg-background/95 backdrop-blur p-4 rounded-lg border border-border shadow-lg">
        <div>
          {status === 'success' && (
            <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> Saved successfully
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-2 text-red-600 text-sm font-medium">
              <AlertCircle className="w-4 h-4" /> Failed to save settings
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isSaving ? (
            'Saving...'
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </form>
  );
}