// src/app/(tutor)/tutor/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Video,
  BookOpen,
  ArrowRight
} from "lucide-react";

export default async function TutorDashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get tutor's commission balance
  const { data: tutorData } = await supabase
    .from('users')
    .select('commission_balance, tutor_plan, name')
    .eq('id', user.id)
    .single();

  // Count referred students
  const { count: totalStudents } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('referred_by_tutor_id', user.id);

  // Count paying students
  const { count: payingStudents } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('referred_by_tutor_id', user.id)
    .neq('subscription_plan', 'FREE');

  // Count active sessions
  const { count: activeSessions } = await supabase
    .from('tutor_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('tutor_id', user.id)
    .eq('status', 'active');

  // Count upcoming sessions
  const { count: upcomingSessions } = await supabase
    .from('tutor_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('tutor_id', user.id)
    .eq('status', 'scheduled');

  const commissionBalance = parseFloat(tutorData?.commission_balance || '0');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {tutorData?.name || 'Tutor'}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what's happening with your students
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Students</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalStudents || 0}</p>
          <p className="text-sm text-gray-500 mt-1">
            {payingStudents || 0} paying
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-100">Commission Balance</span>
            <DollarSign className="w-5 h-5 text-green-100" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(commissionBalance)}</p>
          <Link 
            href="/tutor/commissions"
            className="text-sm text-green-100 hover:text-white mt-1 inline-flex items-center gap-1"
          >
            View details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Active Sessions</span>
            <Video className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeSessions || 0}</p>
          <p className="text-sm text-gray-500 mt-1">
            {upcomingSessions || 0} upcoming
          </p>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Conversion Rate</span>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalStudents ? Math.round(((payingStudents || 0) / totalStudents) * 100) : 0}%
          </p>
          <p className="text-sm text-gray-500 mt-1">
            students paying
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/tutor/sessions"
          className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Live Sessions</h3>
              <p className="text-sm text-gray-500">Manage your teaching sessions</p>
            </div>
          </div>
        </Link>

        <Link
          href="/tutor/students"
          className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">My Students</h3>
              <p className="text-sm text-gray-500">Track student progress</p>
            </div>
          </div>
        </Link>

        <Link
          href="/tutor/commissions"
          className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Commissions</h3>
              <p className="text-sm text-gray-500">View earnings & withdraw</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}