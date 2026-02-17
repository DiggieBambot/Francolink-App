// src/app/(admin)/admin/settings/ai/page.tsx

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AISettingsForm } from './ai-settings-form';

export const metadata: Metadata = {
  title: 'AI Settings | Admin',
  description: 'Configure AI providers and settings',
};

export default async function AISettingsPage() {
  const supabase = await createClient();

  // Fetch AI settings
  const { data: settings } = await supabase
    .from('app_settings')
    .select('*')
    .eq('category', 'ai')
    .order('key');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure AI providers for content processing and the AI tutor.
        </p>
      </div>

      <AISettingsForm initialSettings={settings || []} />
    </div>
  );
}