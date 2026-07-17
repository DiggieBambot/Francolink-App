import { createClient as createServiceClient } from '@supabase/supabase-js';
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
  app_name: 'Francolink',
  app_tagline: 'Learn · Speak · Connect',
  logo_url: '/logo-wordmark.png',
  logo_icon_url: '/logo-icon.png',
  favicon_url: '/favicon.ico',
  
  // Theme - Final Confirmed Colors
  primary_color: '#092845',
  secondary_color: '#f48c17',
  accent_color: '#dd3333',
  dark_mode_enabled: false,
  
  // Contact
  support_email: 'support@francolink.net',
  company_name: 'Francolink',
  
  // Social
  facebook_url: '',
  twitter_url: '',
  instagram_url: '',
  
  // SEO
  meta_title: 'Learn French, English & Spanish Online with Certified Tutors | Francolink',
  meta_description: 'Learn a language with structured CEFR lessons, live certified tutors and an AI conversation partner you can practise with anytime. Start free with a 90-second placement test.',
  og_image: '/og-image.png'
};

// App config (branding/theme/SEO) is read on EVERY request site-wide (root
// layout + metadata). It changes only when an admin edits settings, so we cache
// it in-process with a short TTL and read it with a cookie-free service client
// (the old cookie-bound client forced every page to render dynamically, and for
// logged-out visitors RLS silently returned nothing anyway).
let _configCache: AppConfig | null = null;
let _configCacheAt = 0;
const CONFIG_TTL_MS = 5 * 60 * 1000;

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Clear the cached config (call after an admin saves settings). */
export function clearAppConfigCache(): void {
  _configCache = null;
  _configCacheAt = 0;
}

/**
 * Fetch app configuration from database (Server-side). Cached in-process.
 */
export async function getAppConfig(): Promise<AppConfig> {
  if (_configCache && Date.now() - _configCacheAt < CONFIG_TTL_MS) {
    return _configCache;
  }
  try {
    const supabase = serviceClient();

    const { data: settings } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('category', ['branding', 'theme', 'contact', 'social', 'seo']);

    const config: any = { ...DEFAULT_CONFIG };

    (settings || []).forEach(setting => {
      const key = setting.key as keyof AppConfig;
      if (key in config) {
        if (setting.value === 'true') config[key] = true;
        else if (setting.value === 'false') config[key] = false;
        else config[key] = setting.value;
      }
    });

    _configCache = config;
    _configCacheAt = Date.now();
    return config;
  } catch (error) {
    console.error('Error fetching app config:', error);
    return _configCache || DEFAULT_CONFIG;
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