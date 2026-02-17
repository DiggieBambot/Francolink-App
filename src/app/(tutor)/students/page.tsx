// src/app/(tutor)/tutor/students/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudentProgressDashboard } from '@/components/tutor/student-progress-dashboard';

export default async function TutorStudentsPage() {
  const supabase = createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch tutor's students with progress
  const { data: students } = await supabase
    .from('user_profiles')
    .select(`
      id,
      full_name,
      email,
      avatar_url,
      xp,
      level,
      streak_days,
      lessons_completed,
      last_activity_date,
      created_at
    `)
    .eq('referred_by_tutor_id', user.id)
    .order('xp', { ascending: false });

  return (
    <div className="p-8">
      <StudentProgressDashboard students={students || []} />
    </div>
  );
}