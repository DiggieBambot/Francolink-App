// src/app/(tutor)/tutor/sessions/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SessionsList } from '@/components/session/sessions-list';

export default async function TutorSessionsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch tutor's sessions
  const { data: sessions } = await supabase
    .from('tutor_sessions')
    .select(`
      *,
      lessons (
        id,
        title
      )
    `)
    .eq('tutor_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch participant counts
  const sessionsWithCounts = await Promise.all(
    (sessions || []).map(async (session) => {
      const { count } = await supabase
        .from('session_participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id);
      
      return {
        ...session,
        participant_count: count || 0
      };
    })
  );

  return (
    <div className="p-8">
      <SessionsList sessions={sessionsWithCounts} />
    </div>
  );
}