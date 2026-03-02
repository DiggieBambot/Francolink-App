import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppSettingsTabs } from './app-settings-tabs';

export const metadata = {
  title: 'App Settings | Admin',
};

export default async function AppSettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'ADMIN') redirect('/dashboard');

  const { data: settings } = await supabase
    .from('app_settings')
    .select('*')
    .order('category');

  const grouped = (settings || []).reduce((acc: Record<string, any[]>, s) => {
    const cat = s.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">App Settings</h1>
        <p className="text-gray-500 mt-2">
          Manage branding, theme, pricing, PWA configuration, and API keys.
        </p>
      </div>
      <AppSettingsTabs settings={grouped} rawSettings={settings || []} />
    </div>
  );
}
