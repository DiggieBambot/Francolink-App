// src/app/(tutor)/tutor/commissions/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CommissionDashboard } from '@/components/commission/commission-dashboard';
import { PayoutDetailsForm } from '@/components/commission/payout-details-form';

export default async function TutorCommissionsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PayoutDetailsForm />
      <CommissionDashboard />
    </div>
  );
}