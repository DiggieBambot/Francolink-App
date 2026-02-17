// src/app/(tutor)/layout.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  Calendar,
  Settings,
  GraduationCap,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { TutorSidebar } from '@/components/tutor/tutor-sidebar';

export const metadata: Metadata = {
  title: 'Tutor Dashboard | FrancoLink',
  description: 'Tutor dashboard for FrancoLink',
};

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is tutor or admin
  const { data: userData } = await supabase
    .from('users')
    .select('role, name, email, avatar_url, commission_balance, tutor_plan')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'TUTOR' && userData?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const navigation = [
    { name: 'Dashboard', href: '/tutor', icon: LayoutDashboard },
    { name: 'My Students', href: '/tutor/students', icon: Users },
    { name: 'Lessons', href: '/tutor/lessons', icon: BookOpen },
    { name: 'Live Sessions', href: '/tutor/sessions', icon: Video },
    { name: 'Schedule', href: '/tutor/schedule', icon: Calendar },
    { name: 'Commissions', href: '/tutor/commissions', icon: DollarSign },
    { name: 'Settings', href: '/tutor/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center gap-4">
            <Link href="/tutor" className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">Tutor Portal</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">FrancoLink</span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* Commission Balance Badge */}
            {userData?.commission_balance !== null && userData?.commission_balance > 0 && (
              <Link 
                href="/tutor/commissions"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                {Number(userData.commission_balance).toFixed(2)}
              </Link>
            )}
            
            <span className="text-sm text-muted-foreground hidden sm:block">
              {userData?.name || user.email}
            </span>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Student View
            </Link>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <TutorSidebar 
          navigation={navigation} 
          userName={userData?.name || 'Tutor'}
          userEmail={userData?.email || user.email || ''}
          avatarUrl={userData?.avatar_url}
          tutorPlan={userData?.tutor_plan}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6 px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}