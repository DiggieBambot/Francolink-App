import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PricingSettingsForm } from '@/components/admin/pricing-settings-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function DynamicPricingPage() {
  const supabase = await createClient();
  
  // Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify Admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'ADMIN') redirect('/dashboard');

  // Fetch Settings
  const { data: settings } = await supabase
    .from('app_settings')
    .select('*')
    .in('category', ['pricing_tutor', 'pricing_student', 'pricing_marketing']);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/admin/pricing" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Pricing Overview
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dynamic Pricing & Sales</h1>
        <p className="text-gray-500 mt-2">
          Control global sales, promo banners, and override subscription prices without changing core plans.
        </p>
      </div>
      
      <PricingSettingsForm settings={settings || []} />
    </div>
  );
}