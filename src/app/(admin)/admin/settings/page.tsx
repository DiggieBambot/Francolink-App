import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PricingSettingsForm } from '@/components/admin/pricing-settings-form';

export default async function AdminPricingPage() {
  const supabase = await createClient();
  
  // Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch Settings
  const { data: settings } = await supabase
    .from('app_settings')
    .select('*')
    .in('category', ['pricing_tutor', 'pricing_student', 'pricing_marketing']);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Monetization & Pricing</h1>
        <p className="text-gray-500 mt-2">Manage subscription prices, active sales, and marketing banners.</p>
      </div>
      
      <PricingSettingsForm settings={settings || []} />
    </div>
  );
}