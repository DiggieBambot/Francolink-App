// src/app/(tutor)/tutor/schedule/page.tsx
import { BookingCalendar } from "@/components/tutor/booking-calendar";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { UpcomingClasses } from "@/components/dashboard/upcoming-classes";
import { getUpcomingClasses } from "@/lib/booking/upcoming";
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Video,
  Users,
  BookOpen
} from 'lucide-react';

export default async function TutorSchedulePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get current date info
  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Fetch all sessions for this tutor
  const { data: sessions } = await supabase
    .from('tutor_sessions')
    .select(`
      id,
      title,
      scheduled_at,
      status,
      current_page,
      lessons (
        id,
        title
      )
    `)
    .eq('tutor_id', user.id)
    .order('scheduled_at', { ascending: true });

  // Get participant counts
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

  // Group sessions by date
  const sessionsByDate: Record<string, any[]> = {};
  sessionsWithCounts.forEach(session => {
    if (session.scheduled_at) {
      const date = new Date(session.scheduled_at).toDateString();
      if (!sessionsByDate[date]) {
        sessionsByDate[date] = [];
      }
      sessionsByDate[date].push(session);
    }
  });

  // Get upcoming sessions (next 7 days)
  const upcomingSessions = sessionsWithCounts.filter(s => {
    if (!s.scheduled_at) return false;
    const sessionDate = new Date(s.scheduled_at);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return sessionDate >= now && sessionDate <= weekFromNow;
  });

  // Get today's sessions
  const todaySessions = sessionsWithCounts.filter(s => {
    if (!s.scheduled_at) return false;
    return new Date(s.scheduled_at).toDateString() === now.toDateString();
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'scheduled': return 'bg-primary-100 text-primary border-primary-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // The lessons students have actually BOOKED AND PAID FOR.
  //
  // Everything else on this page reads tutor_sessions, which is the older
  // "tutor creates a session and assigns students" flow. Both exist, but a
  // booking is the one with money against it and a room attached — and it was
  // appearing on neither of the tutor's two schedule pages.
  let bookedClasses: Awaited<ReturnType<typeof getUpcomingClasses>> = [];
  try {
    bookedClasses = await getUpcomingClasses(user.id, "tutor", { limit: 12 });
  } catch (e) {
    console.error("[tutor/schedule] booked classes failed", e);
  }

  // A month's worth either side, for the calendar. A list answers "what is
  // next"; a grid answers "how full am I", which is the question behind
  // opening more availability or taking a week off.
  const svcCal = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  // Reuse the page's single `now` rather than reading the clock again —
  // one timestamp per render keeps the list and the grid describing the same
  // instant, and the lint rule that flags a second read is right to.
  const calFrom = new Date(now.getTime() - 62 * 86400_000).toISOString();
  const { data: calRows } = await svcCal
    .from("bookings")
    .select("id, starts_at, duration_minutes, student_id, room_session_id, status")
    .eq("tutor_id", user.id)
    // No-shows belong on the grid too: a week with two students who never
    // turned up is a different week from one with two fewer lessons, and only
    // one of them is a problem worth seeing.
    .in("status", ["confirmed", "completed", "no_show_student", "no_show_tutor"])
    .gte("starts_at", calFrom)
    .order("starts_at", { ascending: true })
    .limit(400);

  const calStudentIds = [...new Set((calRows ?? []).map((b) => b.student_id))];
  const calNames = new Map<string, string>();
  if (calStudentIds.length > 0) {
    const { data: calPeople } = await svcCal
      .from("users")
      .select("id, name, email")
      .in("id", calStudentIds);
    for (const p of calPeople ?? []) {
      calNames.set(p.id, p.name?.trim() || p.email?.split("@")[0] || "Student");
    }
  }
  const calendarBookings = (calRows ?? []).map((b) => ({
    id: b.id as string,
    startsAt: b.starts_at as string,
    durationMinutes: b.duration_minutes as number,
    studentName: calNames.get(b.student_id) ?? "Student",
    roomId: (b.room_session_id as string) ?? null,
    status: b.status as string,
  }));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Schedule</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your teaching calendar
          </p>
        </div>
        <Link
          href="/tutor/sessions"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Session
        </Link>
      </div>

      {/* The week itself, directly under its own heading. It was rendering
          ABOVE the page title, which made the calendar look like something
          that had escaped from another page. */}
      <UpcomingClasses classes={bookedClasses} role="tutor" />

      <div className="mb-8">
        <BookingCalendar bookings={calendarBookings} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-xl">
              <Calendar className="w-6 h-6 text-primary dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Today's Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {todaySessions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {upcomingSessions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
              <Video className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {sessions?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Today - {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
            </div>
            
            {todaySessions.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {todaySessions.map((session) => (
                  <div key={session.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatTime(session.scheduled_at)}
                          </p>
                        </div>
                        <div className="h-12 w-px bg-gray-200 dark:bg-gray-600" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {session.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {session.lessons && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {session.lessons.title}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {session.participant_count} students
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                        <Link
                          href={`/tutor/sessions/${session.id}`}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            session.status === 'active'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-primary text-white hover:bg-primary-800'
                          }`}
                        >
                          {session.status === 'active' ? 'Join' : 'Open'}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No sessions scheduled for today</p>
                <Link
                  href="/tutor/sessions"
                  className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Schedule a session
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upcoming Sessions
              </h2>
            </div>
            
            {upcomingSessions.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {upcomingSessions.slice(0, 5).map((session) => (
                  <Link
                    key={session.id}
                    href={`/tutor/sessions/${session.id}`}
                    className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {session.participant_count} students
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {session.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(session.scheduled_at)} at {formatTime(session.scheduled_at)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No upcoming sessions
              </div>
            )}

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/tutor/sessions"
                className="block text-center text-sm text-primary hover:underline"
              >
                View all sessions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}