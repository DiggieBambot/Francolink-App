// src/app/(auth)/signup/tutor/page.tsx

import { Metadata } from 'next';
import { TutorSignupForm } from './tutor-signup-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Tutor Signup | FrancoLink',
  description: 'Create your tutor account',
};

interface PageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function TutorSignupPage({ searchParams }: PageProps) {
  const { plan } = await searchParams;
  const supabase = await createClient();
  
  // Check if already logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect('/dashboard');
  }

  // Fetch plans to confirm selection
  const { data: plans } = await supabase
    .from('tutor_plans')
    .select('key, name, price_monthly')
    .eq('is_active', true)
    .order('sort_order');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Tutor Account</h1>
          <p className="mt-2 text-muted-foreground">
            Start teaching with FrancoLink
          </p>
        </div>

        <TutorSignupForm 
          selectedPlan={plan || 'FREE'} 
          plans={plans || []} 
        />
      </div>
    </div>
  );
}