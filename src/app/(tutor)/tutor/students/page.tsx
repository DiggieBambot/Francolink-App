// src/app/(tutor)/tutor/students/page.tsx
import { createClient } from '@/lib/supabase/server';
import { CopyButton } from '@/components/tutor/copy-button';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Trophy, 
  Flame, 
  BookOpen,
  TrendingUp,
  Calendar,
  ChevronRight,
  Star,
  Mail,
  MoreVertical,
  UserPlus,
  Copy
} from 'lucide-react';
import { StudentsList } from '@/components/tutor/students-list';

export default async function TutorStudentsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get tutor's invite code
  const { data: tutorData } = await supabase
    .from('users')
    .select('tutor_invite_code, name')
    .eq('id', user.id)
    .single();

  // Fetch tutor's students with progress
  const { data: students } = await supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      avatar_url,
      total_xp,
      current_streak,
      current_level,
      last_activity_date,
      subscription_plan,
      created_at
    `)
    .eq('referred_by_tutor_id', user.id)
    .order('total_xp', { ascending: false });

  // Calculate stats
  const totalStudents = students?.length || 0;
  const activeToday = students?.filter(s => {
    if (!s.last_activity_date) return false;
    const today = new Date().toDateString();
    return new Date(s.last_activity_date).toDateString() === today;
  }).length || 0;
  const payingStudents = students?.filter(s => s.subscription_plan !== 'FREE' && s.subscription_plan).length || 0;
  const totalXP = students?.reduce((sum, s) => sum + (s.total_xp || 0), 0) || 0;

  const inviteLink = tutorData?.tutor_invite_code 
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join/${tutorData.tutor_invite_code}`
    : null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Students</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track and manage your students
          </p>
        </div>
        
        {/* Invite Link Box */}
        {inviteLink && (
          <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
            <UserPlus className="w-5 h-5 text-primary dark:text-primary-400" />
            <div className="text-sm">
              <p className="text-primary-900 dark:text-primary-100 font-medium">Invite Link</p>
              <p className="text-primary dark:text-primary-400 text-xs truncate max-w-[200px]">
                {inviteLink}
              </p>
            </div>
            <CopyButton text={inviteLink} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Students</span>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Active Today</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeToday}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Premium Students</span>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{payingStudents}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total XP Earned</span>
            <Trophy className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalXP.toLocaleString()}</p>
        </div>
      </div>

      {/* Students List */}
      <StudentsList students={students || []} inviteLink={inviteLink} />
    </div>
  );
}