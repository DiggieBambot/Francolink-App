// src/app/(tutor)/tutor/settings/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TutorSettingsForm } from '@/components/tutor/tutor-settings-form';
import { CalendarSubscribe } from '@/components/calendar/calendar-subscribe';
import { Settings, User, Bell, CreditCard, Shield } from 'lucide-react';

export default async function TutorSettingsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get tutor profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your tutor profile and preferences
        </p>
      </div>

      <TutorSettingsForm profile={profile} userEmail={user.email || ''} />

      {/* A tutor's teaching schedule belongs in whatever calendar they already
          live in — that is also where their own lesson alerts come from. */}
      <div className="mt-6">
        <CalendarSubscribe />
      </div>
    </div>
  );
}