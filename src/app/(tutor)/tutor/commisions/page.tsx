// src/app/(tutor)/tutor/commissions/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CommissionDashboard } from '@/components/commission/commission-dashboard';

export default async function TutorCommissionsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="p-8">
      <CommissionDashboard />
    </div>
  );
}