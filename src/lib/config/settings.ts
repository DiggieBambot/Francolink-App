// src/lib/config/settings.ts

"use server";

import { createClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────

export type SettingCategory =
  | "payments"
  | "pricing"
  | "limits"
  | "features"
  | "ai";

export interface AppSetting {
  category: string;
  key: string;
  value: string | null;
  value_type: "string" | "number" | "boolean" | "json";
  description: string | null;
  is_secret: boolean;
}

// ─── Core Functions ──────────────────────────────────────────────

/**
 * Get a single setting value (server-only)
 */
export async function getSetting<T = string>(
  category: SettingCategory,
  key: string,
  defaultValue: T
): Promise<T> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("app_settings")
      .select("value, value_type")
      .eq("category", category)
      .eq("key", key)
      .single();

    if (error || !data || data.value === null || data.value === "") {
      return defaultValue;
    }

    // Parse based on value_type
    switch (data.value_type) {
      case "number":
        return parseFloat(data.value) as T;
      case "boolean":
        return (data.value === "true") as T;
      case "json":
        try {
          return JSON.parse(data.value) as T;
        } catch {
          return defaultValue;
        }
      default:
        return data.value as T;
    }
  } catch (error) {
    console.error(`Failed to get setting ${category}:${key}`, error);
    return defaultValue;
  }
}

/**
 * Get all settings in a category (server-only)
 */
export async function getSettingsByCategory(
  category: SettingCategory
): Promise<Record<string, any>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value, value_type")
      .eq("category", category);

    if (error || !data) {
      return {};
    }

    const result: Record<string, any> = {};

    for (const setting of data) {
      if (setting.value === null) continue;

      switch (setting.value_type) {
        case "number":
          result[setting.key] = parseFloat(setting.value);
          break;
        case "boolean":
          result[setting.key] = setting.value === "true";
          break;
        case "json":
          try {
            result[setting.key] = JSON.parse(setting.value);
          } catch {
            result[setting.key] = setting.value;
          }
          break;
        default:
          result[setting.key] = setting.value;
      }
    }

    return result;
  } catch (error) {
    console.error(`Failed to get settings for ${category}`, error);
    return {};
  }
}

// ─── Convenience Getters (Server-Only) ───────────────────────────

export async function getStripeConfig() {
  return {
    premiumMonthlyPriceId: await getSetting(
      "payments",
      "stripe_premium_monthly_price_id",
      ""
    ),
    premiumYearlyPriceId: await getSetting(
      "payments",
      "stripe_premium_yearly_price_id",
      ""
    ),
    premiumPlusMonthlyPriceId: await getSetting(
      "payments",
      "stripe_premium_plus_monthly_price_id",
      ""
    ),
    premiumPlusYearlyPriceId: await getSetting(
      "payments",
      "stripe_premium_plus_yearly_price_id",
      ""
    ),
    webhookSecret: await getSetting("payments", "stripe_webhook_secret", ""),
  };
}

export async function getPricingConfig() {
  return {
    premiumMonthly: await getSetting("pricing", "premium_monthly_price", 7.99),
    premiumYearly: await getSetting("pricing", "premium_yearly_price", 79.99),
    premiumPlusMonthly: await getSetting(
      "pricing",
      "premium_plus_monthly_price",
      14.99
    ),
    premiumPlusYearly: await getSetting(
      "pricing",
      "premium_plus_yearly_price",
      149.99
    ),
    foundingMemberActive: await getSetting(
      "pricing",
      "founding_member_discount_active",
      true
    ),
    premiumOriginalPrice: await getSetting(
      "pricing",
      "premium_original_price",
      9.99
    ),
    premiumPlusOriginalPrice: await getSetting(
      "pricing",
      "premium_plus_original_price",
      19.99
    ),
  };
}

export async function getLimitsConfig() {
  return {
    freeDailyLessons: await getSetting("limits", "free_daily_lessons", 3),
    freeAccessibleLevels: await getSetting<string[]>(
      "limits",
      "free_accessible_levels",
      ["A1", "A2", "B1", "B2"]
    ),
    premiumAiMinutes: await getSetting("limits", "premium_ai_minutes", 15),
    premiumPlusAiMinutes: await getSetting(
      "limits",
      "premium_plus_ai_minutes",
      60
    ),
  };
}

export async function getFeaturesConfig() {
  return {
    aiTutorEnabled: await getSetting("features", "ai_tutor_enabled", false),
    offlineModeEnabled: await getSetting(
      "features",
      "offline_mode_enabled",
      false
    ),
    leaderboardEnabled: await getSetting(
      "features",
      "leaderboard_enabled",
      true
    ),
    maintenanceMode: await getSetting("features", "maintenance_mode", false),
  };
}

export async function getAiConfig() {
  return {
    model: await getSetting("ai", "openai_model", "gpt-4o-mini"),
    maxTokens: await getSetting("ai", "openai_max_tokens", 1000),
  };
}