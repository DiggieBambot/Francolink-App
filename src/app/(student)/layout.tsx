// src/app/(student)/layout.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudentNavigation } from '@/components/student/student-navigation';
import { UserMenu } from '@/components/shared/user-menu';
import Link from 'next/link';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, name, email, avatar_url, total_xp, current_level')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-50">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">FrancoLink</span>
          </Link>
        </div>

        {/* XP & Level Badge */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Level</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {profile?.current_level || 'A1'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">XP</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {profile?.total_xp || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <StudentNavigation />
        </div>

        {/* User Menu */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <UserMenu 
            user={{
              name: profile?.name || 'Student',
              email: profile?.email || user.email || '',
              avatar_url: profile?.avatar_url,
              role: 'STUDENT'
            }}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}