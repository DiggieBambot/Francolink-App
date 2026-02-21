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
  // Branding
  app_name: 'Franco Link',
  app_tagline: '#1 Best Online Language Learning Platform',
  logo_url: '/logo.png',
  logo_icon_url: '/icon.png',
  favicon_url: '/favicon.ico',
  
  // Theme - Final Confirmed Colors
  primary_color: '#092845',
  secondary_color: '#f48c17',
  accent_color: '#dd3333',
  dark_mode_enabled: false,
  
  // Contact
  support_email: 'support@francolink.net',
  company_name: 'Franco Link',
  
  // Social
  facebook_url: '',
  twitter_url: '',
  instagram_url: '',
  
  // SEO
  meta_title: 'Franco Link - #1 Best Online Language Learning Platform',
  meta_description: 'Join 5,000+ students learning English, French, Spanish and more with highly trained and certified tutors. Learn any language for free with the best online language learning platform.',
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