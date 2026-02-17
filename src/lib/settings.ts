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

/**
 * Get a single setting value
 */
export async function getSetting(key: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single();
  
  if (error || !data) {
    console.error(`Setting not found: ${key}`, error);
    return null;
  }
  
  return data.value;
}

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

/**
 * Get Stripe configuration
 */
export async function getStripeConfig() {
  const settings = await getSettingsByCategory('payments');
  
  return {
    secretKey: settings['stripe_secret_key'] || process.env.STRIPE_SECRET_KEY || '',
    publishableKey: settings['stripe_publishable_key'] || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: settings['stripe_webhook_secret'] || process.env.STRIPE_WEBHOOK_SECRET || '',
    enabled: settings['stripe_enabled'] === 'true',
    priceIds: {
      premiumMonthly: settings['stripe_premium_monthly_price_id'],
      premiumYearly: settings['stripe_premium_yearly_price_id'],
      premiumPlusMonthly: settings['stripe_premium_plus_monthly_price_id'],
      premiumPlusYearly: settings['stripe_premium_plus_yearly_price_id'],
    }
  };
}

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