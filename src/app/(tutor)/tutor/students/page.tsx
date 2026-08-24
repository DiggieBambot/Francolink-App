// src/app/(tutor)/tutor/students/page.tsx
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
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
import { PendingRequests } from '@/components/tutor/pending-requests';
import { ClassRequests, type ClassRequestItem } from '@/components/tutor/class-requests';
import { getOrCreateLessonSpace } from '@/lib/lessons/lesson-space';

export default async function TutorStudentsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Listing a tutor's own students/requests is server-side aggregation — use the
  // service client so RLS on users/tutor_students can't silently hide rows.
  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Get tutor's invite code
  const { data: tutorData } = await supabase
    .from('users')
    .select('tutor_invite_code, name')
    .eq('id', user.id)
    .single();

  // A student's teachers are the active tutor_students connections. A student can
  // have many teachers, so this — not referred_by_tutor_id — is the source of
  // truth for "who is in my class".
  const { data: rels } = await svc
    .from('tutor_students')
    .select('student_id, assigned_at')
    .eq('tutor_id', user.id)
    .eq('status', 'active');

  const studentIds = (rels || [])
    .map((r) => r.student_id)
    .filter((id) => id && id !== user.id);

  let students: {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
    total_xp: number | null;
    current_streak: number | null;
    current_level: string | null;
    last_activity_date: string | null;
    subscription_plan: string | null;
    created_at: string;
  }[] = [];

  if (studentIds.length > 0) {
    const { data: rows } = await svc
      .from('users')
      .select(`
        id, name, email, avatar_url, total_xp, current_streak,
        current_level, last_activity_date, subscription_plan, created_at
      `)
      .in('id', studentIds)
      .order('total_xp', { ascending: false });
    students = rows || [];
  }

  // Join requests awaiting this tutor's approval. Most joins are still
  // automatic — a code or link connects a clean account straight away. What
  // lands here is what the signup risk gate (src/lib/auth/signup-guard.ts) held
  // back: accounts whose name or email scored as likely spam. The tutor is the
  // one who knows their own students, so they get the final say rather than us
  // silently dropping someone real.
  const { data: pendingRels } = await svc
    .from('tutor_students')
    .select('student_id, assigned_at')
    .eq('tutor_id', user.id)
    .eq('status', 'pending');

  const pendingIds = (pendingRels || [])
    .map((r) => r.student_id)
    .filter((id) => id && id !== user.id);

  let pendingRequests: {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
    requested_at: string | null;
  }[] = [];

  if (pendingIds.length > 0) {
    const { data: pendingRows } = await svc
      .from('users')
      .select('id, name, email, avatar_url')
      .in('id', pendingIds);

    const requestedAt = new Map(
      (pendingRels || []).map((r) => [r.student_id, r.assigned_at as string | null])
    );
    pendingRequests = (pendingRows || []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar_url: u.avatar_url,
      requested_at: requestedAt.get(u.id) ?? null,
    }));
  }

  // Open "book a class" requests.
  const { data: crRows } = await svc
    .from('class_requests')
    .select('id, student_id, message, preferred_time, created_at')
    .eq('tutor_id', user.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  const nameById = new Map((students || []).map((s) => [s.id, s.name || s.email]));
  const classRequests: ClassRequestItem[] = (crRows || []).map((r) => ({
    id: r.id,
    studentName: nameById.get(r.student_id) || 'A student',
    message: r.message,
    preferredTime: r.preferred_time,
    createdAt: r.created_at,
  }));

  // Calculate stats
  const totalStudents = students?.length || 0;
  const activeToday = students?.filter(s => {
    if (!s.last_activity_date) return false;
    const today = new Date().toDateString();
    return new Date(s.last_activity_date).toDateString() === today;
  }).length || 0;
  const payingStudents = students?.filter(s => s.subscription_plan !== 'FREE' && s.subscription_plan).length || 0;
  const totalXP = students?.reduce((sum, s) => sum + (s.total_xp || 0), 0) || 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const inviteLink = tutorData?.tutor_invite_code
    ? `${appUrl}/join/${tutorData.tutor_invite_code}`
    : null;

  // Every student gets their own private room (one persistent space per pair).
  // Resolve each student's space id so the list can link/copy directly to it.
  const studentsWithSpace = await Promise.all(
    (students || []).map(async (s) => {
      const space = await getOrCreateLessonSpace(user.id, s.id);
      return { ...s, spaceId: space.id };
    })
  );

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
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          {/* Class code — students type this to join your class */}
          {tutorData?.tutor_invite_code && (
            <div className="flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
              <UserPlus className="w-5 h-5 text-primary dark:text-primary-400 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-primary-900 dark:text-primary-100 font-medium">Class code</p>
                <p className="text-primary dark:text-primary-400 font-mono font-bold tracking-widest text-lg leading-tight">
                  {tutorData.tutor_invite_code}
                </p>
              </div>
              <CopyButton text={tutorData.tutor_invite_code} />
            </div>
          )}

          {/* Invite Link Box */}
          {inviteLink && (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="text-sm">
                <p className="text-gray-700 dark:text-gray-200 font-medium">Or share a link</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs truncate max-w-[200px]">
                  {inviteLink}
                </p>
              </div>
              <CopyButton text={inviteLink} />
            </div>
          )}
        </div>
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

      {/* Open class requests */}
      <ClassRequests requests={classRequests} />

      {/* Pending join requests */}
      <PendingRequests requests={pendingRequests} />

      {/* Students List */}
      <StudentsList students={studentsWithSpace} inviteLink={inviteLink} />
    </div>
  );
}