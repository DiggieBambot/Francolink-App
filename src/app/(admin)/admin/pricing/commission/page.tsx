// src/app/(admin)/admin/pricing/commission/page.tsx

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CommissionSettingsForm } from './commission-settings-form';
import { AdminPayouts } from './admin-payouts';

export const metadata: Metadata = {
  title: 'Commission Settings | Admin',
  description: 'Configure referral commissions',
};

export default async function CommissionSettingsPage() {
  const supabase = await createClient();

  // Fetch settings
  const { data: settings } = await supabase
    .from('commission_settings')
    .select('*')
    .limit(1)
    .single();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Commission Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure how tutors earn from student subscriptions
        </p>
      </div>

      <CommissionSettingsForm initialSettings={settings} />

      <AdminPayouts />
    </div>
  );
}