// src/lib/settings.ts
import { createClient } from "@/lib/supabase/server";

export type SettingCategory = 'payments' | 'commissions' | 'ai' | 'features' | 'limits' | 'pricing';

export interface AppSetting {
  id: string;
  category: string;
  key: string;
  value: string;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  is_secret: boolean;
}

// A category-blind getSetting used to live here, selecting on key alone with
// .single(). app_settings is keyed by (category, key), so a key used in two
// categories made it return null for every caller — the bug that hid the
// Stripe kill switch. Nothing imported it. Use getSetting from
// @/lib/config/settings, which takes a category and a default.

/**
 * Get multiple settings by category
 */
export async function getSettingsByCategory(category: SettingCategory): Promise<Record<string, string>> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .eq('category', category);
  
  if (error || !data) {
    console.error(`Settings not found for category: ${category}`, error);
    return {};
  }
  
  return data.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
}

// getStripeConfig used to live here. It read stripe_enabled from the 'payments'
// category, where a stale "false" row sat until it was deleted — so anything
// wired to it would have reported Stripe disabled while the admin toggle in
// 'features' said otherwise. Nothing imported it. The live one is
// getStripeConfig in @/lib/config/settings, which reads by category.

/**
 * Get Commission configuration
 */
export async function getCommissionConfig() {
  const settings = await getSettingsByCategory('commissions');
  
  return {
    enabled: settings['commission_enabled'] === 'true',
    rate: parseFloat(settings['commission_rate'] || '0.10'),
    minPayoutAmount: parseFloat(settings['min_payout_amount'] || '50'),
  };
}