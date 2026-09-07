// src/lib/settings.ts
import { createClient as createServiceClient } from "@supabase/supabase-js";

// app_settings is admin-only under RLS. Read with the request-scoped client and
// a tutor gets zero rows, so commission_enabled resolved to false and payouts
// were refused while the admin toggle said "true" — the same silent-default that
// told students payments were unavailable. This module is server-only, so the
// service role is the right client for reading settings here.
function settingsClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

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
  return getSettingsByCategories([category]);
}

/**
 * Get settings across several categories at once, flattened by key.
 */
export async function getSettingsByCategories(
  categories: string[]
): Promise<Record<string, string>> {
  const { data, error } = await settingsClient()
    .from('app_settings')
    .select('key, value')
    .in('category', categories);
  
  if (error || !data) {
    console.error(`Settings not found for categories: ${categories.join(', ')}`, error);
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