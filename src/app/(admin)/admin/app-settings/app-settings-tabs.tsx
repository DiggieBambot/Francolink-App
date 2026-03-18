'use client';

import { useState } from 'react';
import { BrandingTab } from './tabs/branding-tab';
import { ThemeTab } from './tabs/theme-tab';
import { PricingTab } from './tabs/pricing-tab';
import { PwaTab } from './tabs/pwa-tab';
import { ApiKeysTab } from './tabs/api-keys-tab';
import { StripeTab } from './tabs/stripe-tab';
import { Palette, Image, DollarSign, Smartphone, Key, CreditCard } from 'lucide-react';

const TABS = [
  { id: 'branding', label: 'Branding', icon: Image },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'pricing', label: 'Pricing Plans', icon: DollarSign },
  { id: 'pwa', label: 'PWA', icon: Smartphone },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'stripe', label: 'Stripe', icon: CreditCard },
];

interface Props {
  settings: Record<string, any[]>;
  rawSettings: any[];
}

export function AppSettingsTabs({ settings, rawSettings }: Props) {
  const [activeTab, setActiveTab] = useState('branding');

  const getSetting = (key: string) =>
    rawSettings.find((s) => s.key === key)?.value || '';

  return (
    <div>
      <div className="flex gap-1 border-b mb-8">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'branding' && <BrandingTab getSetting={getSetting} rawSettings={rawSettings} />}
      {activeTab === 'theme' && <ThemeTab getSetting={getSetting} rawSettings={rawSettings} />}
      {activeTab === 'pricing' && <PricingTab getSetting={getSetting} rawSettings={rawSettings} />}
      {activeTab === 'pwa' && <PwaTab getSetting={getSetting} rawSettings={rawSettings} />}
      {activeTab === 'api' && <ApiKeysTab getSetting={getSetting} rawSettings={rawSettings} />}
      {activeTab === 'stripe' && <StripeTab getSetting={getSetting} rawSettings={rawSettings} />}
    </div>
  );
}
