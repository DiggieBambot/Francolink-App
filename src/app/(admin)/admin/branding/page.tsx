// src/app/(admin)/admin/branding/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BrandingForm } from '@/components/admin/branding-form';
import { getAppConfig } from '@/lib/config';

export default async function AdminBrandingPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Verify admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const config = await getAppConfig();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Branding & Theme</h1>
        <p className="text-gray-500 mt-1">
          Customize your app's appearance and branding
        </p>
      </div>

      <BrandingForm config={config} />
    </div>
  );
}