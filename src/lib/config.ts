// src/lib/config.ts
import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

export interface AppConfig {
  // Branding
  app_name: string;
  app_tagline: string;
  logo_url: string;
  logo_icon_url: string;
  favicon_url: string;
  
  // Theme
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  dark_mode_enabled: boolean;
  
  // Contact
  support_email: string;
  company_name: string;
  
  // Social
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  
  // SEO
  meta_title: string;
  meta_description: string;
  og_image: string;
}

const DEFAULT_CONFIG: AppConfig = {
  app_name: 'FrancoLink',
  app_tagline: 'Master French with Expert Tutors',
  logo_url: '/logo.png',
  logo_icon_url: '/icon.png',
  favicon_url: '/favicon.ico',
  primary_color: '#3B82F6',
  secondary_color: '#8B5CF6',
  accent_color: '#10B981',
  dark_mode_enabled: true,
  support_email: 'support@francolink.com',
  company_name: 'FrancoLink Inc.',
  facebook_url: '',
  twitter_url: '',
  instagram_url: '',
  meta_title: 'FrancoLink - Learn French Online',
  meta_description: 'Learn French with expert tutors.',
  og_image: '/og-image.png'
};

/**
 * Fetch app configuration from database (Server-side)
 */
export async function getAppConfig(): Promise<AppConfig> {
  try {
    const supabase = await createClient();
    
    const { data: settings } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('category', ['branding', 'theme', 'contact', 'social', 'seo']);

    if (!settings) return DEFAULT_CONFIG;

    const config: any = { ...DEFAULT_CONFIG };
    
    settings.forEach(setting => {
      const key = setting.key as keyof AppConfig;
      if (key in config) {
        // Convert boolean strings
        if (setting.value === 'true') config[key] = true;
        else if (setting.value === 'false') config[key] = false;
        else config[key] = setting.value;
      }
    });

    return config;
  } catch (error) {
    console.error('Error fetching app config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Fetch app configuration (Client-side)
 */
export async function getAppConfigClient(): Promise<AppConfig> {
  try {
    const supabase = createBrowserClient();
    
    const { data: settings } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('category', ['branding', 'theme', 'contact', 'social', 'seo']);

    if (!settings) return DEFAULT_CONFIG;

    const config: any = { ...DEFAULT_CONFIG };
    
    settings.forEach(setting => {
      const key = setting.key as keyof AppConfig;
      if (key in config) {
        if (setting.value === 'true') config[key] = true;
        else if (setting.value === 'false') config[key] = false;
        else config[key] = setting.value;
      }
    });

    return config;
  } catch (error) {
    console.error('Error fetching app config:', error);
    return DEFAULT_CONFIG;
  }
}