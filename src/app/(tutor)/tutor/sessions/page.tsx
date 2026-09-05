// src/app/(tutor)/tutor/sessions/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SessionsList } from '@/components/session/sessions-list';
import { UpcomingClasses } from '@/components/dashboard/upcoming-classes';
import { getUpcomingClasses } from '@/lib/booking/upcoming';
import { CalendarSubscribe } from '@/components/calendar/calendar-subscribe';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { History } from 'lucide-react';

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

  // The lessons students actually booked and paid for.
  //
  // Everything above reads tutor_sessions — the older "create a session and
  // assign students" flow. A booking is the other thing entirely: money
  // against it, a room attached, and a student expecting to be met. This page
  // said "No sessions yet" to a tutor with a class starting in ten minutes,
  // because it was answering a different question from the one being asked.
  let booked: Awaited<ReturnType<typeof getUpcomingClasses>> = [];
  try {
    booked = await getUpcomingClasses(user.id, 'tutor', { limit: 12 });
  } catch (e) {
    console.error('[tutor/sessions] booked classes failed', e);
  }

  // And the ones already taught, so this page is a record and not only a diary.
  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: past } = await svc
    .from('bookings')
    .select('id, starts_at, duration_minutes, status, student_id, tutor_pay_cents')
    .eq('tutor_id', user.id)
    .in('status', ['completed', 'no_show_student', 'no_show_tutor'])
    .order('starts_at', { ascending: false })
    .limit(15);

  const studentIds = [...new Set((past ?? []).map((b) => b.student_id))];
  const nameById = new Map<string, string>();
  if (studentIds.length > 0) {
    const { data: people } = await svc
      .from('users')
      .select('id, name, email')
      .in('id', studentIds);
    for (const p of people ?? []) {
      nameById.set(p.id, p.name?.trim() || p.email?.split('@')[0] || 'Student');
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <UpcomingClasses classes={booked} role="tutor" />

      {(past ?? []).length > 0 ? (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <History className="h-4 w-4 text-gray-400" />
            Lessons taught
          </h2>
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
            {(past ?? []).map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {nameById.get(b.student_id) ?? 'Student'}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {new Date(b.starts_at).toLocaleString([], {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    · {b.duration_minutes} min
                  </p>
                </div>
                {b.status === 'completed' ? (
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-500">
                    ${((b.tutor_pay_cents ?? 0) / 100).toFixed(2)}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
                    {b.status === 'no_show_student' ? 'Student absent' : 'Marked absent'}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <Link
            href="/tutor/students"
            className="mt-2 inline-block text-xs font-semibold text-primary-500 hover:underline"
          >
            Per-student history →
          </Link>
        </section>
      ) : null}

      {/* Where a tutor already lives. Subscribing once beats checking a page. */}
      <CalendarSubscribe />

      <SessionsList sessions={sessionsWithCounts} />
    </div>
  );
}